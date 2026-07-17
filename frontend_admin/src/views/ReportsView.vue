<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  MapPin, Clock, Image as ImageIcon, X, CheckCircle2, XCircle,
  ExternalLink, AlertTriangle, HelpCircle, RefreshCw
} from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';
import socketService from '@/services/socketService';
import api from '@/services/api';

const signalements = ref([]);
const chargement = ref(true);
const filtreStatut = ref('');       // '' = tous, sinon EN_COURS / VALIDE / INVALIDE
const filtreCoherence = ref('');    // '' = tous, 'incoherent' = uniquement les incoherents
const signalementSelectionne = ref(null);
const enTraitementId = ref(null);   // id du signalement en cours de validation/invalidation (desactive les boutons)

const baseUrlBackend = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

let handlerNouveauSignalement = null;

async function chargerSignalements() {
  chargement.value = true;
  try {
    const filtres = filtreStatut.value ? { statut: filtreStatut.value } : {};
    const data = await adminService.getSignalements(filtres);
    signalements.value = data.signalements || [];
  } catch (e) {
    console.error('Erreur chargement signalements:', e);
  } finally {
    chargement.value = false;
  }
}

const signalementsAffiches = computed(() => {
  if (filtreCoherence.value === 'incoherent') {
    return signalements.value.filter(s => s.commune_coherente === 0 || s.commune_coherente === false);
  }
  return signalements.value;
});

function badgeStatut(statut) {
  return {
    EN_COURS: 'bg-orange-50 text-orange-600',
    VALIDE: 'bg-primary-50 text-primary-700',
    INVALIDE: 'bg-red-50 text-red-600'
  }[statut] || 'bg-gray-100 text-gray-600';
}

function labelStatut(statut) {
  return { EN_COURS: 'En cours', VALIDE: 'Validé', INVALIDE: 'Invalidé' }[statut] || statut;
}

function iconeCoherence(s) {
  if (s.commune_coherente === 1 || s.commune_coherente === true) return { icone: CheckCircle2, couleur: 'text-primary-600', titre: 'Commune cohérente avec le GPS' };
  if (s.commune_coherente === 0 || s.commune_coherente === false) return { icone: AlertTriangle, couleur: 'text-red-500', titre: 'Commune incohérente avec le GPS' };
  return { icone: HelpCircle, couleur: 'text-gray-300', titre: 'Cohérence non vérifiable' };
}

function lienPhoto(lien) {
  return lien ? `${baseUrlBackend}${lien}` : null;
}

function lienCarte(s) {
  return `https://www.google.com/maps?q=${s.latitude},${s.longitude}`;
}

function ouvrirDetail(s) {
  signalementSelectionne.value = s;
}
function fermerDetail() {
  signalementSelectionne.value = null;
}

async function traiter(id, statut) {
  enTraitementId.value = id;
  try {
    if (statut === 'VALIDE') {
      await adminService.validerSignalement(id);
    } else {
      await adminService.invaliderSignalement(id);
    }
    // Mise a jour optimiste locale, sans recharger toute la liste.
    const s = signalements.value.find(s => s.id === id);
    if (s) s.statut = statut;
    if (signalementSelectionne.value?.id === id) signalementSelectionne.value.statut = statut;
  } catch (e) {
    console.error('Erreur traitement signalement:', e);
  } finally {
    enTraitementId.value = null;
  }
}

onMounted(() => {
  chargerSignalements();

  // Mise a jour en temps reel : un nouveau signalement apparait
  // instantanement en tete de tableau, sans attendre un rechargement.
  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (socket) {
    handlerNouveauSignalement = (s) => {
      if (signalements.value.some(x => x.id === s.id)) return;
      // N'ajoute a la liste affichee que si coherent avec le filtre statut actif.
      if (!filtreStatut.value || filtreStatut.value === s.statut) {
        signalements.value = [s, ...signalements.value];
      }
    };
    socket.on('admin:nouveau_signalement', handlerNouveauSignalement);
  }
});
onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket && handlerNouveauSignalement) {
    socket.off('admin:nouveau_signalement', handlerNouveauSignalement);
  }
});
</script>

