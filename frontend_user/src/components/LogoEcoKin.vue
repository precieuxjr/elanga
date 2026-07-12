<script setup>
defineProps({
  size: { type: Number, default: 40 }
});
</script>

<template>
  <!--
    Logo principal ELANGA : un globe porte par deux mains, entoure de
    feuilles. Dessine en SVG (aucun fichier image externe requis) pour
    rester net a toutes les tailles et coherent avec la charte de couleurs.
  -->
  <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Feuilles -->
    <path d="M20 34c-7-2-12-9-12-16 7 0 14 5 16 12 1 3 0 4-4 4z" fill="#5fae66" />
    <path d="M80 34c7-2 12-9 12-16-7 0-14 5-16 12-1 3 0 4 4 4z" fill="#5fae66" />
    <path d="M27 24c-5-4-7-11-5-17 6 2 11 8 11 15 0 3-2 4-6 2z" fill="#7bc47f" />
    <path d="M73 24c5-4 7-11 5-17-6 2-11 8-11 15 0 3 2 4 6 2z" fill="#7bc47f" />

    <!-- Globe -->
    <circle cx="50" cy="46" r="24" fill="#4fb3d9" />
    <path d="M30 38c6 4 34 4 40 0M28 46h44M30 54c6-4 34-4 40 0"
          stroke="white" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.85" />
    <path d="M50 22c-6 6-9 14-9 24s3 18 9 24c6-6 9-14 9-24s-3-18-9-24z"
          stroke="white" stroke-width="1.6" fill="none" opacity="0.85" />
    <path d="M38 30c3 6 6 10 12 10s9-4 12-10c-4-4-8-6-12-6s-8 2-12 6z" fill="#5fae66" opacity="0.9" />
    <path d="M32 56c4 5 11 8 18 8s14-3 18-8c-3 7-10 12-18 12s-15-5-18-12z" fill="#5fae66" opacity="0.9" />

    <!-- Mains -->
    <path d="M4 78c6-11 18-16 28-14 3 5 8 7 14 7h8c6 0 11-2 14-7 10-2 22 3 28 14-10 9-24 14-46 14S14 87 4 78z"
          fill="#f0c39a" />
    <path d="M4 78c6-11 18-16 28-14" stroke="#e0af80" stroke-width="1.4" fill="none" stroke-linecap="round" />
    <path d="M96 78c-6-11-18-16-28-14" stroke="#e0af80" stroke-width="1.4" fill="none" stroke-linecap="round" />
  </svg>
</template>
