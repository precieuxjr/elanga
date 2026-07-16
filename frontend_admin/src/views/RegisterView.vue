<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import LogoElanga from '@/components/LogoElanga.vue';

const router = useRouter();
const authStore = useAuthStore();

const formulaire = reactive({
  nom: '',
  postnom: '',
  prenom: '',
  date_naissance: '',
  sexe: 'M',
  email: '',
  mot_de_passe: '',
  code_invitation: ''
});

const erreur = ref('');
const chargement = ref(false);

async function soumettre() {
  erreur.value = '';
  chargement.value = true;
  try {
    await authStore.inscrire(formulaire);
    router.push({ name: 'tableau-de-bord' });
  } catch (e) {
    erreur.value = e.response?.data?.message || "Une erreur est survenue lors de l'inscription.";
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
    <div class="max-w-lg w-full bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-gray-100">
      
      <div class="flex flex-col items-center mb-8">
        <LogoElanga :size="48" />
        <h1 class="text-2xl font-bold text-gray-800 mt-4">Créer un compte</h1>
        <p class="text-sm text-gray-500 mt-1">Rejoignez l'équipe technique ELANGA</p>
      </div>

      <form @submit.prevent="soumettre" class="space-y-5">
        <!-- Grille responsive : 1 colonne mobile, 2 colonnes desktop -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Nom</label>
            <input v-model="formulaire.nom" type="text" required
                   class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Postnom</label>
            <input v-model="formulaire.postnom" type="text" required
                   class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Prénom</label>
          <input v-model="formulaire.prenom" type="text" required
                 class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Date de naissance</label>
            <input v-model="formulaire.date_naissance" type="date" required
                   class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Sexe</label>
            <select v-model="formulaire.sexe"
                    class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
          <input v-model="formulaire.email" type="email" required
                 class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Mot de passe</label>
          <input v-model="formulaire.mot_de_passe" type="password" required minlength="6"
                 class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Code d'invitation</label>
          <input v-model="formulaire.code_invitation" type="password" required
                 class="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
        </div>

        <p v-if="erreur" class="text-sm text-red-500">{{ erreur }}</p>

        <button type="submit" :disabled="chargement"
                class="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white rounded-xl py-4 text-sm font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2">
          <svg v-if="chargement" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          {{ chargement ? 'Initialisation...' : 'Créer le compte' }}
        </button>
      </form>

      <p class="text-sm text-gray-500 text-center mt-5">
        Déjà un compte ?
        <router-link :to="{ name: 'connexion' }" class="text-primary-600 font-medium hover:underline">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>