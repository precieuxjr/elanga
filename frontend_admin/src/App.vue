<script setup>
import { useRoute } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
</script>

<template>
  <div v-if="route.name === 'connexion'" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
  <div v-else class="min-h-screen flex bg-gray-50">
    <Sidebar />
    <main class="flex-1 min-w-0">
      <router-view />
    </main>
  </div>
</template>
