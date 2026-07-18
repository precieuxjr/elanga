<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import collaborateurService from '@/services/Collaborateurservice';

const authStore = useAuthStore();

const chargement = ref(true);
const demande = ref(null);
const envoiEnCours = ref(false);
const erreur = ref('');
const succes = ref(false);

const formulaire = reactive({
  type_organisation: '',
  nom_organisation: '',
  justification: '',
});

const dejaCollaborateur = computed(() =>
  ['COLLABORATEUR', 'ADMINISTRATEUR'].includes(authStore.utilisateur?.role)
);

// Une nouvelle demande n'est proposee que si aucune n'est EN_ATTENTE (le
// backend la bloque de toute facon, cf demandeEnAttentePour).
const peutRedemander = computed(
  () => !demande.value || demande.value.statut === 'REFUSEE'
);

async function chargerStatut() {
  chargement.value = true;
  try {
    const data = await collaborateurService.maDemande();
    demande.value = data.demande;
  } catch (e) {
    console.error('Erreur chargement demande collaborateur:', e);
  } finally {
    chargement.value = false;
  }
}

async function soumettre() {
  erreur.value = '';
  succes.value = false;
  envoiEnCours.value = true;
  try {
    await collaborateurService.demander(formulaire);
    succes.value = true;
    await chargerStatut();
  } catch (e) {
    erreur.value = e.response?.data?.message || 'Une erreur est survenue.';
  } finally {
    envoiEnCours.value = false;
  }
}

onMounted(chargerStatut);
</script>

<template>
  <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-8">
    <div class="flex flex-col items-center text-center mb-6">
      <div
        class="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3"
      >
        <HeartHandshake :size="26" />
      </div>
      <h1 class="text-xl font-semibold text-gray-800">Devenir collaborateur</h1>
      <p class="text-sm text-gray-500 mt-1">
        Pour les ONG, écoles et centres environnementaux qui souhaitent
        intervenir directement sur les signalements de terrain.
      </p>
    </div>

    <p v-if="chargement" class="text-center text-sm text-gray-400 py-8">
      Chargement…
    </p>

    <!-- Deja collaborateur ou admin : rien a demander -->
    <div
      v-else-if="dejaCollaborateur"
      class="bg-primary-50 rounded-xl p-5 text-center"
    >
      <CheckCircle2 :size="24" class="text-primary-600 mx-auto mb-2" />
      <p class="text-sm text-primary-800 font-medium">
        Vous êtes déjà collaborateur sur ELANGA.
      </p>
      <p class="text-xs text-primary-600 mt-1">
        Rendez-vous dans votre espace collaborateur pour intervenir sur les
        signalements.
      </p>
    </div>

    <!-- Une demande existe deja et n'est pas encore tranchee -->
    <div
      v-else-if="demande && demande.statut === 'EN_ATTENTE'"
      class="bg-orange-50 rounded-xl p-5 text-center"
    >
      <Clock :size="24" class="text-orange-500 mx-auto mb-2" />
      <p class="text-sm text-orange-700 font-medium">
        Votre demande est en cours d'examen.
      </p>
      <p class="text-xs text-orange-600 mt-2">
        Organisation : {{ demande.nom_organisation }} ({{
          demande.type_organisation
        }})
      </p>
      <p class="text-xs text-gray-400 mt-1">
        Envoyée le
        {{ new Date(demande.date_demande).toLocaleDateString('fr-FR') }}
      </p>
    </div>

    <!-- Demande deja acceptee mais role pas encore rafraichi cote client -->
    <div
      v-else-if="demande && demande.statut === 'ACCEPTEE'"
      class="bg-primary-50 rounded-xl p-5 text-center"
    >
      <CheckCircle2 :size="24" class="text-primary-600 mx-auto mb-2" />
      <p class="text-sm text-primary-800 font-medium">
        Votre demande a été acceptée !
      </p>
      <p class="text-xs text-primary-600 mt-1">
        Reconnectez-vous pour activer votre espace collaborateur.
      </p>
    </div>

    <!-- Formulaire : pas de demande, ou demande precedente refusee -->
    <template v-else>
      <div
        v-if="demande?.statut === 'REFUSEE'"
        class="bg-red-50 rounded-xl p-4 mb-5 text-center"
      >
        <XCircle :size="20" class="text-red-500 mx-auto mb-1" />
        <p class="text-xs text-red-600">
          Votre précédente demande n'a pas été retenue. Vous pouvez en soumettre
          une nouvelle avec plus de précisions.
        </p>
      </div>

      <form @submit.prevent="soumettre" class="space-y-4">
        <div>
          <label class="text-sm text-gray-600">Type d'organisation</label>
          <select
            v-model="formulaire.type_organisation"
            required
            class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="" disabled>Sélectionnez...</option>
            <option value="ONG">ONG</option>
            <option value="CENTRE">Centre environnemental</option>
            <option value="ECOLE">École</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600">Nom de l'organisation</label>
          <div class="relative mt-1">
            <Building2
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="formulaire.nom_organisation"
              type="text"
              required
              placeholder="Ex : Association Verte Kinshasa"
              class="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label class="text-sm text-gray-600"
            >Pourquoi voulez-vous rejoindre ELANGA ? (optionnel)</label
          >
          <textarea
            v-model="formulaire.justification"
            rows="3"
            placeholder="Missions de votre organisation, zones d'intervention habituelles..."
            class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>

        <p v-if="erreur" class="text-sm text-red-500">{{ erreur }}</p>
        <p v-if="succes" class="text-sm text-primary-600">
          Demande envoyée ! Un administrateur va l'examiner.
        </p>

        <button
          type="submit"
          :disabled="envoiEnCours"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60"
        >
          {{ envoiEnCours ? 'Envoi en cours...' : 'Envoyer ma demande' }}
        </button>
      </form>
    </template>
  </div>
</template>
