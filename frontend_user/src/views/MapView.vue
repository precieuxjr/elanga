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

// Définition des limites de Kinshasa pour restreindre la zone de navigation
const limitesKinshasa = L.latLngBounds(
  L.latLng(-4.600, 15.150), // Sud-Ouest
  L.latLng(-4.150, 15.600)  // Nord-Est
);

// Icone par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function ajouterMarqueur(s) {
  if (marqueurs.has(s.id)) return;
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
  // Initialisation avec contraintes de limites et de zoom
  map = L.map(mapContainer.value, {
    maxBounds: limitesKinshasa,
    minZoom: 10,
    maxZoom: 18
  }).setView([-4.325, 15.322], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    bounds: limitesKinshasa // Limite aussi le chargement des tuiles
  }).addTo(map);

  // 1. Chargement initial
  try {
    const data = await signalementService.getCarte();
    data.signalements.forEach(ajouterMarqueur);
  } catch (e) {
    console.error('Erreur chargement carte:', e);
  }

  // 2. Synchronisation temps réel
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
      Tous les incidents déjà validés par un administrateur. Vérifiez cette carte
      avant de signaler un nouvel incident, pour éviter les doublons.
    </p>
    <div ref="mapContainer" class="w-full h-[520px] rounded-xl shadow-sm overflow-hidden"></div>
  </div>
</template>