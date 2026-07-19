<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Calendar, MapPin, Users, HeartHandshake, CheckCircle2, Clock,
  TrendingUp, Image as ImageIcon
} from 'lucide-vue-next';
import collaborateurService from '@/services/collaborateurService';
import socketService from '@/services/socketService';
import api from '@/services/api';

const baseUrlBackend = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
function lienPhoto(lien) { return lien ? `${baseUrlBackend}${lien}` : null; }

const ongletActif = ref('venir'); // 'venir' | 'stats'

const evenements = ref([]);
const chargementEvenements = ref(true);
const enTraitementId = ref(null);

const stats = ref({ total_evenements: 0, total_participants: 0, evenements: [] });
const chargementStats = ref(true);

async function chargerEvenements() {
  chargementEvenements.value = true;
  try {
    const data = await collaborateurService.getEvenements();
    evenements.value = data.evenements || [];
  } catch (e) {
    console.error('Erreur chargement événements:', e);
  } finally {
    chargementEvenements.value = false;
  }
}

async function chargerStats() {
  chargementStats.value = true;
  try {
    stats.value = await collaborateurService.getStatistiquesEvenements();
  } catch (e) {
    console.error('Erreur chargement statistiques:', e);
  } finally {
    chargementStats.value = false;
  }
}

async function basculerParticipation(evt) {
  enTraitementId.value = evt.id;
  try {
    if (evt.deja_participant) await collaborateurService.quitterEvenement(evt.id);
    else await collaborateurService.rejoindreEvenement(evt.id);
    await chargerEvenements();
  } catch (e) {
    console.error('Erreur participation:', e);
  } finally {
    enTraitementId.value = null;
  }
}

function badgeStatut(s) {
  return s === 'ASSAINISSEMENT_EN_COURS'
    ? { classe: 'bg-sky-50 text-sky-600', label: 'Assainissement en cours' }
    : { classe: 'bg-orange-50 text-orange-600', label: "En attente d'assainissement" };
}

function formatDate(d) {
  if (!d) return 'Date à confirmer';
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

let handlerMaj = null;
onMounted(() => {
  chargerEvenements();
  chargerStats();
  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (socket) {
    handlerMaj = () => { chargerEvenements(); chargerStats(); };
    socket.on('evenement:mis_a_jour', handlerMaj);
  }
});
onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket && handlerMaj) socket.off('evenement:mis_a_jour', handlerMaj);
});
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="text-center space-y-2">
      <h1 class="text-3xl font-bold text-gray-900">Événements d'assainissement</h1>
      <p class="text-gray-500 max-w-lg mx-auto">
        Rejoignez un nettoyage organisé par un collaborateur près de chez vous, ou consultez l'impact de ceux déjà réalisés.
      </p>
    </div>

    <!-- ONGLETS -->
    <div class="flex justify-center gap-2 border-b border-gray-100">
      <button @click="ongletActif = 'venir'"
        :class="ongletActif === 'venir' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
        class="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition">
        <Calendar :size="16" /> À venir
      </button>
      <button @click="ongletActif = 'stats'"
        :class="ongletActif === 'stats' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400'"
        class="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition">
        <TrendingUp :size="16" /> Impact réalisé
      </button>
    </div>

    <!-- ================= À VENIR ================= -->
    <div v-if="ongletActif === 'venir'" class="max-w-3xl mx-auto space-y-4">
      <p v-if="chargementEvenements" class="text-center text-sm text-gray-400 py-10">Chargement…</p>
      <p v-else-if="!evenements.length" class="text-center text-sm text-gray-400 py-10">
        Aucun événement prévu pour le moment. Revenez bientôt !
      </p>

      <div v-for="e in evenements" :key="e.id" class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <span :class="badgeStatut(e.statut).classe" class="px-2 py-1 rounded-full text-[11px] font-semibold">{{ badgeStatut(e.statut).label }}</span>
            <h3 class="text-lg font-bold text-gray-900 mt-2">{{ e.titre }}</h3>
          </div>
          <div class="text-right shrink-0">
            <p class="text-2xl font-black text-primary-600">{{ e.nb_participants }}</p>
            <p class="text-[11px] text-gray-400">participant(s)</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
          <span class="flex items-center gap-1.5"><MapPin :size="14" /> {{ e.commune }} — {{ e.type_signalement }}</span>
          <span class="flex items-center gap-1.5"><Calendar :size="14" /> {{ formatDate(e.date_evenement) }}</span>
        </div>

        <p class="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-4">{{ e.message }}</p>

        <p class="text-xs text-gray-400 mb-4">
          Organisé par {{ e.collaborateur_prenom }} {{ e.collaborateur_nom }}
          <span v-if="e.nom_organisation">({{ e.nom_organisation }})</span>
        </p>

        <button @click="basculerParticipation(e)" :disabled="enTraitementId === e.id"
          :class="e.deja_participant ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary-600 text-white hover:bg-primary-700'"
          class="w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2">
          <HeartHandshake :size="16" />
          {{ e.deja_participant ? 'Ne plus participer' : 'Je participe à ce nettoyage' }}
        </button>
      </div>
    </div>

    <!-- ================= IMPACT REALISE ================= -->
    <div v-else class="max-w-4xl mx-auto space-y-6">
      <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div class="bg-primary-50 rounded-2xl p-6 text-center">
          <p class="text-3xl font-black text-primary-700">{{ stats.total_evenements }}</p>
          <p class="text-xs text-primary-600 mt-1">assainissements réalisés</p>
        </div>
        <div class="bg-primary-50 rounded-2xl p-6 text-center">
          <p class="text-3xl font-black text-primary-700">{{ stats.total_participants }}</p>
          <p class="text-xs text-primary-600 mt-1">participations cumulées</p>
        </div>
      </div>

      <p v-if="chargementStats" class="text-center text-sm text-gray-400 py-10">Chargement…</p>
      <p v-else-if="!stats.evenements.length" class="text-center text-sm text-gray-400 py-10">
        Aucun assainissement clôturé pour le moment.
      </p>

      <div v-else class="grid md:grid-cols-2 gap-5">
        <div v-for="e in stats.evenements" :key="e.id" class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="grid grid-cols-2">
            <img v-if="lienPhoto(e.photo_avant_lien)" :src="lienPhoto(e.photo_avant_lien)" class="w-full h-36 object-cover" alt="Avant" />
            <img v-if="lienPhoto(e.photo_apres_lien)" :src="lienPhoto(e.photo_apres_lien)" class="w-full h-36 object-cover" alt="Après" />
          </div>
          <div class="p-4">
            <h4 class="font-bold text-gray-800">{{ e.titre }}</h4>
            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin :size="12" /> {{ e.commune }} — {{ e.type_signalement }}</p>
            <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
              <span class="flex items-center gap-1"><Users :size="12" /> {{ e.nb_participants }} participant(s)</span>
              <span class="flex items-center gap-1"><CheckCircle2 :size="12" class="text-primary-600" /> {{ new Date(e.date_cloture).toLocaleDateString('fr-FR') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>