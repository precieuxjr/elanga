<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMotion } from '@vueuse/motion';
import { Flag, Camera, MapPin, Activity, HeartHandshake, ListChecks, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';
import publicService from '@/services/publicService';
import LogoEcoKin from '@/components/LogoEcoKin.vue';

const authStore = useAuthStore();
const chargement = ref(true);
const statistiques = ref({ EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 });
const repartition = ref([]);

// Configuration des animations
const sectionInitial = { initial: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 800 } } };

const actions = [
  { icone: Flag, couleur: 'bg-orange-50 text-orange-500', titre: 'Signaler', texte: "Signalez un incident en quelques clics." },
  { icone: Camera, couleur: 'bg-secondary-500/10 text-secondary-600', titre: 'Documenter', texte: "Ajoutez des preuves visuelles." },
  { icone: MapPin, couleur: 'bg-orange-50 text-orange-500', titre: 'Géolocaliser', texte: "Localisation précise auto." },
  { icone: Activity, couleur: 'bg-secondary-500/10 text-secondary-600', titre: 'Suivre', texte: "Notifications en temps réel." },
  { icone: HeartHandshake, couleur: 'bg-primary-50 text-primary-600', titre: 'Agir', texte: "Communauté engagée." }
];

const couleursRepartition = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];
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
  } catch (e) {} finally { chargement.value = false; }
});
</script>

<template>
  <div class="space-y-20 py-10 overflow-hidden">
    
    <!-- HERO SECTION : Impact visuel fort -->
    <section v-motion="sectionInitial" class="flex flex-col md:flex-row items-center gap-12">
      <div class="flex-1 space-y-6">
        <span class="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider">Plateforme Citoyenne</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1]">
          Kinshasa propre, <br/><span class="text-primary-600">notre devoir.</span>
        </h1>
        <p class="text-lg text-gray-600 max-w-lg">
          ELANGA transforme la manière dont nous gérons l'insalubrité. Plus qu'une application, un outil de changement pour transformer nos quartiers.
        </p>
        <div class="flex gap-4">
          <router-link :to="{ name: authStore.estConnecte ? 'signaler' : 'inscription' }" 
            class="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition-all hover:scale-105">
            Démarrer un signalement <ArrowRight :size="20" />
          </router-link>
        </div>
      </div>
      <div class="relative hidden md:block">
        <div class="absolute -inset-4 bg-primary-500/20 blur-3xl rounded-full"></div>
        <LogoEcoKin :size="300" class="relative z-10" />
      </div>
    </section>

    <!-- VALEURS / ACTIONS : Grid épurée -->
    <section v-motion="sectionInitial" class="bg-gray-50 p-12 rounded-3xl">
      <h2 class="text-3xl font-bold text-center mb-12">Pourquoi utiliser ELANGA ?</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
        <div v-for="a in actions" :key="a.titre" class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-default">
          <div :class="a.couleur" class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <component :is="a.icone" :size="24" />
          </div>
          <h3 class="font-bold text-gray-900">{{ a.titre }}</h3>
          <p class="text-sm text-gray-500 mt-2">{{ a.texte }}</p>
        </div>
      </div>
    </section>

    <!-- STATS AVEC EFFET DE COMPTAGE -->
    <section v-motion="sectionInitial" class="text-center">
      <h2 class="text-3xl font-bold mb-10">L'impact de notre communauté</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div v-for="(val, key) in { 'Total': statistiques.total, 'En cours': statistiques.EN_COURS, 'Validés': statistiques.VALIDE, 'Invalides': statistiques.INVALIDE }" 
             :key="key" class="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <p class="text-4xl font-black text-primary-600">{{ chargement ? '0' : val }}</p>
          <p class="text-gray-500 font-medium uppercase text-xs mt-2">{{ key }}</p>
        </div>
      </div>
    </section>

    <!-- APPEL À L'ACTION FINAL -->
    <section class="bg-gray-900 rounded-[3rem] p-16 text-center text-white">
      <h2 class="text-4xl font-bold mb-6">Prêt à rendre votre rue plus propre ?</h2>
      <p class="text-gray-400 mb-8 max-w-xl mx-auto">Rejoignez des milliers de Kinois qui font bouger les choses au quotidien.</p>
      <router-link :to="{ name: 'inscription' }" class="bg-white text-gray-900 px-10 py-4 rounded-xl font-bold inline-block hover:bg-gray-200 transition">
        Rejoindre ELANGA
      </router-link>
    </section>
  </div>
</template>