<script setup>
import { ref, onMounted } from 'vue';
import { 
  AlertTriangle, CheckCircle2, XCircle, ListChecks, 
  User, History, BarChart3 
} from 'lucide-vue-next'; // Import de l'icône User
import userService from '@/services/userService';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();
const statistiques = ref({ EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 });
const signalementsRecents = ref([]);
const chargement = ref(true);
const erreur = ref('');

onMounted(async () => {
  try {
    const data = await userService.getDashboard();
    statistiques.value = data.statistiques;
    signalementsRecents.value = data.signalements_recents;
  } catch (e) {
    erreur.value = "Impossible de charger le tableau de bord.";
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto p-2">
    <!-- Header avec icône User -->
    <div class="flex items-center gap-3 mb-8">
      <div class="p-3 bg-primary-100 rounded-full text-primary-700">
        <User :size="24" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Bonjour {{ authStore.utilisateur?.prenom }}</h1>
        <p class="text-sm text-gray-500">Voici le suivi détaillé de vos contributions environnementales.</p>
      </div>
    </div>

    <p v-if="erreur" class="text-sm text-red-500 p-4 bg-red-50 rounded-lg">{{ erreur }}</p>
    <p v-if="chargement" class="text-sm text-gray-400">Chargement de vos données...</p>

    <template v-else>
      <!-- Cartes de statistiques améliorées -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div class="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-2 text-gray-500 mb-2">
            <ListChecks :size="16" />
            <span class="text-xs font-semibold uppercase">Total</span>
          </div>
          <p class="text-2xl font-bold text-gray-800">{{ statistiques.total }}</p>
        </div>
        
        <div class="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl shadow-sm">
          <div class="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle :size="16" />
            <span class="text-xs font-semibold uppercase">En cours</span>
          </div>
          <p class="text-2xl font-bold text-amber-600">{{ statistiques.EN_COURS }}</p>
        </div>

        <div class="bg-green-50/50 border border-green-100 p-5 rounded-2xl shadow-sm">
          <div class="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 :size="16" />
            <span class="text-xs font-semibold uppercase">Validés</span>
          </div>
          <p class="text-2xl font-bold text-green-600">{{ statistiques.VALIDE }}</p>
        </div>

        <div class="bg-red-50/50 border border-red-100 p-5 rounded-2xl shadow-sm">
          <div class="flex items-center gap-2 text-red-600 mb-2">
            <XCircle :size="16" />
            <span class="text-xs font-semibold uppercase">Invalides</span>
          </div>
          <p class="text-2xl font-bold text-red-600">{{ statistiques.INVALIDE }}</p>
        </div>
      </div>

      <!-- Liste des récents -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-5 border-b border-gray-50 flex items-center gap-2">
          <History :size="18" class="text-gray-400" />
          <h2 class="font-semibold text-gray-700">Activités récentes</h2>
        </div>

        <p v-if="signalementsRecents.length === 0" class="p-8 text-center text-gray-400 text-sm">
          Aucun signalement actif pour le moment.
        </p>

        <ul v-else class="divide-y divide-gray-50">
          <li v-for="s in signalementsRecents" :key="s.id" class="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-800">{{ s.type_signalement }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ s.date_signale }} à {{ s.heure_signale }}</p>
            </div>
            <span class="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full"
              :class="{
                'bg-amber-100 text-amber-700': s.statut === 'EN_COURS',
                'bg-green-100 text-green-700': s.statut === 'VALIDE',
                'bg-red-100 text-red-700': s.statut === 'INVALIDE'
              }">
              {{ s.statut }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>