<template>
  <div>
    <Topbar titre="Signalements" sous-titre="Tous les signalements citoyens, en temps réel" />

    <div class="p-6 space-y-4">

      <!-- FILTRES -->
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="filtreStatut" @change="chargerSignalements"
          class="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white">
          <option value="">Tous les statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="VALIDE">Validé</option>
          <option value="INVALIDE">Invalidé</option>
        </select>

        <select v-model="filtreCoherence"
          class="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white">
          <option value="">Toutes les cohérences GPS</option>
          <option value="incoherent">Incohérents uniquement</option>
        </select>

        <button @click="chargerSignalements"
          class="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw :size="14" :class="chargement && 'animate-spin'" /> Actualiser
        </button>
      </div>

      <!-- VUE MOBILE : cartes, tap pour ouvrir le detail complet (modal) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="s in signalementsAffiches" :key="s.id"
          @click="ouvrirDetail(s)"
          class="bg-white rounded-2xl shadow-sm p-4 active:bg-gray-50 transition"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-gray-800 font-semibold truncate">{{ s.type_signalement }}</p>
              <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin :size="12" /> {{ s.commune }}</p>
            </div>
            <span :class="badgeStatut(s.statut)" class="px-2 py-1 rounded-full text-[11px] font-semibold shrink-0">{{ labelStatut(s.statut) }}</span>
          </div>

          <p v-if="s.description" class="text-xs text-gray-500 mt-2 line-clamp-2">{{ s.description }}</p>

          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1"><Clock :size="12" /> {{ s.date_signale }}</span>
              <component :is="iconeCoherence(s).icone" :size="14" :class="iconeCoherence(s).couleur" />
              <ImageIcon v-if="s.photo_lien" :size="13" class="text-primary-400" />
            </div>
            <p class="text-xs text-gray-400 truncate max-w-[120px]">{{ s.utilisateur_prenom }} {{ s.utilisateur_nom }}</p>
          </div>

          <div v-if="s.statut === 'EN_COURS'" class="flex gap-2 mt-3" @click.stop>
            <button @click="traiter(s.id, 'VALIDE')" :disabled="enTraitementId === s.id"
              class="flex-1 text-xs font-semibold text-primary-600 bg-primary-50 py-2 rounded-lg disabled:opacity-40">
              Valider
            </button>
            <button @click="traiter(s.id, 'INVALIDE')" :disabled="enTraitementId === s.id"
              class="flex-1 text-xs font-semibold text-red-500 bg-red-50 py-2 rounded-lg disabled:opacity-40">
              Invalider
            </button>
          </div>
        </div>

        <p v-if="!chargement && !signalementsAffiches.length" class="text-center text-xs text-gray-400 py-8">Aucun signalement pour ces filtres.</p>
        <p v-if="chargement" class="text-center text-xs text-gray-400 py-8">Chargement…</p>
      </div>

      <!-- TABLEAU DESKTOP -->
      <div class="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table class="w-full text-sm min-w-[900px]">
          <thead>
            <tr class="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th class="px-5 py-3 font-medium">Type</th>
              <th class="px-5 py-3 font-medium">Commune</th>
              <th class="px-5 py-3 font-medium text-center">GPS</th>
              <th class="px-5 py-3 font-medium">Citoyen</th>
              <th class="px-5 py-3 font-medium">Description</th>
              <th class="px-5 py-3 font-medium text-center">Photo</th>
              <th class="px-5 py-3 font-medium">Signalé le</th>
              <th class="px-5 py-3 font-medium">Statut</th>
              <th class="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in signalementsAffiches" :key="s.id"
              @click="ouvrirDetail(s)"
              class="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
            >
              <td class="px-5 py-3 text-gray-800 font-medium">{{ s.type_signalement }}</td>
              <td class="px-5 py-3 text-gray-600">{{ s.commune }}</td>
              <td class="px-5 py-3 text-center">
                <component :is="iconeCoherence(s).icone" :size="16" :class="iconeCoherence(s).couleur" :title="iconeCoherence(s).titre" class="mx-auto" />
              </td>
              <td class="px-5 py-3 text-gray-600">
                {{ s.utilisateur_prenom }} {{ s.utilisateur_nom }}
                <span v-if="s.utilisateur_pseudo" class="text-xs text-gray-400 block">@{{ s.utilisateur_pseudo }}</span>
              </td>
              <td class="px-5 py-3 text-gray-500 max-w-[220px] truncate">{{ s.description || '—' }}</td>
              <td class="px-5 py-3 text-center">
                <ImageIcon v-if="s.photo_lien" :size="16" class="text-primary-500 mx-auto" />
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
              <td class="px-5 py-3 text-gray-500">
                {{ s.date_signale }}<span class="text-xs text-gray-400"> {{ s.heure_signale }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="badgeStatut(s.statut)" class="px-2 py-1 rounded-full text-xs font-semibold">{{ labelStatut(s.statut) }}</span>
              </td>
              <td class="px-5 py-3 text-right" @click.stop>
                <div v-if="s.statut === 'EN_COURS'" class="flex justify-end gap-2">
                  <button @click="traiter(s.id, 'VALIDE')" :disabled="enTraitementId === s.id"
                    class="text-xs font-semibold text-primary-600 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40">
                    Valider
                  </button>
                  <button @click="traiter(s.id, 'INVALIDE')" :disabled="enTraitementId === s.id"
                    class="text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40">
                    Invalider
                  </button>
                </div>
                <span v-else class="text-xs text-gray-300">Traité</span>
              </td>
            </tr>
            <tr v-if="!chargement && !signalementsAffiches.length">
              <td colspan="9" class="py-8 text-center text-xs text-gray-400">Aucun signalement pour ces filtres.</td>
            </tr>
            <tr v-if="chargement">
              <td colspan="9" class="py-8 text-center text-xs text-gray-400">Chargement…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL DETAIL : tous les champs, rien de cache -->
    <Transition name="fondu">
      <div v-if="signalementSelectionne" @click="fermerDetail" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white">
            <div>
              <p class="text-xs text-gray-400">Signalement #{{ signalementSelectionne.id }}</p>
              <h3 class="text-lg font-bold text-gray-900">{{ signalementSelectionne.type_signalement }}</h3>
            </div>
            <button @click="fermerDetail" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
              <X :size="18" />
            </button>
          </div>

          <div class="p-5 space-y-4">
            <img v-if="lienPhoto(signalementSelectionne.photo_lien)" :src="lienPhoto(signalementSelectionne.photo_lien)" alt=""
              class="w-full h-56 object-cover rounded-xl" />

            <div class="flex items-center gap-2">
              <span :class="badgeStatut(signalementSelectionne.statut)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                {{ labelStatut(signalementSelectionne.statut) }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs" :class="iconeCoherence(signalementSelectionne).couleur">
                <component :is="iconeCoherence(signalementSelectionne).icone" :size="14" />
                {{ iconeCoherence(signalementSelectionne).titre }}
              </span>
            </div>

            <p class="text-sm text-gray-700 leading-relaxed">{{ signalementSelectionne.description || 'Aucune description fournie.' }}</p>

            <dl class="grid grid-cols-2 gap-y-3 text-sm border-t border-gray-100 pt-4">
              <dt class="text-gray-400">Commune</dt>
              <dd class="text-gray-800 flex items-center gap-1"><MapPin :size="13" /> {{ signalementSelectionne.commune }}</dd>

              <dt class="text-gray-400">Citoyen</dt>
              <dd class="text-gray-800">{{ signalementSelectionne.utilisateur_prenom }} {{ signalementSelectionne.utilisateur_postnom }} {{ signalementSelectionne.utilisateur_nom }}</dd>

              <dt class="text-gray-400">Signalé le</dt>
              <dd class="text-gray-800 flex items-center gap-1"><Clock :size="13" /> {{ signalementSelectionne.date_signale }} à {{ signalementSelectionne.heure_signale }}</dd>

              <template v-if="signalementSelectionne.date_analyse">
                <dt class="text-gray-400">Traité le</dt>
                <dd class="text-gray-800">{{ signalementSelectionne.date_analyse }} à {{ signalementSelectionne.heure_analyse }}</dd>
              </template>

              <dt class="text-gray-400">Coordonnées GPS</dt>
              <dd>
                <a :href="lienCarte(signalementSelectionne)" target="_blank" rel="noopener"
                  class="text-primary-600 hover:underline inline-flex items-center gap-1">
                  {{ Number(signalementSelectionne.latitude).toFixed(5) }}, {{ Number(signalementSelectionne.longitude).toFixed(5) }}
                  <ExternalLink :size="12" />
                </a>
              </dd>
            </dl>

            <div v-if="signalementSelectionne.statut === 'EN_COURS'" class="flex gap-3 pt-2">
              <button @click="traiter(signalementSelectionne.id, 'VALIDE')" :disabled="enTraitementId === signalementSelectionne.id"
                class="flex-1 bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-40">
                Valider
              </button>
              <button @click="traiter(signalementSelectionne.id, 'INVALIDE')" :disabled="enTraitementId === signalementSelectionne.id"
                class="flex-1 bg-red-50 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-100 transition disabled:opacity-40">
                Invalider
              </button>
            </div>
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