<script setup>
import { ref, reactive, onMounted } from 'vue';
import {
  MapPin, Clock, Camera, FileText, HeartHandshake, Users,
  CheckCircle2, XCircle, X
} from 'lucide-vue-next';
import collaborateurService from '@/services/collaborateurService';

const ongletActif = ref('ouverts'); // 'ouverts' | 'mes-evenements'

// ---------------- Signalements ouverts a une proposition ----------------
const signalements = ref([]);
const chargementSignalements = ref(true);
const signalementCible = ref(null); // signalement selectionne pour proposer
const formulaireProposition = reactive({ titre: '', date_evenement: '', message: '' });
const envoiPropositionEnCours = ref(false);
const erreurProposition = ref('');

async function chargerSignalements() {
  chargementSignalements.value = true;
  try {
    const data = await collaborateurService.getSignalements();
    signalements.value = data.signalements || [];
  } catch (e) {
    console.error(e);
  } finally {
    chargementSignalements.value = false;
  }
}

function ouvrirFormulaireProposition(s) {
  signalementCible.value = s;
  formulaireProposition.titre = '';
  formulaireProposition.date_evenement = '';
  formulaireProposition.message = '';
  erreurProposition.value = '';
}
function fermerFormulaireProposition() { signalementCible.value = null; }

async function soumettreProposition() {
  erreurProposition.value = '';
  envoiPropositionEnCours.value = true;
  try {
    await collaborateurService.proposerSolution(signalementCible.value.id, { ...formulaireProposition });
    fermerFormulaireProposition();
    await chargerMesEvenements();
    ongletActif.value = 'mes-evenements';
  } catch (e) {
    erreurProposition.value = e.response?.data?.message || 'Une erreur est survenue.';
  } finally {
    envoiPropositionEnCours.value = false;
  }
}

// ---------------- Mes evenements ----------------
const mesEvenements = ref([]);
const chargementMesEvenements = ref(true);

async function chargerMesEvenements() {
  chargementMesEvenements.value = true;
  try {
    const data = await collaborateurService.mesPropositions();
    mesEvenements.value = data.propositions || [];
  } catch (e) {
    console.error(e);
  } finally {
    chargementMesEvenements.value = false;
  }
}

// Modal "Demarrer" (photo avant)
const evenementADemarrer = ref(null);
const fichierPhotoAvant = ref(null);
const envoiDemarrageEnCours = ref(false);
const erreurDemarrage = ref('');

function ouvrirDemarrage(e) { evenementADemarrer.value = e; fichierPhotoAvant.value = null; erreurDemarrage.value = ''; }
function fermerDemarrage() { evenementADemarrer.value = null; }

async function confirmerDemarrage() {
  if (!fichierPhotoAvant.value) { erreurDemarrage.value = 'La photo du lieu est obligatoire.'; return; }
  envoiDemarrageEnCours.value = true;
  try {
    await collaborateurService.demarrerAssainissement(evenementADemarrer.value.id, fichierPhotoAvant.value);
    fermerDemarrage();
    await chargerMesEvenements();
  } catch (e) {
    erreurDemarrage.value = e.response?.data?.message || 'Une erreur est survenue.';
  } finally {
    envoiDemarrageEnCours.value = false;
  }
}

// Modal "Rapport final" (photo apres + texte)
const evenementARapporter = ref(null);
const texteRapport = ref('');
const fichierPhotoApres = ref(null);
const envoiRapportEnCours = ref(false);
const erreurRapport = ref('');

function ouvrirRapport(e) { evenementARapporter.value = e; texteRapport.value = ''; fichierPhotoApres.value = null; erreurRapport.value = ''; }
function fermerRapport() { evenementARapporter.value = null; }

async function confirmerRapport() {
  if (!texteRapport.value || !fichierPhotoApres.value) {
    erreurRapport.value = 'Le rapport et la photo du lieu après intervention sont obligatoires.';
    return;
  }
  envoiRapportEnCours.value = true;
  try {
    await collaborateurService.envoyerRapport(evenementARapporter.value.id, texteRapport.value, fichierPhotoApres.value);
    fermerRapport();
    await chargerMesEvenements();
  } catch (e) {
    erreurRapport.value = e.response?.data?.message || 'Une erreur est survenue.';
  } finally {
    envoiRapportEnCours.value = false;
  }
}

