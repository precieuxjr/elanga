<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { LayoutDashboard, Users, Flag, LogOut, Menu, X, Bell, Clock, MapPin } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import adminService from '@/services/adminService';
import socketService from '@/services/socketService';
import LogoElanga from './LogoElanga.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const liens = [
  { nom: 'tableau-de-bord', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { nom: 'utilisateurs', libelle: 'Utilisateurs', icone: Users },
  { nom: 'signalements', libelle: 'Signalements', icone: Flag }
];

const menuOuvert = ref(false);

// --- Notifications : signalements EN_COURS en attente de validation ---
// Version "fonctionne des maintenant" : sondage regulier de la meme route
// admin que ReportsView.vue utilise deja. Peut etre remplacee/complementee
// par un vrai push socket plus tard sans changer le template.
const notifications = ref([]);
const chargementNotifs = ref(false);
const dropdownOuvert = ref(false);
let intervalleNotifs = null;
let handlerNouveauSignalement = null;

async function chargerNotifications() {
  chargementNotifs.value = true;
  try {
    const data = await adminService.getSignalements({ statut: 'EN_COURS' });
    notifications.value = data.signalements || [];
  } catch (e) {
    console.error('Erreur chargement notifications:', e);
  } finally {
    chargementNotifs.value = false;
  }
}

function ouvrirSignalements() {
  dropdownOuvert.value = false;
  router.push({ name: 'signalements' });
}

onMounted(() => {
  // 1. Chargement initial de la liste.
  chargerNotifications();

  // 2. Push temps reel : des qu'un citoyen cree un signalement, le
  // backend emet 'admin:nouveau_signalement' vers la room 'admins'.
  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (socket) {
    handlerNouveauSignalement = (s) => {
      if (notifications.value.some(n => n.id === s.id)) return;
      notifications.value = [s, ...notifications.value];
    };
    socket.on('admin:nouveau_signalement', handlerNouveauSignalement);
  }

  // 3. Sondage de secours (au cas ou le socket se deconnecte un instant),
  // espace car le push socket couvre deja le cas normal.
  intervalleNotifs = setInterval(chargerNotifications, 60000); // 60s
});
onUnmounted(() => {
  if (intervalleNotifs) clearInterval(intervalleNotifs);
  const socket = socketService.getSocket();
  if (socket && handlerNouveauSignalement) {
    socket.off('admin:nouveau_signalement', handlerNouveauSignalement);
  }
});

