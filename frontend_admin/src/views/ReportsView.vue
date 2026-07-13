<script setup>
import { ref, onMounted } from 'vue';
import { Check, X, ImageOff, MapPin } from 'lucide-vue-next';
import Topbar from '@/components/Topbar.vue';
import adminService from '@/services/adminService';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const signalements = ref([]);
const chargement = ref(true);
const filtreStatut = ref('');
const enTraitement = ref(null);

const filtres = [
  { valeur: '', libelle: 'Tous' },
  { valeur: 'EN_COURS', libelle: 'En attente' },
  { valeur: 'VALIDE', libelle: 'Valides' },
  { valeur: 'INVALIDE', libelle: 'Invalides' }
];

async function charger() {
  chargement.value = true;
  try {
    const data = await adminService.getSignalements(filtreStatut.value ? { statut: filtreStatut.value } : {});
    signalements.value = data.signalements;
  } catch (e) {
    console.error('Erreur chargement signalements:', e);
  } finally {
    chargement.value = false;
  }
}

async function valider(s) {
  enTraitement.value = s.id;
  try {
    await adminService.validerSignalement(s.id);
    s.statut = 'VALIDE';
    if (filtreStatut.value) signalements.value = signalements.value.filter((x) => x.id !== s.id);
  } catch (e) {
    console.error('Erreur validation:', e);
  } finally {
    enTraitement.value = null;
  }
}

async function invalider(s) {
  enTraitement.value = s.id;
  try {
    await adminService.invaliderSignalement(s.id);
    s.statut = 'INVALIDE';
    if (filtreStatut.value) signalements.value = signalements.value.filter((x) => x.id !== s.id);
  } catch (e) {
    console.error('Erreur invalidation:', e);
  } finally {
    enTraitement.value = null;
  }
}

onMounted(charger);
</script>

<template>
  <div>
    <Topbar titre="Signalements" sous-titre="Validez ou refusez les signalements soumis par les citoyens" />

    <div class="p-6 space-y-4">
      <div class="flex gap-2">
        <button
          v-for="f in filtres" :key="f.valeur"
          @click="filtreStatut = f.valeur; charger()"
          class="text-xs font-medium px-3 py-1.5 rounded-full transition"
          :class="filtreStatut === f.valeur ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-400'"
        >
          {{ f.libelle }}
        </button>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="s in signalements" :key="s.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="h-36 bg-gray-100 flex items-center justify-center">
            <img v-if="s.photo_lien" :src="API_ORIGIN + s.photo_lien" alt="Photo du signalement" class="w-full h-full object-cover" />
            <ImageOff v-else :size="24" class="text-gray-300" />
          </div>

          <div class="p-4">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-semibold text-gray-800">{{ s.type_signalement }}</p>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="{
                  'bg-amber-50 text-amber-600': s.statut === 'EN_COURS',
                  'bg-primary-50 text-primary-700': s.statut === 'VALIDE',
                  'bg-red-50 text-red-500': s.statut === 'INVALIDE'
                }"
              >
                {{ s.statut }}
              </span>
            </div>

            <p class="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin :size="13" /> {{ s.commune }}
            </p>
            <p class="text-xs text-gray-400 mb-2">
              {{ s.date_signale }} — par {{ s.utilisateur_prenom }} {{ s.utilisateur_nom }}
            </p>
            <p v-if="s.description" class="text-xs text-gray-500 mb-3 line-clamp-2">{{ s.description }}</p>

            <div v-if="s.statut === 'EN_COURS'" class="flex gap-2">
              <button
                @click="valider(s)" :disabled="enTraitement === s.id"
                class="flex-1 flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg py-2 transition disabled:opacity-60"
              >
                <Check :size="14" /> Valider
              </button>
              <button
                @click="invalider(s)" :disabled="enTraitement === s.id"
                class="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg py-2 transition disabled:opacity-60"
              >
                <X :size="14" /> Refuser
              </button>
            </div>
          </div>
        </div>

        <p v-if="!chargement && !signalements.length" class="text-xs text-gray-400 col-span-full text-center py-10">
          Aucun signalement pour ce filtre.
        </p>
      </div>
    </div>
  </div>
</template>
