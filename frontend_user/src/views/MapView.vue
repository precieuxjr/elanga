<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import signalementService from '@/services/signalementService';
import socketService from '@/services/socketService';
import api from '@/services/api';

const mapContainer = ref(null);
let map = null;
const marqueurs = new Map(); // id -> L.Marker
let handlerNouveau = null;
let handlerRetire = null;

// Base URL du backend (sans le suffixe /api) pour reconstituer le lien
// complet des photos, qui sont stockees en chemin relatif (/uploads/...).
// Ajuste ici si ton instance Axios expose la base autrement.
const baseUrlBackend = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// Définition des limites de Kinshasa pour restreindre la zone de navigation
const limitesKinshasa = L.latLngBounds(
  L.latLng(-4.600, 15.150), // Sud-Ouest
  L.latLng(-4.150, 15.600)  // Nord-Est
);

// Icone par défaut de Leaflet (fallback si un type n'est pas reconnu)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Un type par categorie de signalement (les 4 de la BDD + repli generique).
// Reconnaissance par mot-cle plutot que correspondance exacte, pour rester
// robuste aux variations de nom en base ("Depotdes dechets", etc.).
const CATEGORIES = [
  { motCle: 'dechet',    label: 'Dépôt de déchets',    couleur: '#f97316' }, // orange
  { motCle: 'inond',     label: 'Inondation',          couleur: '#0ea5e9' }, // bleu
  { motCle: 'erosion',   label: 'Érosion',             couleur: '#b45309' }, // brun
  { motCle: 'pollution', label: "Pollution de l'eau",  couleur: '#06b6d4' }  // cyan
];
const COULEUR_DEFAUT = '#6b7280'; // gris, si le type ne correspond a aucune categorie connue

function categorieDuType(typeSignalement = '') {
  const normalise = typeSignalement.toLowerCase();
  return CATEGORIES.find(c => normalise.includes(c.motCle));
}

// Legende affichee sur la carte : seules les categories reellement presentes
// parmi les marqueurs charges apparaissent.
const legende = ref([]);

function icone(couleur) {
  return L.divIcon({
    className: '',
    html: `<div style="
        width: 22px; height: 22px; border-radius: 9999px;
        background: ${couleur}; border: 3px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
}

function contenuPopup(s) {
  const categorie = categorieDuType(s.type_signalement);
  const couleur = categorie?.couleur || COULEUR_DEFAUT;
  const photo = s.photo_lien
    ? `<img src="${baseUrlBackend}${s.photo_lien}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
    : '';

  return `
    <div style="min-width:200px">
      ${photo}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="width:10px;height:10px;border-radius:9999px;background:${couleur};display:inline-block;"></span>
        <strong>${s.type_signalement}</strong>
      </div>
      ${s.commune ? `<div style="font-size:12px;color:#6b7280;margin-bottom:2px;">📍 ${s.commune}</div>` : ''}
      ${s.description ? `<div style="font-size:13px;color:#374151;margin-bottom:4px;">${s.description.slice(0, 140)}${s.description.length > 140 ? '…' : ''}</div>` : ''}
      <div style="font-size:11px;color:#9ca3af;">${s.date_signale || ''}</div>
    </div>
  `;
}

function ajouterMarqueur(s) {
  if (marqueurs.has(s.id)) return;
  const categorie = categorieDuType(s.type_signalement);
  const couleur = categorie?.couleur || COULEUR_DEFAUT;

  const marqueur = L.marker([s.latitude, s.longitude], { icon: icone(couleur) })
    .bindPopup(contenuPopup(s))
    .addTo(map);

  marqueurs.set(s.id, marqueur);

  // La legende ne montre que les categories reellement rencontrees.
  const label = categorie?.label || 'Autre';
  if (!legende.value.some(l => l.label === label)) {
    legende.value.push({ label, couleur });
  }
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

  // 1. Chargement initial : tous les signalements VALIDE, marques par les
  // citoyens precedents et deja verifies par un administrateur.
  try {
    const data = await signalementService.getCarte();
    (data.signalements || []).forEach(ajouterMarqueur);
  } catch (e) {
    console.error('Erreur chargement carte:', e);
  }

  // 2. Synchronisation temps réel : un nouveau signalement valide par un
  // admin apparait instantanement sur toutes les cartes ouvertes.
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

    <div class="relative">
      <div ref="mapContainer" class="w-full h-[520px] rounded-xl shadow-sm overflow-hidden"></div>

      <!-- Légende : uniquement les catégories réellement présentes sur la carte -->
      <div v-if="legende.length" class="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-md px-4 py-3 space-y-1.5 z-[1000]">
        <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Légende</p>
        <div v-for="l in legende" :key="l.label" class="flex items-center gap-2 text-xs text-gray-700">
          <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: l.couleur }"></span>
          {{ l.label }}
        </div>
      </div>
    </div>
  </div>
</template>