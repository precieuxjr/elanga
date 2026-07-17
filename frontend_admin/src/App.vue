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
    <!-- Sidebar : gere elle-meme sa version mobile (barre + menu burger) et
         sa version desktop (colonne fixe) via ses classes internes. -->
    <Sidebar />

    <!-- Main : occupe l'espace restant. pt-20 sur mobile pour laisser la
         place a la barre fixe (h-16 + marge), retire sur desktop. -->
    <main class="flex-1 overflow-x-hidden pt-20 px-4 pb-4 md:p-8">
      <router-view />
    </main>
  </div>
</template>