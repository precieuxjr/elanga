<script setup>
import { useRouter } from 'vue-router';
import { LogOut, LayoutDashboard, Map, Home, Newspaper, PlusCircle } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import LogoEcoKin from './LogoEcoKin.vue';

const router = useRouter();
const authStore = useAuthStore();

function seDeconnecter() {
  authStore.deconnecter();
  router.push({ name: 'connexion' });
}
</script>

<template>
  <header class="bg-white border-b border-gray-100 shadow-sm">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
      <router-link :to="{ name: 'accueil' }" class="flex items-center gap-2">
        <LogoEcoKin :size="34" />
        <span class="font-semibold text-lg text-primary-700">ELANGA</span>
      </router-link>

      <nav class="flex items-center gap-4 flex-wrap">
        <router-link
          :to="{ name: 'accueil' }"
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
        >
          <Home :size="18" />
          Accueil
        </router-link>
        <router-link
          :to="{ name: 'actualites' }"
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
        >
          <Newspaper :size="18" />
          Actualites
        </router-link>

        <template v-if="authStore.estConnecte">
          <router-link
            :to="{ name: 'signaler' }"
            class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
          >
            <PlusCircle :size="18" />
            Signaler
          </router-link>
          <router-link
            :to="{ name: 'carte' }"
            class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
          >
            <Map :size="18" />
            Carte
          </router-link>
          <router-link
            :to="{ name: 'tableau-de-bord' }"
            class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
          >
            <LayoutDashboard :size="18" />
            Tableau de bord
          </router-link>
          <span class="text-sm text-gray-500 hidden sm:inline">
            {{ authStore.utilisateur?.prenom }}
          </span>
          <button
            @click="seDeconnecter"
            class="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <LogOut :size="18" />
            Deconnexion
          </button>
        </template>

        <router-link
          v-else
          :to="{ name: 'connexion' }"
          class="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition"
        >
          Connexion
        </router-link>
      </nav>
    </div>
  </header>
</template>
