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

    <!-- Idee 2 : point d'entree pour les organisations (ONG, ecole, centre)
         qui veulent rejoindre en tant que collaborateur environnemental.
         Le compte est d'abord cree comme CONTRIBUTEUR classique ; le
         parametre ?collaborateur=1 sert juste d'indice pour que
         RegisterView.vue puisse, plus tard, adapter son message ou
         pre-remplir la demande de statut collaborateur juste apres
         l'inscription (POST /api/collaborateur/demande). -->
    <div class="mt-6 pt-5 border-t border-gray-100 text-center">
      <p class="text-xs text-gray-400">
        Vous représentez une ONG, une école ou un centre environnemental ?
      </p>
      <router-link
        :to="{ name: 'inscription', query: { collaborateur: '1' } }"
        class="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-block mt-1"
      >
        Rejoignez ELANGA en tant que collaborateur →
      </router-link>
    </div>
  </div>
</template>