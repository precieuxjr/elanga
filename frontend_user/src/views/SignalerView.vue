<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, MapPin, Loader2, CheckCircle2 } from 'lucide-vue-next';
import referenceService from '@/services/referenceService';
import userService from '@/services/userService';

const router = useRouter();

const types = ref([]);
const communes = ref([]);

const formulaire = reactive({
  type_signalement_id: '',
  commune_id: '',
  description: ''
});

const photoFichier = ref(null);
const photoApercu = ref(null);
const position = ref(null); // { latitude, longitude }
const localisationEnCours = ref(false);
const localisationErreur = ref('');
const envoiEnCours = ref(false);
const erreur = ref('');
const succes = ref(false);

onMounted(async () => {
  try {
    const [{ types: t }, { communes: c }] = await Promise.all([
      referenceService.getTypesSignalement(),
      referenceService.getCommunes()
    ]);
    types.value = t;
    communes.value = c;
  } catch (e) {
    erreur.value = 'Impossible de charger les listes (types / communes).';
  }

  demanderPosition();
});

// Recupere automatiquement les coordonnees GPS du citoyen, pour poser le
// marqueur au bon endroit une fois le signalement valide.
function demanderPosition() {
  if (!navigator.geolocation) {
    localisationErreur.value = "Géolocalisation non supportée.";
    return;
  }

  localisationEnCours.value = true;
  localisationErreur.value = '';

  const options = {
    enableHighAccuracy: true, // Crucial pour la précision
    timeout: 20000,          // Augmenté à 20s
    maximumAge: 0            // Force une nouvelle position
  };

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      position.value = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      localisationEnCours.value = false;
    },
    (err) => {
      localisationEnCours.value = false;
      // Diagnostic précis de l'erreur
      switch(err.code) {
        case err.PERMISSION_DENIED:
          localisationErreur.value = "Accès refusé. Veuillez autoriser la position dans les réglages.";
          break;
        case err.POSITION_UNAVAILABLE:
          localisationErreur.value = "Position indisponible.";
          break;
        case err.TIMEOUT:
          localisationErreur.value = "Le délai de localisation a expiré. Réessayez à l'extérieur.";
          break;
      }
    },
    options
  );
}

function surChangementPhoto(event) {
  const fichier = event.target.files[0];
  if (!fichier) return;
  photoFichier.value = fichier;
  photoApercu.value = URL.createObjectURL(fichier);
}

async function soumettre() {
  erreur.value = '';

  if (!formulaire.type_signalement_id || !formulaire.commune_id) {
    erreur.value = 'Veuillez choisir un type et une commune.';
    return;
  }
  if (!position.value) {
    erreur.value = 'Votre position doit etre recuperee avant l\'envoi.';
    return;
  }

  envoiEnCours.value = true;
  try {
    const donnees = new FormData();
    donnees.append('type_signalement_id', formulaire.type_signalement_id);
    donnees.append('commune_id', formulaire.commune_id);
    donnees.append('description', formulaire.description);
    donnees.append('latitude', position.value.latitude);
    donnees.append('longitude', position.value.longitude);
    if (photoFichier.value) donnees.append('photo', photoFichier.value);

    await userService.creerSignalement(donnees);
    succes.value = true;
    setTimeout(() => router.push({ name: 'tableau-de-bord' }), 1500);
  } catch (e) {
    erreur.value = e.response?.data?.message || "Erreur lors de l'envoi du signalement.";
  } finally {
    envoiEnCours.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-6">
    <h1 class="text-xl font-semibold text-gray-800 mb-1">Signaler un incident</h1>
    <p class="text-sm text-gray-500 mb-6">
      Prenez une photo et laissez votre position se remplir automatiquement. Un
      marqueur apparaitra sur la carte des que votre signalement sera valide.
    </p>

    <div v-if="succes" class="flex flex-col items-center gap-2 py-8 text-primary-700">
      <CheckCircle2 :size="40" />
      <p class="font-medium">Signalement envoye avec succes !</p>
    </div>

    <form v-else @submit.prevent="soumettre" class="space-y-4">
      <!-- Photo -->
      <div>
        <label class="text-sm text-gray-600 block mb-1">Photo de l'environnement</label>
        <label
          class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl h-40 cursor-pointer hover:border-primary-400 overflow-hidden"
        >
          <img v-if="photoApercu" :src="photoApercu" alt="Apercu de la photo" class="w-full h-full object-cover" />
          <template v-else>
            <Camera class="text-gray-400" :size="28" />
            <span class="text-xs text-gray-400">Touchez pour prendre une photo</span>
          </template>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="surChangementPhoto"
          />
        </label>
      </div>

      <!-- Position -->
      <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2 text-sm">
          <MapPin :size="18" class="text-primary-600" />
          <span v-if="position" class="text-gray-700">
            {{ position.latitude.toFixed(5) }}, {{ position.longitude.toFixed(5) }}
          </span>
          <span v-else-if="localisationEnCours" class="text-gray-400 flex items-center gap-1">
            <Loader2 :size="14" class="animate-spin" /> Localisation en cours...
          </span>
          <span v-else class="text-red-500">{{ localisationErreur || 'Position non recuperee' }}</span>
        </div>
        <button type="button" @click="demanderPosition" class="text-xs text-primary-600 font-medium">
          Actualiser
        </button>
      </div>

      <div>
        <label class="text-sm text-gray-600">Type d'incident</label>
        <select v-model="formulaire.type_signalement_id" required
                class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="" disabled>Choisir...</option>
          <option v-for="t in types" :key="t.id" :value="t.id">{{ t.nom }}</option>
        </select>
      </div>
      <div>
  <label class="block text-sm font-semibold text-gray-700 mb-1">
    Commune concernée
  </label>
  
  <select 
    v-model="formulaire.commune_id" 
    required
    class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none appearance-none"
  >
    <option value="" disabled selected>Sélectionnez votre commune...</option>
    <option v-for="c in communes" :key="c.id" :value="c.id" class="py-2">
      {{ c.nom }}
    </option>
  </select>

  <p class="mt-2 text-xs text-gray-500 flex items-center gap-1">
    <span class="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
    Votre localisation sera vérifiée automatiquement lors de l'envoi.
  </p>
</div>

      <div>
        <label class="text-sm text-gray-600">Description (optionnel)</label>
        <textarea v-model="formulaire.description" rows="3"
                  class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
      </div>

      <p v-if="erreur" class="text-sm text-red-500">{{ erreur }}</p>

      <button type="submit" :disabled="envoiEnCours"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2">
        <Loader2 v-if="envoiEnCours" :size="16" class="animate-spin" />
        {{ envoiEnCours ? 'Envoi en cours...' : 'Envoyer le signalement' }}
      </button>
    </form>
  </div>
</template>
