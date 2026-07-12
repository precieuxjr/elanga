<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import LogoEcoKin from '@/components/LogoEcoKin.vue';

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
  pseudo: ''
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
  <div class="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
    <div class="flex flex-col items-center mb-6">
      <LogoEcoKin :size="48" />
      <h1 class="text-xl font-semibold text-gray-800 mt-3">Creer un compte citoyen</h1>
      <p class="text-sm text-gray-500 text-center mt-1">
        Rejoignez EcoKin pour signaler et suivre les incidents environnementaux de votre commune.
      </p>
    </div>

    <form @submit.prevent="soumettre" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-sm text-gray-600">Nom</label>
          <input v-model="formulaire.nom" type="text" required
                 class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="text-sm text-gray-600">Postnom</label>
          <input v-model="formulaire.postnom" type="text" required
                 class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div>
        <label class="text-sm text-gray-600">Prenom</label>
        <input v-model="formulaire.prenom" type="text" required
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-sm text-gray-600">Date de naissance</label>
          <input v-model="formulaire.date_naissance" type="date" required
                 class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="text-sm text-gray-600">Sexe</label>
          <select v-model="formulaire.sexe"
                  class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="M">Masculin</option>
            <option value="F">Feminin</option>
          </select>
        </div>
      </div>

      <div>
        <label class="text-sm text-gray-600">Pseudo (optionnel)</label>
        <input v-model="formulaire.pseudo" type="text"
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div>
        <label class="text-sm text-gray-600">Email</label>
        <input v-model="formulaire.email" type="email" required
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div>
        <label class="text-sm text-gray-600">Mot de passe</label>
        <input v-model="formulaire.mot_de_passe" type="password" required minlength="6"
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <p v-if="erreur" class="text-sm text-red-500">{{ erreur }}</p>

      <button type="submit" :disabled="chargement"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60">
        {{ chargement ? 'Inscription en cours...' : "S'inscrire" }}
      </button>
    </form>

    <p class="text-sm text-gray-500 text-center mt-5">
      Deja un compte ?
      <router-link :to="{ name: 'connexion' }" class="text-primary-600 font-medium">Se connecter</router-link>
    </p>
  </div>
</template>
