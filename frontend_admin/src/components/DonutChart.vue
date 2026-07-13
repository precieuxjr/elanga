<script setup>
import { computed } from 'vue';

const props = defineProps({
  valeur: { type: [String, Number], required: true },
  libelle: { type: String, required: true },
  pourcentage: { type: Number, default: 70 }, // 0-100, remplissage de l'anneau
  couleur: { type: String, default: '#16a34a' }
});

const rayon = 42;
const circonference = 2 * Math.PI * rayon;
const decalage = computed(() => circonference - (props.pourcentage / 100) * circonference);
</script>

<template>
  <div class="flex flex-col items-center">
    <svg width="110" height="110" viewBox="0 0 100 100">
      <circle cx="50" cy="50" :r="rayon" fill="none" stroke="#e5e7eb" stroke-width="8" />
      <circle
        cx="50" cy="50" :r="rayon" fill="none" :stroke="couleur" stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circonference"
        :stroke-dashoffset="decalage"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="47" text-anchor="middle" class="fill-gray-800" font-size="16" font-weight="600">
        {{ valeur }}
      </text>
      <text x="50" y="62" text-anchor="middle" class="fill-gray-400" font-size="8">
        {{ libelle }}
      </text>
    </svg>
  </div>
</template>
