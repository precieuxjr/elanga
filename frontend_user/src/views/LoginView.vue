<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import LogoEcoKin from '@/components/LogoEcoKin.vue';

const router = useRouter();
const authStore = useAuthStore();

const formulaire = reactive({ email: '', mot_de_passe: '' });
const erreur = ref('');
const chargement = ref(false);

async function soumettre() {
  erreur.value = '';
  chargement.value = true;
  try {
    await authStore.connecter(formulaire);
    router.push({ name: 'tableau-de-bord' });
  } catch (e) {
    erreur.value = e.response?.data?.message || 'Identifiants incorrects.';
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
    <div class="flex flex-col items-center mb-6">
      <LogoEcoKin :size="48" />
      <h1 class="text-xl font-semibold text-gray-800 mt-3">Connexion</h1>
    </div>

    <form @submit.prevent="soumettre" class="space-y-4">
      <div>
        <label class="text-sm text-gray-600">Email</label>
        <input v-model="formulaire.email" type="email" required
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div>
        <label class="text-sm text-gray-600">Mot de passe</label>
        <input v-model="formulaire.mot_de_passe" type="password" required
               class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <p v-if="erreur" class="text-sm text-red-500">{{ erreur }}</p>

      <button type="submit" :disabled="chargement"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60">
        {{ chargement ? 'Connexion en cours...' : 'Se connecter' }}
      </button>
    </form>

    <p class="text-sm text-gray-500 text-center mt-5">
      Pas encore de compte ?
      <router-link :to="{ name: 'inscription' }" class="text-primary-600 font-medium">S'inscrire</router-link>
    </p>

    <!-- Volontairement AUCUNE mention du statut collaborateur ici : cette
         demarche n'est accessible qu'une fois connecte, via le lien
         "Collaborer" dans NavBar.vue -> /devenir-collaborateur. -->
  </div>
</template>