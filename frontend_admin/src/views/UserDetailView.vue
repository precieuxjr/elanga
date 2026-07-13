<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Mail, Calendar, MapPin } from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';

const route = useRoute();
const router = useRouter();

const utilisateur = ref(null);
const signalements = ref([]);
const statistiques = ref({ EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 });
const chargement = ref(true);

onMounted(async () => {
  try {
    const data = await adminService.getUtilisateur(route.params.id);
    utilisateur.value = data.utilisateur;
    signalements.value = data.signalements;
    statistiques.value = data.statistiques;
  } catch (e) {
    console.error('Erreur chargement detail utilisateur:', e);
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <div>
    <Topbar titre="Detail du citoyen" />

    <div class="p-6 space-y-6">
      <button @click="router.push({ name: 'utilisateurs' })" class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft :size="16" /> Retour a la liste
      </button>

      <div v-if="utilisateur" class="grid lg:grid-cols-3 gap-4">
        <!-- Profil -->
        <div class="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-semibold">
              {{ utilisateur.prenom?.[0] }}{{ utilisateur.nom?.[0] }}
            </div>
            <h2 class="text-base font-semibold text-gray-800 mt-3">
              {{ utilisateur.prenom }} {{ utilisateur.postnom }} {{ utilisateur.nom }}
            </h2>
            <p v-if="utilisateur.pseudo" class="text-xs text-gray-400">@{{ utilisateur.pseudo }}</p>
          </div>

          <div class="mt-5 space-y-3 text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <Mail :size="15" class="text-gray-400" /> {{ utilisateur.email }}
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <Calendar :size="15" class="text-gray-400" />
              Inscrit le {{ new Date(utilisateur.created_at).toLocaleDateString('fr-FR') }}
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              Sexe : {{ utilisateur.sexe === 'M' ? 'Masculin' : 'Feminin' }}
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              Ne(e) le {{ new Date(utilisateur.date_naissance).toLocaleDateString('fr-FR') }}
            </div>
          </div>
        </div>

        <!-- Stats + signalements -->
        <div class="lg:col-span-2 space-y-4">
          <div class="grid grid-cols-4 gap-3">
            <div class="bg-white rounded-xl shadow-sm p-4 text-center">
              <p class="text-lg font-semibold text-gray-800">{{ statistiques.total }}</p>
              <p class="text-xs text-gray-500">Total</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-4 text-center">
              <p class="text-lg font-semibold text-amber-500">{{ statistiques.EN_COURS }}</p>
              <p class="text-xs text-gray-500">En attente</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-4 text-center">
              <p class="text-lg font-semibold text-primary-600">{{ statistiques.VALIDE }}</p>
              <p class="text-xs text-gray-500">Valides</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-4 text-center">
              <p class="text-lg font-semibold text-red-500">{{ statistiques.INVALIDE }}</p>
              <p class="text-xs text-gray-500">Invalides</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Historique des signalements</h3>
            <ul class="divide-y divide-gray-50">
              <li v-for="s in signalements" :key="s.id" class="py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <MapPin :size="15" class="text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-800">{{ s.type_signalement }}</p>
                    <p class="text-xs text-gray-400">{{ s.date_signale }} - {{ s.heure_signale }}</p>
                  </div>
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
              <li v-if="!signalements.length" class="py-6 text-center text-xs text-gray-400">
                Ce citoyen n'a encore fait aucun signalement.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
