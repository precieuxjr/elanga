<script setup>
import { Calendar } from 'lucide-vue-next';

// Contenu provisoire, gere manuellement en attendant un module d'actualites
// cote backend (ex: table "actualites" + route /api/reference/actualites).
const actualites = [
  {
    titre: 'Lancement de la carte citoyenne des incidents',
    date: '2026-07-01',
    resume: "Chaque citoyen peut desormais consulter tous les signalements deja valides avant de faire un nouveau signalement, afin d'eviter les doublons."
  },
  {
    titre: 'Saison des pluies : restez vigilants face aux inondations',
    date: '2026-06-15',
    resume: "Les communes proches des cours d'eau sont particulierement exposees. Signalez rapidement tout debut d'inondation ou d'erosion pres de chez vous."
  },
  {
    titre: "Vers une collaboration avec les communes",
    date: '2026-05-20',
    resume: "Des echanges sont en cours avec plusieurs autorites communales pour accelerer le traitement des signalements valides sur le terrain."
  }
];
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-gray-800 mb-1">Actualites</h1>
    <p class="text-sm text-gray-500 mb-6">
      Les dernieres nouvelles autour de la gestion environnementale de Kinshasa et de la plateforme EcoKin.
    </p>

    <div class="space-y-4">
      <article v-for="a in actualites" :key="a.titre" class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <Calendar :size="14" />
          {{ new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </div>
        <h2 class="text-sm font-semibold text-gray-800 mb-1">{{ a.titre }}</h2>
        <p class="text-sm text-gray-500 leading-relaxed">{{ a.resume }}</p>
      </article>
    </div>
  </div>
</template>
