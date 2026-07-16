<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LogOut, LayoutDashboard, Map, Home, Newspaper, PlusCircle, Menu, X } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import LogoEcoKin from './LogoEcoKin.vue';

const router = useRouter();
const authStore = useAuthStore();
const estOuvert = ref(false); // État du menu burger

function seDeconnecter() {
  authStore.deconnecter();
  router.push({ name: 'connexion' });
  estOuvert.value = false;
}
</script>

<template>
  <!-- Effet Glassmorphism : backdrop-blur et fond semi-transparent -->
  <header class="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      
      <router-link :to="{ name: 'accueil' }" class="flex items-center gap-2">
        <LogoEcoKin :size="34" />
        <span class="font-semibold text-lg text-primary-700">ELANGA</span>
      </router-link>

      <!-- Bouton Burger (visible seulement sur mobile) -->
      <button @click="estOuvert = !estOuvert" class="md:hidden p-2 text-gray-600">
        <X v-if="estOuvert" :size="24" />
        <Menu v-else :size="24" />
      </button>

      <!-- Navigation (masquée par défaut sur mobile, flex sur desktop) -->
      <nav :class="[estOuvert ? 'flex' : 'hidden', 'md:flex absolute md:relative top-full left-0 w-full md:w-auto bg-white/90 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none p-4 md:p-0 flex-col md:flex-row gap-4 shadow-lg md:shadow-none border-b border-gray-100']">
        
        <router-link :to="{ name: 'accueil' }" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
          <Home :size="18" /> Accueil
        </router-link>

        <template v-if="authStore.estConnecte">
          <router-link :to="{ name: 'signaler' }" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <PlusCircle :size="18" /> Signaler
          </router-link>
          
          <button @click="seDeconnecter" class="flex items-center gap-2 text-sm text-red-500">
            <LogOut :size="18" /> Déconnexion
          </button>
        </template>

        <router-link v-else :to="{ name: 'connexion' }" class="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm text-center">
          Connexion
        </router-link>
      </nav>
    </div>
  </header>
</template>