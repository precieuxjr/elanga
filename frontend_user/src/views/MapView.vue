<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import signalementService from '@/services/signalementService';
import socketService from '@/services/socketService';

const mapContainer = ref(null);
let map = null;
const marqueurs = new Map(); // id -> L.Marker
let handlerNouveau = null;
let handlerRetire = null;

// Icone par defaut de Leaflet (les images ne se chargent pas via bundler
// sans cette correction).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function ajouterMarqueur(s) {
  if (marqueurs.has(s.id)) return; // deja present, evite les doublons visuels
  const marqueur = L.marker([s.latitude, s.longitude])
    .bindPopup(`<strong>${s.type_signalement}</strong><br/>${s.date_signale || ''}`)
    .addTo(map);
  marqueurs.set(s.id, marqueur);
}

function retirerMarqueur(id) {
  const marqueur = marqueurs.get(id);
  if (marqueur) {
    map.removeLayer(marqueur);
    marqueurs.delete(id);
  }
}

onMounted(async () => {
  // Centre par defaut : Kinshasa
  map = L.map(mapContainer.value).setView([-4.325, 15.322], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 1. Chargement initial : tous les signalements deja valides.
  try {
    const data = await signalementService.getCarte();
    data.signalements.forEach(ajouterMarqueur);
  } catch (e) {
    console.error('Erreur chargement carte:', e);
  }

  // 2. Synchronisation temps reel : un nouveau marqueur apparait des qu'un
  // admin valide un signalement, chez tous les clients connectes.
  const socket = socketService.getSocket() || socketService.connecterSocket();
  if (socket) {
    handlerNouveau = (s) => ajouterMarqueur(s);
    handlerRetire = ({ id }) => retirerMarqueur(id);
    socket.on('carte:nouveau_marqueur', handlerNouveau);
    socket.on('carte:marqueur_retire', handlerRetire);
  }
});

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) {
    if (handlerNouveau) socket.off('carte:nouveau_marqueur', handlerNouveau);
    if (handlerRetire) socket.off('carte:marqueur_retire', handlerRetire);
  }
  if (map) map.remove();
});
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-gray-800 mb-1">Carte des signalements</h1>
    <p class="text-sm text-gray-500 mb-4">
      Tous les incidents deja valides par un administrateur. Verifiez cette carte
      avant de signaler un nouvel incident, pour eviter les doublons.
    </p>
    <div ref="mapContainer" class="w-full h-[520px] rounded-xl shadow-sm overflow-hidden"></div>
  </div>
</template>
