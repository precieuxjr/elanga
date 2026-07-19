<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Users, HeartHandshake, Building2, Clock, CheckCircle2, XCircle,
  FileText, Image as ImageIcon, RefreshCw, ChevronDown, MapPin
} from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';
import socketService from '@/services/socketService';
import api from '@/services/api';

const baseUrlBackend = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const ongletActif = ref('demandes'); // 'demandes' | 'propositions'

// ---------------- Demandes de statut collaborateur ----------------
const demandes = ref([]);
const chargementDemandes = ref(true);
const filtreDemandes = ref('EN_ATTENTE');
const enTraitementDemandeId = ref(null);

async function chargerDemandes() {
  chargementDemandes.value = true;
  try {
    const data = await adminService.getDemandesCollaborateur(
      filtreDemandes.value ? { statut: filtreDemandes.value } : {}
    );
    demandes.value = data.demandes || [];
  } catch (e) {
    console.error('Erreur chargement demandes:', e);
  } finally {
    chargementDemandes.value = false;
  }
}

async function traiterDemande(id, action) {
  enTraitementDemandeId.value = id;
  try {
    if (action === 'accepter') await adminService.accepterDemandeCollaborateur(id);
    else await adminService.refuserDemandeCollaborateur(id);
    demandes.value = demandes.value.filter(d => d.id !== id);
  } catch (e) {
    console.error('Erreur traitement demande:', e);
  } finally {
    enTraitementDemandeId.value = null;
  }
}

// ---------------- Propositions de collaboration ----------------
const collaborations = ref([]);
const chargementCollabs = ref(true);
const filtreCollabs = ref('');
const enTraitementCollabId = ref(null);
const collaborationSelectionnee = ref(null);

async function chargerCollaborations() {
  chargementCollabs.value = true;
  try {
    const data = await adminService.getCollaborations(
      filtreCollabs.value ? { statut: filtreCollabs.value } : {}
    );
    collaborations.value = data.collaborations || [];
  } catch (e) {
    console.error('Erreur chargement collaborations:', e);
  } finally {
    chargementCollabs.value = false;
  }
}

async function traiterCollaboration(id, action) {
  enTraitementCollabId.value = id;
  try {
    if (action === 'accepter') await adminService.accepterCollaboration(id);
    else await adminService.refuserCollaboration(id);
    await chargerCollaborations();
  } catch (e) {
    console.error('Erreur traitement collaboration:', e);
  } finally {
    enTraitementCollabId.value = null;
  }
}

async function cloturer(id) {
  enTraitementCollabId.value = id;
  try {
    await adminService.cloturerCollaboration(id);
    collaborationSelectionnee.value = null;
    await chargerCollaborations();
  } catch (e) {
    console.error('Erreur cloture collaboration:', e);
  } finally {
    enTraitementCollabId.value = null;
  }
}

function ouvrirRapport(c) { collaborationSelectionnee.value = c; }
function fermerRapport() { collaborationSelectionnee.value = null; }
function lienPhoto(lien) { return lien ? `${baseUrlBackend}${lien}` : null; }

// ---------------- Badges / libelles ----------------
function badgeStatutDemande(s) {
  return {
    EN_ATTENTE: 'bg-orange-50 text-orange-600',
    ACCEPTEE: 'bg-primary-50 text-primary-700',
    REFUSEE: 'bg-red-50 text-red-600'
  }[s] || 'bg-gray-100 text-gray-600';
}
function labelStatutDemande(s) {
  return { EN_ATTENTE: 'En attente', ACCEPTEE: 'Acceptée', REFUSEE: 'Refusée' }[s] || s;
}
function badgeStatutCollab(s) {
  return {
    EN_ATTENTE: 'bg-orange-50 text-orange-600',
    ACCEPTEE: 'bg-sky-50 text-sky-600',
    ASSAINISSEMENT_EN_COURS: 'bg-violet-50 text-violet-600',
    RAPPORT_ENVOYE: 'bg-amber-50 text-amber-600',
    CLOTUREE: 'bg-primary-50 text-primary-700',
    REFUSEE: 'bg-red-50 text-red-600'
  }[s] || 'bg-gray-100 text-gray-600';
}
function labelStatutCollab(s) {
  return {
    EN_ATTENTE: 'En attente de feu vert',
    ACCEPTEE: 'Feu vert donné — pas encore démarré',
    ASSAINISSEMENT_EN_COURS: "Assainissement en cours sur le terrain",
    RAPPORT_ENVOYE: 'Rapport reçu — à valider',
    CLOTUREE: 'Clôturée (résolu)',
    REFUSEE: 'Refusée'
  }[s] || s;
}

// ---------------- Notifications temps reel ----------------
let handlerDemande = null, handlerProposition = null, handlerRapport = null;

