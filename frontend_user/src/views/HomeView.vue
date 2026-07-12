<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Flag, Camera, MapPin, Activity, HeartHandshake,
  ListChecks, Clock, CheckCircle2, XCircle
} from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import publicService from '@/services/publicService';
import LogoEcoKin from '@/components/LogoEcoKin.vue';

const authStore = useAuthStore();

const actions = [
  {
    icone: Flag,
    couleur: 'bg-orange-50 text-orange-500',
    titre: 'Signaler',
    texte: "Signalez facilement un incident environnemental autour de vous en quelques clics."
  },
  {
    icone: Camera,
    couleur: 'bg-secondary-500/10 text-secondary-600',
    titre: 'Ajouter des photos',
    texte: "Prenez une photo directement depuis votre telephone pour documenter la situation."
  },
  {
    icone: MapPin,
    couleur: 'bg-orange-50 text-orange-500',
    titre: 'Localiser',
    texte: "La geolocalisation identifie automatiquement l'endroit signale, sans saisie manuelle."
  },
  {
    icone: Activity,
    couleur: 'bg-secondary-500/10 text-secondary-600',
    titre: 'Suivre',
    texte: "Suivez l'evolution de votre signalement et recevez une notification a chaque changement."
  },
  {
    icone: HeartHandshake,
    couleur: 'bg-primary-50 text-primary-600',
    titre: 'Agir ensemble',
    texte: "Rejoignez une communaute de citoyens engages pour un environnement plus sain."
  }
];

const chargement = ref(true);
const statistiques = ref({ EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 });
const repartition = ref([]);

const couleursRepartition = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const gradientRepartition = computed(() => {
  if (!repartition.value.length) return 'conic-gradient(#e5e7eb 0 100%)';
  let cumul = 0;
  const segments = repartition.value.map((r, i) => {
    const debut = cumul;
    cumul += r.pourcentage;
    return `${couleursRepartition[i % couleursRepartition.length]} ${debut}% ${cumul}%`;
  });
  return `conic-gradient(${segments.join(', ')})`;
});

onMounted(async () => {
  try {
    const data = await publicService.getStatistiques();
    statistiques.value = data.statistiques;
    repartition.value = data.repartition_par_type;
  } catch (e) {
    // La page d'accueil reste utilisable meme si les stats ne chargent pas.
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="grid md:grid-cols-2 gap-8 items-center py-8">
      <div>
        <h1 class="text-3xl sm:text-4xl font-semibold text-gray-800 leading-tight">
          Ensemble contre <span class="text-primary-600">l'insalubrite</span> !
        </h1>
        <p class="text-sm sm:text-base text-gray-500 mt-4 max-w-md">
          Signalez les problemes d'insalubrite dans votre quartier et contribuez
          a ameliorer l'environnement de Kinshasa, une commune a la fois.
        </p>

        <div class="flex flex-wrap gap-3 mt-6">
          <router-link
            :to="{ name: authStore.estConnecte ? 'signaler' : 'inscription' }"
            class="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Faire un signalement
          </router-link>
          <router-link
            :to="{ name: 'carte' }"
            class="bg-white border border-gray-200 hover:border-primary-400 text-gray-700 rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Voir la carte
          </router-link>
        </div>
      </div>

      <div class="relative flex justify-center">
        <div class="bg-primary-50 rounded-3xl p-10 flex items-center justify-center w-full">
          <LogoEcoKin :size="180" />
        </div>
        <div class="hidden sm:block absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-[220px]">
          <p class="text-xs text-gray-600 leading-relaxed">
            Un environnement propre commence par nous. Agissons aujourd'hui pour un
            demain meilleur.
          </p>
        </div>
      </div>
    </section>

    <!-- Que pouvez-vous faire -->
    <section class="mt-10">
      <h2 class="text-lg font-semibold text-gray-800 text-center mb-6">Que pouvez-vous faire ?</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="a in actions" :key="a.titre" class="bg-white rounded-xl shadow-sm p-5">
          <div :class="a.couleur" class="w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <component :is="a.icone" :size="20" />
          </div>
          <h3 class="text-sm font-semibold text-gray-800 mb-1">{{ a.titre }}</h3>
          <p class="text-xs text-gray-500 leading-relaxed">{{ a.texte }}</p>
        </div>
      </div>
    </section>

    <!-- Statistiques -->
    <section class="grid lg:grid-cols-3 gap-4 mt-10">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-sm font-semibold text-gray-800 mb-4">Statistiques des signalements</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-secondary-500/10 text-secondary-600 flex items-center justify-center">
              <ListChecks :size="18" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ chargement ? '—' : statistiques.total }}</p>
              <p class="text-xs text-gray-500">Total</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock :size="18" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ chargement ? '—' : statistiques.EN_COURS }}</p>
              <p class="text-xs text-gray-500">En cours d'analyse</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <CheckCircle2 :size="18" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ chargement ? '—' : statistiques.VALIDE }}</p>
              <p class="text-xs text-gray-500">Valides</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <XCircle :size="18" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ chargement ? '—' : statistiques.INVALIDE }}</p>
              <p class="text-xs text-gray-500">Invalides</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-sm font-semibold text-gray-800 mb-4">Repartition par type de probleme</h2>
        <div v-if="repartition.length" class="flex items-center gap-4">
          <div class="w-24 h-24 rounded-full shrink-0" :style="{ background: gradientRepartition }"></div>
          <ul class="text-xs text-gray-600 space-y-1">
            <li v-for="(r, i) in repartition" :key="r.nom" class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ background: couleursRepartition[i % couleursRepartition.length] }"></span>
              {{ r.nom }} — {{ r.pourcentage }}%
            </li>
          </ul>
        </div>
        <p v-else class="text-xs text-gray-400">Pas encore assez de donnees.</p>
      </div>
    </section>
  </div>
</template>
