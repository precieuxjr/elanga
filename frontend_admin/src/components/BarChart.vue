<script setup>
import { computed } from 'vue';

const props = defineProps({
  donnees: { type: Array, required: true } // [{ commune, total }]
});

const max = computed(() => Math.max(1, ...props.donnees.map((d) => d.total)));
</script>

<template>
  <div class="space-y-2.5">
    <div v-for="d in donnees" :key="d.commune" class="flex items-center gap-3">
      <span class="text-xs text-gray-500 w-24 shrink-0 truncate">{{ d.commune }}</span>
      <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          class="h-full bg-primary-500 rounded-full transition-all"
          :style="{ width: (d.total / max) * 100 + '%' }"
        ></div>
      </div>
      <span class="text-xs font-medium text-gray-700 w-6 text-right">{{ d.total }}</span>
    </div>
  </div>
</template>
