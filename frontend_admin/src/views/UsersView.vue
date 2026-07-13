<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';

const router = useRouter();
const utilisateurs = ref([]);
const chargement = ref(true);

function initiales(u) {
  return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
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

    <div class="p-6">
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
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
              @click="router.push({ name: 'utilisateur-detail', params: { id: u.id } })"
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
