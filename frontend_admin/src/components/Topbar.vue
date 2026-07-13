<script setup>
defineProps({
  titre: { type: String, required: true },
  sousTitre: { type: String, default: '' }
});
</script>

<template>
  <header class="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">{{ titre }}</h1>
      <p v-if="sousTitre" class="text-xs text-gray-500 mt-0.5">{{ sousTitre }}</p>
    </div>
  </header>
</template>
