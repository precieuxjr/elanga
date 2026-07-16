<script setup>
import { useRoute } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
</script>

<template>
  <!-- On vérifie aussi 'inscription' pour afficher le formulaire en plein écran -->
  <div v-if="route.name === 'connexion' || route.name === 'inscription'" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
  
  <div v-else class="min-h-screen flex flex-col md:flex-row bg-gray-50">
    <!-- Sidebar : cachée sur mobile (ou menu burger), visible en mode colonne sur desktop -->
    <Sidebar class="hidden md:flex w-64 flex-shrink-0" />
    
    <!-- Main : occupe l'espace restant -->
    <main class="flex-1 overflow-x-hidden p-4 md:p-8">
      <router-view />
    </main>
  </div>
</template>