<script setup>
defineProps({
  icone: { type: [Object, Function], required: true },
  couleur: { type: String, default: 'bg-primary-50 text-primary-600' },
  valeur: { type: [String, Number], required: true },
  libelle: { type: String, required: true }
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-3">
    <div :class="couleur" class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
      <component :is="icone" :size="20" />
    </div>
    <div class="min-w-0">
      <p class="text-lg font-semibold text-gray-800">{{ valeur }}</p>
      <p class="text-xs text-gray-500 truncate">{{ libelle }}</p>
    </div>
  </div>
</template>