// Ferme les menus/dropdowns a chaque changement de page.
watch(() => route.name, () => { menuOuvert.value = false; dropdownOuvert.value = false; });
watch(menuOuvert, (ouvert) => {
  document.body.style.overflow = ouvert ? 'hidden' : '';
});

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
  <!-- BARRE MOBILE : fixe en haut, visible uniquement sous md -->
  <header class="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-16
                 bg-sidebar/70 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10">
    <div class="flex items-center gap-2">
      <LogoElanga :size="28" />
      <p class="text-white font-semibold text-sm">ELANGA</p>
    </div>
    <div class="flex items-center gap-1">
      <button
        @click="dropdownOuvert = !dropdownOuvert"
        class="relative w-10 h-10 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        <Bell :size="20" />
        <span v-if="notifications.length" class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {{ notifications.length > 9 ? '9+' : notifications.length }}
        </span>
      </button>
      <button
        @click="menuOuvert = true"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 transition"
        aria-label="Ouvrir le menu"
      >
        <Menu :size="22" />
      </button>
    </div>

    <!-- Dropdown notifications (mobile) -->
    <Transition name="fondu">
      <div v-if="dropdownOuvert" class="absolute top-16 right-4 w-[calc(100vw-2rem)] max-w-sm
                  bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p class="text-sm font-semibold text-gray-800">Signalements en attente</p>
          <span class="text-xs text-gray-400">{{ notifications.length }}</span>
        </div>
        <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
          <p v-if="!notifications.length" class="text-xs text-gray-400 text-center py-6">Rien en attente pour le moment.</p>
          <button
            v-for="n in notifications.slice(0, 8)" :key="n.id"
            @click="ouvrirSignalements"
            class="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
          >
            <p class="text-sm font-medium text-gray-800">{{ n.type_signalement }}</p>
            <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin :size="11" /> {{ n.commune }}</p>
            <p class="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock :size="11" /> {{ n.date_signale }} — {{ n.utilisateur_prenom }} {{ n.utilisateur_nom }}
            </p>
          </button>
        </div>
        <button @click="ouvrirSignalements" class="w-full text-center text-xs font-semibold text-primary-600 py-2.5 hover:bg-primary-50 transition">
          Voir tous les signalements
        </button>
      </div>
    </Transition>
  </header>

  <!-- OVERLAY MOBILE (menu burger) -->
  <Transition name="fondu">
    <div
      v-if="menuOuvert"
      @click="menuOuvert = false"
      class="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
    ></div>
  </Transition>

  <!-- Ferme le dropdown notifications au clic en dehors -->
  <div v-if="dropdownOuvert" @click="dropdownOuvert = false" class="fixed inset-0 z-30"></div>

  <!-- PANNEAU MOBILE : glassmorphique, coulisse depuis la gauche -->
  <Transition name="glisse">
    <aside
      v-if="menuOuvert"
      class="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col
             bg-sidebar/60 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/10 shadow-2xl"
    >
      <div class="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div class="flex items-center gap-2">
          <LogoElanga :size="32" />
          <div>
            <p class="text-white font-semibold text-sm leading-tight">ELANGA</p>
            <p class="text-xs text-slate-300 leading-tight">Espace administrateur</p>
          </div>
        </div>
        <button
          @click="menuOuvert = false"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 transition"
          aria-label="Fermer le menu"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <div class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {{ initiales() }}
        </div>
        <div class="min-w-0">
          <p class="text-white text-sm font-medium truncate">
            {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}
          </p>
          <p class="text-xs text-slate-300">Administrateur</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p class="px-2 text-[11px] uppercase tracking-wide text-slate-300/80 mb-2">Menu</p>
        <router-link
          v-for="lien in liens"
          :key="lien.nom"
          :to="{ name: lien.nom }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-100 transition"
          active-class="bg-primary-600/90 text-white"
          exact-active-class="bg-primary-600/90 text-white"
        >
          <component :is="lien.icone" :size="18" />
          {{ lien.libelle }}
        </router-link>
      </nav>

      <div class="px-3 py-4 border-t border-white/10">
        <button
          @click="seDeconnecter"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-100 hover:bg-white/10 w-full transition"
        >
          <LogOut :size="18" />
          Deconnexion
        </button>
      </div>
    </aside>
  </Transition>

  <!-- SIDEBAR DESKTOP : inchangee + cloche ajoutee dans la rangee utilisateur -->
  <aside class="hidden md:flex md:w-64 md:flex-shrink-0 bg-sidebar text-slate-300 flex-col shrink-0 min-h-screen">
    <div class="flex items-center gap-2 px-5 py-5 border-b border-slate-700/60">
      <LogoElanga :size="32" />
      <div>
        <p class="text-white font-semibold text-sm leading-tight">ELANGA</p>
        <p class="text-xs text-slate-400 leading-tight">Espace administrateur</p>
      </div>
    </div>

    <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
      <div class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
        {{ initiales() }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-white text-sm font-medium truncate">
          {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}
        </p>
        <p class="text-xs text-slate-400">Administrateur</p>
      </div>
      <div class="relative">
        <button
          @click="dropdownOuvert = !dropdownOuvert"
          class="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition"
          aria-label="Notifications"
        >
          <Bell :size="18" />
          <span v-if="notifications.length" class="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {{ notifications.length > 9 ? '9+' : notifications.length }}
          </span>
        </button>

        <Transition name="fondu">
          <div v-if="dropdownOuvert" class="absolute top-11 right-0 w-80 z-50
                      bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-800">Signalements en attente</p>
              <span class="text-xs text-gray-400">{{ notifications.length }}</span>
            </div>
            <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
              <p v-if="!notifications.length" class="text-xs text-gray-400 text-center py-6">Rien en attente pour le moment.</p>
              <button
                v-for="n in notifications.slice(0, 8)" :key="n.id"
                @click="ouvrirSignalements"
                class="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
              >
                <p class="text-sm font-medium text-gray-800">{{ n.type_signalement }}</p>
                <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin :size="11" /> {{ n.commune }}</p>
                <p class="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock :size="11" /> {{ n.date_signale }} — {{ n.utilisateur_prenom }} {{ n.utilisateur_nom }}
                </p>
              </button>
            </div>
            <button @click="ouvrirSignalements" class="w-full text-center text-xs font-semibold text-primary-600 py-2.5 hover:bg-primary-50 transition">
              Voir tous les signalements
            </button>
          </div>
        </Transition>
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

<style scoped>
.fondu-enter-active, .fondu-leave-active { transition: opacity 0.2s ease; }
.fondu-enter-from, .fondu-leave-to { opacity: 0; }

.glisse-enter-active, .glisse-leave-active { transition: transform 0.28s ease; }
.glisse-enter-from, .glisse-leave-to { transform: translateX(-100%); }
</style>