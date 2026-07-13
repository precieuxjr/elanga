<script setup>
import { useRouter } from 'vue-router';
import { LayoutDashboard, Users, Flag, LogOut } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import LogoElanga from './LogoElanga.vue';

const router = useRouter();
const authStore = useAuthStore();

const liens = [
  { nom: 'tableau-de-bord', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { nom: 'utilisateurs', libelle: 'Utilisateurs', icone: Users },
  { nom: 'signalements', libelle: 'Signalements', icone: Flag }
];

function initiales() {
  const u = authStore.utilisateur;
  if (!u) return '?';
  return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
}

function seDeconnecter() {
  authStore.deconnecter();
  router.push({ name: 'connexion' });
}
</script>

<template>
  <aside class="w-64 bg-sidebar text-slate-300 flex flex-col shrink-0 min-h-screen">
    <div class="flex items-center gap-2 px-5 py-5 border-b border-slate-700/60">
      <LogoElanga :size="32" />
      <div>
        <p class="text-white font-semibold text-sm leading-tight">ELANGA</p>
        <p class="text-xs text-slate-400 leading-tight">Espace administrateur</p>
      </div>
    </div>

    <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
      <div class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
        {{ initiales() }}
      </div>
      <div class="min-w-0">
        <p class="text-white text-sm font-medium truncate">
          {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}
        </p>
        <p class="text-xs text-slate-400">Administrateur</p>
      </div>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1">
      <p class="px-2 text-[11px] uppercase tracking-wide text-slate-500 mb-2">Menu</p>
      <router-link
        v-for="lien in liens"
        :key="lien.nom"
        :to="{ name: lien.nom }"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"
        active-class="bg-primary-600 text-white"
        exact-active-class="bg-primary-600 text-white"
      >
        <component :is="lien.icone" :size="18" />
        {{ lien.libelle }}
      </router-link>
    </nav>

    <div class="px-3 py-4 border-t border-slate-700/60">
      <button
        @click="seDeconnecter"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 w-full transition"
      >
        <LogOut :size="18" />
        Deconnexion
      </button>
    </div>
  </aside>
</template>
