<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  LogOut, LayoutDashboard, Map, Home, Newspaper, 
  PlusCircle, Menu, X, HeartHandshake, Calendar
} from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import LogoEcoKin from './LogoEcoKin.vue';

const router = useRouter();
const authStore = useAuthStore();
const estOuvert = ref(false);

function fermerMenu() {
  estOuvert.value = false;
}

function seDeconnecter() {
  authStore.deconnecter();
  router.push({ name: 'connexion' });
  fermerMenu();
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      
      <!-- Logo -->
      <router-link :to="{ name: 'accueil' }" @click="fermerMenu" class="flex items-center gap-2">
        <LogoEcoKin :size="34" />
        <span class="font-semibold text-lg text-primary-700">ELANGA</span>
      </router-link>

      <!-- Bouton Burger -->
      <button @click="estOuvert = !estOuvert" class="md:hidden p-2 text-gray-600">
        <X v-if="estOuvert" :size="24" />
        <Menu v-else :size="24" />
      </button>

      <!-- Navigation -->
      <nav :class="[
        estOuvert ? 'flex' : 'hidden', 
        'md:flex absolute md:relative top-full left-0 w-full md:w-auto bg-white/95 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none p-4 md:p-0 flex-col md:flex-row gap-6 shadow-lg md:shadow-none border-b border-gray-100'
      ]">
        
        <router-link :to="{ name: 'accueil' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
          <Home :size="18" /> Accueil
        </router-link>

        <router-link :to="{ name: 'carte' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
          <Map :size="18" /> Carte
        </router-link>

        <router-link :to="{ name: 'actualites' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
          <Newspaper :size="18" /> Actualités
        </router-link>

        <template v-if="authStore.estConnecte">
          <router-link :to="{ name: 'tableau-de-bord' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <LayoutDashboard :size="18" /> Tableau de bord
          </router-link>

          <router-link :to="{ name: 'signaler' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <PlusCircle :size="18" /> Signaler
          </router-link>

          <router-link :to="{ name: 'evenements' }" @click="fermerMenu" class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <Calendar :size="18" /> Événements
          </router-link>

          <!-- Uniquement pour un contributeur "classique" -->
          <router-link v-if="authStore.utilisateur?.role === 'CONTRIBUTEUR'"
            :to="{ name: 'devenir-collaborateur' }" @click="fermerMenu"
            class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <HeartHandshake :size="18" /> Devenir collaborateur
          </router-link>

          <!-- Uniquement pour un collaborateur deja valide -->
          <router-link v-if="authStore.utilisateur?.role === 'COLLABORATEUR'"
            :to="{ name: 'espace-collaborateur' }" @click="fermerMenu"
            class="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
            <HeartHandshake :size="18" /> Espace collaborateur
          </router-link>
          
          <button @click="seDeconnecter" class="flex items-center gap-2 text-sm text-red-500 hover:text-red-600">
            <LogOut :size="18" /> Déconnexion
          </button>
        </template>

        <router-link v-else :to="{ name: 'connexion' }" @click="fermerMenu" class="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm text-center hover:bg-primary-700 transition">
          Connexion
        </router-link>
      </nav>
    </div>
  </header>
</template>