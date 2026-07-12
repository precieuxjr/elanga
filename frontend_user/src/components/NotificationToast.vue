<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CheckCircle2, XCircle } from 'lucide-vue-next';
import socketService from '@/services/socketService';

const notifications = ref([]);
let handler = null;

function ajouterNotification(payload) {
  const id = Date.now();
  notifications.value.push({ id, ...payload });
  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }, 6000);
}

onMounted(() => {
  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (!socket) return;

  handler = (payload) => ajouterNotification(payload);
  socket.on('signalement:statut_change', handler);
});

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket && handler) socket.off('signalement:statut_change', handler);
});
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
    <div
      v-for="n in notifications"
      :key="n.id"
      class="bg-white shadow-lg rounded-xl p-4 flex items-start gap-3 border-l-4"
      :class="n.statut === 'VALIDE' ? 'border-primary-500' : 'border-red-400'"
    >
      <CheckCircle2 v-if="n.statut === 'VALIDE'" class="text-primary-600 shrink-0" :size="20" />
      <XCircle v-else class="text-red-500 shrink-0" :size="20" />
      <div>
        <p class="text-sm font-medium text-gray-800">
          Signalement {{ n.statut === 'VALIDE' ? 'valide' : 'invalide' }}
        </p>
        <p class="text-xs text-gray-500">
          Votre signalement "{{ n.type_signalement }}" a ete
          {{ n.statut === 'VALIDE' ? 'valide' : 'invalide' }} par un administrateur.
        </p>
      </div>
    </div>
  </div>
</template>
