<script setup>
import NavBar from '@/components/NavBar.vue';
import NotificationToast from '@/components/NotificationToast.vue';
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <NotificationToast />
    <main class="max-w-5xl mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>
