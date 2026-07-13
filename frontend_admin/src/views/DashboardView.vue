<script setup>
import { ref, onMounted } from 'vue';
import { Flag, Users, Clock, CheckCircle2, XCircle } from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import StatCard from '@/components/StatCard.vue';
import DonutChart from '@/components/DonutChart.vue';
import BarChart from '@/components/BarChart.vue';
import adminService from '@/services/adminService';

const chargement = ref(true);
const stats = ref({ signalements: { EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 }, par_commune: [], par_type: [], utilisateurs: { total: 0, contributeurs: 0 } });
const recents = ref([]);

function pourcentage(valeur, total) {
  return total > 0 ? Math.round((valeur / total) * 100) : 0;
}

onMounted(async () => {
  try {
    const [donneesStats, donneesSignalements] = await Promise.all([
      adminService.getStatistiques(),
      adminService.getSignalements()
    ]);
    stats.value = donneesStats;
    recents.value = donneesSignalements.signalements.slice(0, 6);
  } catch (e) {
    console.error('Erreur chargement dashboard admin:', e);
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <div>
    <Topbar titre="Tableau de bord" sous-titre="Vue d'ensemble de l'activite ELANGA" />

    <div class="p-6 space-y-6">
      <!-- Cartes principales -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard :icone="Flag" couleur="bg-secondary-500/10 text-secondary-600" :valeur="chargement ? '—' : stats.signalements.total" libelle="Signalements totaux" />
        <StatCard :icone="Clock" couleur="bg-orange-50 text-orange-500" :valeur="chargement ? '—' : stats.signalements.EN_COURS" libelle="En attente d'analyse" />
        <StatCard :icone="CheckCircle2" couleur="bg-primary-50 text-primary-600" :valeur="chargement ? '—' : stats.signalements.VALIDE" libelle="Valides" />
        <StatCard :icone="Users" couleur="bg-purple-50 text-purple-600" :valeur="chargement ? '—' : stats.utilisateurs.contributeurs" libelle="Citoyens inscrits" />
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Anneaux de repartition -->
        <div class="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 class="text-sm font-semibold text-gray-800 mb-4">Repartition des statuts</h2>
          <div class="flex justify-around flex-wrap gap-4">
            <DonutChart
              :valeur="stats.signalements.EN_COURS"
              libelle="En attente"
              :pourcentage="pourcentage(stats.signalements.EN_COURS, stats.signalements.total)"
              couleur="#f59e0b"
            />
            <DonutChart
              :valeur="stats.signalements.VALIDE"
              libelle="Valides"
              :pourcentage="pourcentage(stats.signalements.VALIDE, stats.signalements.total)"
              couleur="#16a34a"
            />
            <DonutChart
              :valeur="stats.signalements.INVALIDE"
              libelle="Invalides"
              :pourcentage="pourcentage(stats.signalements.INVALIDE, stats.signalements.total)"
              couleur="#ef4444"
            />
          </div>
        </div>

        <!-- Signalements par commune -->
        <div class="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 class="text-sm font-semibold text-gray-800 mb-4">Signalements par commune</h2>
          <BarChart v-if="stats.par_commune.length" :donnees="stats.par_commune" />
          <p v-else class="text-xs text-gray-400">Pas encore de donnees.</p>
        </div>
      </div>

      <!-- Activite recente -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-sm font-semibold text-gray-800 mb-4">Signalements recents</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                <th class="pb-2 font-medium">Date</th>
                <th class="pb-2 font-medium">Type</th>
                <th class="pb-2 font-medium">Commune</th>
                <th class="pb-2 font-medium">Citoyen</th>
                <th class="pb-2 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in recents" :key="s.id" class="border-b border-gray-50 last:border-0">
                <td class="py-2.5 text-gray-500">{{ s.date_signale }}</td>
                <td class="py-2.5 text-gray-700">{{ s.type_signalement }}</td>
                <td class="py-2.5 text-gray-700">{{ s.commune }}</td>
                <td class="py-2.5 text-gray-500">{{ s.utilisateur_prenom }} {{ s.utilisateur_nom }}</td>
                <td class="py-2.5 text-right">
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
                </td>
              </tr>
              <tr v-if="!recents.length">
                <td colspan="5" class="py-6 text-center text-xs text-gray-400">Aucun signalement pour le moment.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