onMounted(() => {
  chargerDemandes();
  chargerCollaborations();

  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (socket) {
    handlerDemande = (d) => { if (filtreDemandes.value === 'EN_ATTENTE' || !filtreDemandes.value) demandes.value = [d, ...demandes.value]; };
    handlerProposition = () => chargerCollaborations();
    handlerRapport = () => chargerCollaborations();
    socket.on('admin:nouvelle_demande_collaborateur', handlerDemande);
    socket.on('admin:nouvelle_proposition', handlerProposition);
    socket.on('admin:rapport_recu', handlerRapport);
  }
});
onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) {
    if (handlerDemande) socket.off('admin:nouvelle_demande_collaborateur', handlerDemande);
    if (handlerProposition) socket.off('admin:nouvelle_proposition', handlerProposition);
    if (handlerRapport) socket.off('admin:rapport_recu', handlerRapport);
  }
});

const nbDemandesAttente = computed(() => demandes.value.filter(d => d.statut === 'EN_ATTENTE').length);
const nbCollabsAttention = computed(() => collaborations.value.filter(c => ['EN_ATTENTE', 'RAPPORT_ENVOYE'].includes(c.statut)).length);
</script>

<template>
  <div>
    <Topbar titre="Collaborateurs" sous-titre="Demandes de statut et interventions de terrain" />

    <div class="p-4 md:p-6 space-y-5">

      <!-- ONGLETS -->
      <div class="flex gap-2 border-b border-gray-100">
        <button @click="ongletActif = 'demandes'"
          :class="ongletActif === 'demandes' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
          class="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition">
          <Users :size="16" /> Demandes de statut
          <span v-if="nbDemandesAttente" class="bg-orange-100 text-orange-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">{{ nbDemandesAttente }}</span>
        </button>
        <button @click="ongletActif = 'propositions'"
          :class="ongletActif === 'propositions' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
          class="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition">
          <HeartHandshake :size="16" /> Propositions &amp; rapports
          <span v-if="nbCollabsAttention" class="bg-orange-100 text-orange-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">{{ nbCollabsAttention }}</span>
        </button>
      </div>

      <!-- ================= ONGLET DEMANDES ================= -->
      <template v-if="ongletActif === 'demandes'">
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="filtreDemandes" @change="chargerDemandes"
            class="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white">
            <option value="EN_ATTENTE">En attente</option>
            <option value="ACCEPTEE">Acceptées</option>
            <option value="REFUSEE">Refusées</option>
            <option value="">Toutes</option>
          </select>
          <button @click="chargerDemandes" class="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <RefreshCw :size="14" :class="chargementDemandes && 'animate-spin'" /> Actualiser
          </button>
        </div>

        <p v-if="chargementDemandes" class="text-center text-xs text-gray-400 py-10">Chargement…</p>
        <p v-else-if="!demandes.length" class="text-center text-xs text-gray-400 py-10">Aucune demande pour ce filtre.</p>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <div v-for="d in demandes" :key="d.id" class="bg-white rounded-2xl shadow-sm p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <Building2 :size="18" />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-800 truncate">{{ d.nom_organisation }}</p>
                  <p class="text-xs text-gray-400">{{ d.type_organisation }}</p>
                </div>
              </div>
              <span :class="badgeStatutDemande(d.statut)" class="px-2 py-1 rounded-full text-[11px] font-semibold shrink-0">{{ labelStatutDemande(d.statut) }}</span>
            </div>

            <p class="text-xs text-gray-500 mt-3">
              Demandeur : {{ d.utilisateur_prenom }} {{ d.utilisateur_nom }} — {{ d.utilisateur_email }}
            </p>
            <p v-if="d.justification" class="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-3">{{ d.justification }}</p>
            <p class="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><Clock :size="11" /> {{ new Date(d.date_demande).toLocaleDateString('fr-FR') }}</p>

            <div v-if="d.statut === 'EN_ATTENTE'" class="flex gap-2 mt-4">
              <button @click="traiterDemande(d.id, 'accepter')" :disabled="enTraitementDemandeId === d.id"
                class="flex-1 bg-primary-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-40">
                Accepter
              </button>
              <button @click="traiterDemande(d.id, 'refuser')" :disabled="enTraitementDemandeId === d.id"
                class="flex-1 bg-red-50 text-red-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-100 transition disabled:opacity-40">
                Refuser
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ================= ONGLET PROPOSITIONS ================= -->
      <template v-else>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="filtreCollabs" @change="chargerCollaborations"
            class="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white">
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente de feu vert</option>
            <option value="ACCEPTEE">Intervention en cours</option>
            <option value="RAPPORT_ENVOYE">Rapport à valider</option>
            <option value="CLOTUREE">Clôturées</option>
            <option value="REFUSEE">Refusées</option>
          </select>
          <button @click="chargerCollaborations" class="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <RefreshCw :size="14" :class="chargementCollabs && 'animate-spin'" /> Actualiser
          </button>
        </div>

        <p v-if="chargementCollabs" class="text-center text-xs text-gray-400 py-10">Chargement…</p>
        <p v-else-if="!collaborations.length" class="text-center text-xs text-gray-400 py-10">Aucune proposition pour ce filtre.</p>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <div v-for="c in collaborations" :key="c.id" class="bg-white rounded-2xl shadow-sm p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-gray-800 truncate">{{ c.titre || c.type_signalement }}</p>
                <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin :size="12" /> {{ c.commune }} — {{ c.type_signalement }}</p>
                <p v-if="c.date_evenement" class="text-[11px] text-gray-400 mt-0.5">Prévu le {{ new Date(c.date_evenement).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) }}</p>
              </div>
              <div class="text-right shrink-0">
                <span :class="badgeStatutCollab(c.statut)" class="px-2 py-1 rounded-full text-[11px] font-semibold block">{{ labelStatutCollab(c.statut) }}</span>
                <p class="text-[11px] text-gray-400 mt-1">{{ c.nb_participants || 0 }} participant(s)</p>
              </div>
            </div>

            <p class="text-xs text-gray-500 mt-3">
              Collaborateur : {{ c.collaborateur_prenom }} {{ c.collaborateur_nom }}
              <span v-if="c.nom_organisation" class="text-gray-400">({{ c.nom_organisation }})</span>
            </p>
            <p class="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-3">{{ c.message }}</p>
            <p class="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><Clock :size="11" /> proposé le {{ new Date(c.date_proposition).toLocaleDateString('fr-FR') }}</p>

            <!-- Actions selon le statut -->
            <div v-if="c.statut === 'EN_ATTENTE'" class="flex gap-2 mt-4">
              <button @click="traiterCollaboration(c.id, 'accepter')" :disabled="enTraitementCollabId === c.id"
                class="flex-1 bg-primary-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-40">
                Donner le feu vert
              </button>
              <button @click="traiterCollaboration(c.id, 'refuser')" :disabled="enTraitementCollabId === c.id"
                class="flex-1 bg-red-50 text-red-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-100 transition disabled:opacity-40">
                Refuser
              </button>
            </div>

            <button v-else-if="c.statut === 'RAPPORT_ENVOYE'" @click="ouvrirRapport(c)"
              class="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition">
              <FileText :size="14" /> Examiner le rapport
            </button>

            <p v-else-if="c.statut === 'ACCEPTEE'" class="text-[11px] text-sky-600 mt-4 bg-sky-50 rounded-lg p-2.5 text-center">
              En attente du rapport du collaborateur.
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- ================= MODAL : EXAMEN DU RAPPORT ================= -->
    <Transition name="fondu">
      <div v-if="collaborationSelectionnee" @click="fermerRapport" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="p-5 border-b border-gray-100 sticky top-0 bg-white">
            <p class="text-xs text-gray-400">Rapport de collaboration #{{ collaborationSelectionnee.id }}</p>
            <h3 class="text-lg font-bold text-gray-900">{{ collaborationSelectionnee.type_signalement }} — {{ collaborationSelectionnee.commune }}</h3>
            <p class="text-xs text-gray-500 mt-1">
              Par {{ collaborationSelectionnee.collaborateur_prenom }} {{ collaborationSelectionnee.collaborateur_nom }}
              <span v-if="collaborationSelectionnee.nom_organisation">({{ collaborationSelectionnee.nom_organisation }})</span>
            </p>
          </div>

          <div class="p-5 space-y-5">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Avant intervention</p>
                <img :src="lienPhoto(collaborationSelectionnee.photo_avant_lien)" alt="Avant"
                  class="w-full h-48 object-cover rounded-xl bg-gray-100" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Après intervention</p>
                <img :src="lienPhoto(collaborationSelectionnee.photo_apres_lien)" alt="Après"
                  class="w-full h-48 object-cover rounded-xl bg-gray-100" />
              </div>
            </div>

            <div>
              <p class="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Rapport de situation</p>
              <p class="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{{ collaborationSelectionnee.rapport }}</p>
            </div>

            <p class="text-[11px] text-gray-400">
              Rapport envoyé le {{ new Date(collaborationSelectionnee.date_rapport).toLocaleDateString('fr-FR') }}
            </p>

            <div class="flex gap-3 pt-2 border-t border-gray-100">
              <button @click="cloturer(collaborationSelectionnee.id)" :disabled="enTraitementCollabId === collaborationSelectionnee.id"
                class="flex-1 bg-primary-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                <CheckCircle2 :size="16" /> Valider — marquer résolu et retirer de la carte
              </button>
            </div>
            <p class="text-[11px] text-gray-400 text-center">
              Le signalement passera au statut "Résolu" et disparaîtra automatiquement de la carte partagée.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fondu-enter-active, .fondu-leave-active { transition: opacity 0.2s ease; }
.fondu-enter-from, .fondu-leave-to { opacity: 0; }
</style>