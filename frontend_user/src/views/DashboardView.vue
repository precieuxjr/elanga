<script setup>
import { ref, onMounted } from 'vue';
import { AlertTriangle, CheckCircle2, XCircle, ListChecks } from 'lucide-vue-next';
import userService from '@/services/userService';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();
const statistiques = ref({ EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 });
const signalementsRecents = ref([]);
const chargement = ref(true);
const erreur = ref('');

onMounted(async () => {
  try {
    // Le backend filtre deja par utilisateur connecte (JWT) : ce tableau
    // de bord n'affiche donc que les donnees appartenant a cet utilisateur.
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
  <div>
    <h1 class="text-xl font-semibold text-gray-800 mb-1">
      Bonjour {{ authStore.utilisateur?.prenom }} 👋
    </h1>
    <p class="text-sm text-gray-500 mb-6">Voici un apercu de vos signalements.</p>

    <p v-if="erreur" class="text-sm text-red-500 mb-4">{{ erreur }}</p>
    <p v-if="chargement" class="text-sm text-gray-400">Chargement...</p>

    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <ListChecks class="text-primary-600" :size="22" />
          <div>
            <p class="text-lg font-semibold text-gray-800">{{ statistiques.total }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <AlertTriangle class="text-amber-500" :size="22" />
          <div>
            <p class="text-lg font-semibold text-gray-800">{{ statistiques.EN_COURS }}</p>
            <p class="text-xs text-gray-500">En cours</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <CheckCircle2 class="text-primary-600" :size="22" />
          <div>
            <p class="text-lg font-semibold text-gray-800">{{ statistiques.VALIDE }}</p>
            <p class="text-xs text-gray-500">Valides</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <XCircle class="text-red-500" :size="22" />
          <div>
            <p class="text-lg font-semibold text-gray-800">{{ statistiques.INVALIDE }}</p>
            <p class="text-xs text-gray-500">Invalides</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Mes signalements recents</h2>

        <p v-if="signalementsRecents.length === 0" class="text-sm text-gray-400">
          Vous n'avez encore signale aucun incident.
        </p>

        <ul v-else class="divide-y divide-gray-100">
          <li v-for="s in signalementsRecents" :key="s.id" class="py-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ s.type_signalement }}</p>
              <p class="text-xs text-gray-500">{{ s.date_signale }} - {{ s.heure_signale }}</p>
            </div>
            <span
              class="text-xs font-medium px-2 py-1 rounded-full"
              :class="{
                'bg-amber-50 text-amber-600': s.statut === 'EN_COURS',
                'bg-primary-50 text-primary-700': s.statut === 'VALIDE',
                'bg-red-50 text-red-500': s.statut === 'INVALIDE'
              }"
            >
              {{ s.statut }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
