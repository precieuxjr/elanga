<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight, Flag, CheckCircle2, Clock, CalendarDays } from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';

const router = useRouter();
const utilisateurs = ref([]);
const chargement = ref(true);

function initiales(u) {
  return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
}

function ouvrirDetail(u) {
  router.push({ name: 'utilisateur-detail', params: { id: u.id } });
}

onMounted(async () => {
  try {
    const data = await adminService.getUtilisateurs();
    utilisateurs.value = data.utilisateurs;
  } catch (e) {
    console.error('Erreur chargement utilisateurs:', e);
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <div>
    <Topbar titre="Utilisateurs" sous-titre="Citoyens inscrits et leur activite de signalement" />

    <div class="p-4 md:p-6">

      <!-- VUE MOBILE : cartes, tous les champs empiles et lisibles -->
      <div class="md:hidden space-y-3">
        <div
          v-for="u in utilisateurs" :key="u.id"
          @click="ouvrirDetail(u)"
          class="bg-white rounded-2xl shadow-sm p-4 active:bg-gray-50 transition"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {{ initiales(u) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-gray-800 font-semibold truncate">{{ u.prenom }} {{ u.nom }}</p>
              <p class="text-xs text-gray-400 truncate">{{ u.pseudo ? `@${u.pseudo}` : u.email }}</p>
            </div>
            <ChevronRight :size="18" class="text-gray-300 shrink-0" />
          </div>

          <p class="text-xs text-gray-500 mt-3 truncate">{{ u.email }}</p>

          <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <Flag :size="13" class="text-gray-400" /> {{ u.total_signalements }} signalement(s)
            </div>
            <div class="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
              <CheckCircle2 :size="13" /> {{ u.signalements_valides }} validé(s)
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock :size="13" class="text-gray-400" /> {{ u.dernier_signalement || 'Aucun' }}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays :size="13" class="text-gray-400" /> {{ new Date(u.created_at).toLocaleDateString('fr-FR') }}
            </div>
          </div>
        </div>

        <p v-if="!chargement && !utilisateurs.length" class="text-center text-xs text-gray-400 py-8">
          Aucun citoyen inscrit pour le moment.
        </p>
        <p v-if="chargement" class="text-center text-xs text-gray-400 py-8">Chargement…</p>
      </div>

      <!-- VUE DESKTOP : tableau, inchange -->
      <div class="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th class="px-5 py-3 font-medium">Citoyen</th>
              <th class="px-5 py-3 font-medium">Email</th>
              <th class="px-5 py-3 font-medium text-center">Signalements</th>
              <th class="px-5 py-3 font-medium text-center">Valides</th>
              <th class="px-5 py-3 font-medium">Dernier signalement</th>
              <th class="px-5 py-3 font-medium">Inscrit le</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in utilisateurs" :key="u.id"
              @click="ouvrirDetail(u)"
              class="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
            >
              <td class="px-5 py-3 flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                  {{ initiales(u) }}
                </div>
                <div>
                  <p class="text-gray-800 font-medium">{{ u.prenom }} {{ u.nom }}</p>
                  <p class="text-xs text-gray-400" v-if="u.pseudo">@{{ u.pseudo }}</p>
                </div>
              </td>
              <td class="px-5 py-3 text-gray-500">{{ u.email }}</td>
              <td class="px-5 py-3 text-center text-gray-700">{{ u.total_signalements }}</td>
              <td class="px-5 py-3 text-center text-primary-600 font-medium">{{ u.signalements_valides }}</td>
              <td class="px-5 py-3 text-gray-500">{{ u.dernier_signalement || '—' }}</td>
              <td class="px-5 py-3 text-gray-500">{{ new Date(u.created_at).toLocaleDateString('fr-FR') }}</td>
              <td class="px-5 py-3 text-right"><ChevronRight :size="16" class="text-gray-300" /></td>
            </tr>
            <tr v-if="!chargement && !utilisateurs.length">
              <td colspan="7" class="py-8 text-center text-xs text-gray-400">Aucun citoyen inscrit pour le moment.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>