function badgeEtat(s) {
  return {
    EN_ATTENTE: { classe: 'bg-orange-50 text-orange-600', label: 'En attente de validation admin' },
    ACCEPTEE: { classe: 'bg-sky-50 text-sky-600', label: 'Feu vert donné — à démarrer' },
    ASSAINISSEMENT_EN_COURS: { classe: 'bg-violet-50 text-violet-600', label: 'En cours — rapport à envoyer' },
    RAPPORT_ENVOYE: { classe: 'bg-amber-50 text-amber-600', label: 'Rapport en attente de validation' },
    CLOTUREE: { classe: 'bg-primary-50 text-primary-700', label: 'Résolu ✓' },
    REFUSEE: { classe: 'bg-red-50 text-red-600', label: 'Refusée' }
  }[s] || { classe: 'bg-gray-100 text-gray-600', label: s };
}

onMounted(() => { chargerSignalements(); chargerMesEvenements(); });
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900">Espace collaborateur</h1>
      <p class="text-gray-500 mt-1">Proposez un assainissement, puis suivez vos interventions de terrain.</p>
    </div>

    <div class="flex justify-center gap-2 border-b border-gray-100">
      <button @click="ongletActif = 'ouverts'"
        :class="ongletActif === 'ouverts' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
        class="px-5 py-3 text-sm font-semibold border-b-2 transition">Signalements ouverts</button>
      <button @click="ongletActif = 'mes-evenements'"
        :class="ongletActif === 'mes-evenements' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
        class="px-5 py-3 text-sm font-semibold border-b-2 transition">Mes événements</button>
    </div>

    <!-- ================= SIGNALEMENTS OUVERTS ================= -->
    <div v-if="ongletActif === 'ouverts'" class="max-w-3xl mx-auto space-y-3">
      <p v-if="chargementSignalements" class="text-center text-sm text-gray-400 py-10">Chargement…</p>
      <p v-else-if="!signalements.length" class="text-center text-sm text-gray-400 py-10">Aucun signalement ouvert pour le moment.</p>

      <div v-for="s in signalements" :key="s.id" class="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="font-semibold text-gray-800">{{ s.type_signalement }}</p>
          <p class="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin :size="12" /> {{ s.commune }}</p>
          <p v-if="s.description" class="text-xs text-gray-400 mt-1 truncate max-w-md">{{ s.description }}</p>
          <p v-if="s.collaboration_statut" class="text-[11px] text-amber-600 mt-1">Déjà pris en charge par un autre collaborateur</p>
        </div>
        <button @click="ouvrirFormulaireProposition(s)" :disabled="!!s.collaboration_statut"
          class="shrink-0 bg-primary-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-30 disabled:cursor-not-allowed">
          Proposer un événement
        </button>
      </div>
    </div>

    <!-- ================= MES EVENEMENTS ================= -->
    <div v-else class="max-w-3xl mx-auto space-y-3">
      <p v-if="chargementMesEvenements" class="text-center text-sm text-gray-400 py-10">Chargement…</p>
      <p v-else-if="!mesEvenements.length" class="text-center text-sm text-gray-400 py-10">Vous n'avez encore proposé aucun événement.</p>

      <div v-for="e in mesEvenements" :key="e.id" class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span :class="badgeEtat(e.statut).classe" class="px-2 py-1 rounded-full text-[11px] font-semibold">{{ badgeEtat(e.statut).label }}</span>
            <h3 class="font-bold text-gray-800 mt-2">{{ e.titre }}</h3>
            <p class="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin :size="12" /> {{ e.commune }} — {{ e.type_signalement }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xl font-black text-primary-600">{{ e.nb_participants }}</p>
            <p class="text-[10px] text-gray-400 flex items-center gap-1"><Users :size="10" /> participants</p>
          </div>
        </div>

        <button v-if="e.statut === 'ACCEPTEE'" @click="ouvrirDemarrage(e)"
          class="w-full mt-4 flex items-center justify-center gap-2 bg-sky-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-sky-700 transition">
          <Camera :size="14" /> Démarrer l'assainissement (photo du lieu)
        </button>

        <button v-else-if="e.statut === 'ASSAINISSEMENT_EN_COURS'" @click="ouvrirRapport(e)"
          class="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition">
          <FileText :size="14" /> Envoyer le rapport final
        </button>
      </div>
    </div>

    <!-- ============ MODAL : PROPOSER UN EVENEMENT ============ -->
    <Transition name="fondu">
      <div v-if="signalementCible" @click="fermerFormulaireProposition" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Proposer un événement</h3>
            <button @click="fermerFormulaireProposition" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X :size="18" /></button>
          </div>
          <p class="text-xs text-gray-500 mb-4">{{ signalementCible.type_signalement }} — {{ signalementCible.commune }}</p>

          <form @submit.prevent="soumettreProposition" class="space-y-4">
            <div>
              <label class="text-sm text-gray-600">Titre de l'événement</label>
              <input v-model="formulaireProposition.titre" type="text" required placeholder="Ex : Grand nettoyage de l'avenue X"
                class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="text-sm text-gray-600">Date et heure prévues</label>
              <input v-model="formulaireProposition.date_evenement" type="datetime-local"
                class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="text-sm text-gray-600">Message / rapport détaillé</label>
              <textarea v-model="formulaireProposition.message" rows="3" required
                placeholder="Décrivez votre plan d'intervention pour ce signalement..."
                class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
            </div>
            <p v-if="erreurProposition" class="text-sm text-red-500">{{ erreurProposition }}</p>
            <button type="submit" :disabled="envoiPropositionEnCours"
              class="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-40">
              {{ envoiPropositionEnCours ? 'Envoi...' : "Envoyer à l'administrateur" }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ============ MODAL : DEMARRER (photo avant) ============ -->
    <Transition name="fondu">
      <div v-if="evenementADemarrer" @click="fermerDemarrage" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Démarrer l'assainissement</h3>
            <button @click="fermerDemarrage" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X :size="18" /></button>
          </div>
          <p class="text-xs text-gray-500 mb-4">Prenez une photo du lieu, avec toute la saleté visible, avant de commencer.</p>

          <label class="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 transition">
            <Camera :size="28" class="mx-auto text-gray-400 mb-2" />
            <span class="text-sm text-gray-500">{{ fichierPhotoAvant?.name || 'Touchez pour prendre/choisir une photo' }}</span>
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="fichierPhotoAvant = $event.target.files[0]" />
          </label>

          <p v-if="erreurDemarrage" class="text-sm text-red-500 mt-3">{{ erreurDemarrage }}</p>

          <button @click="confirmerDemarrage" :disabled="envoiDemarrageEnCours"
            class="w-full mt-4 bg-sky-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-40">
            {{ envoiDemarrageEnCours ? 'Envoi...' : "Confirmer le démarrage" }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ============ MODAL : RAPPORT FINAL (photo apres + texte) ============ -->
    <Transition name="fondu">
      <div v-if="evenementARapporter" @click="fermerRapport" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Rapport final</h3>
            <button @click="fermerRapport" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X :size="18" /></button>
          </div>

          <label class="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 transition mb-4">
            <Camera :size="28" class="mx-auto text-gray-400 mb-2" />
            <span class="text-sm text-gray-500">{{ fichierPhotoApres?.name || 'Photo du lieu après intervention' }}</span>
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="fichierPhotoApres = $event.target.files[0]" />
          </label>

          <textarea v-model="texteRapport" rows="4" placeholder="Décrivez comment s'est déroulé l'assainissement..."
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>

          <p v-if="erreurRapport" class="text-sm text-red-500 mt-3">{{ erreurRapport }}</p>

          <button @click="confirmerRapport" :disabled="envoiRapportEnCours"
            class="w-full mt-4 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-40">
            {{ envoiRapportEnCours ? 'Envoi...' : "Envoyer à l'administrateur" }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fondu-enter-active, .fondu-leave-active { transition: opacity 0.2s ease; }
.fondu-enter-from, .fondu-leave-to { opacity: 0; }
</style>