<script setup>
import { ref, computed } from 'vue';
import { useMotion } from '@vueuse/motion';
import {
  Trash2, Waves, Mountain, Droplets, Users, Clock, ChevronDown,
  ArrowRight, MapPin, Newspaper
} from 'lucide-vue-next';

// Contenu editorial statique pour l'instant (pas encore de backend "actus" -
// a brancher sur un vrai service quand l'admin pourra publier des articles).
// Les 4 premieres categories reprennent volontairement les types de
// signalement de la plateforme (Dechets, Inondation, Erosion, Pollution),
// pour que le magazine reste ancre dans ce que fait reellement ELANGA.

const sectionInitial = { initial: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 700 } } };

const categories = [
  { id: 'dechets', label: 'Déchets & assainissement', icone: Trash2, couleur: 'bg-orange-50 text-orange-600' },
  { id: 'inondations', label: 'Inondations', couleur: 'bg-sky-50 text-sky-600', icone: Waves },
  { id: 'erosion', label: 'Érosion', couleur: 'bg-amber-50 text-amber-700', icone: Mountain },
  { id: 'pollution', label: "Pollution de l'eau", couleur: 'bg-cyan-50 text-cyan-700', icone: Droplets },
  { id: 'communaute', label: 'Vie communautaire', couleur: 'bg-primary-50 text-primary-700', icone: Users }
];

const articles = [
  {
    id: 1,
    categorie: 'inondations',
    aLaUne: true,
    titre: "Saison des pluies : les quartiers bas de Kinshasa sous surveillance citoyenne",
    lieu: 'Masina, Ndjili, Kimbanseke',
    date: '14 juillet 2026',
    tempsLecture: '5 min',
    accroche: "Chaque annee, les mêmes rues se transforment en rivieres. Cette saison, la carte partagee d'ELANGA permet pour la premiere fois de suivre en direct l'evolution des points d'inondation recurrents dans les communes de Tshangu.",
    paragraphes: [
      "A chaque debut de saison des pluies, les memes noms de rues reviennent dans les conversations : avenue Assossa a Masina, le carrefour de Ndjili aeroport, certaines artères de Kimbanseke ou l'eau met parfois plusieurs jours a se retirer. Ces communes, situees en zone basse et souvent traversees par des cours d'eau mal draines, concentrent une part importante des signalements d'inondation recus sur la plateforme depuis son lancement.",
      "Ce qui change cette annee, c'est la visibilite. Des qu'un citoyen signale une inondation avec sa position GPS, le signalement rejoint la carte partagee des que l'equipe de moderation le valide. Les riverains d'un quartier peuvent ainsi voir, avant de s'engager sur une avenue, si elle est deja repertoriee comme impraticable - et eviter de decouvrir le probleme les pieds dans l'eau.",
      "Au-dela de l'usage individuel, l'accumulation de ces signalements dessine surtout une cartographie utile aux autorites locales : les zones qui reviennent saison apres saison ne sont pas un hasard, mais le signe d'un probleme structurel de drainage qu'aucun signalement isole ne suffit a demontrer. C'est la repetition, agregee sur la carte, qui devient un argument.",
      "La plateforme invite donc les habitants des communes concernees a documenter systematiquement les points d'eau stagnante, meme lorsqu'ils semblent mineurs : une flaque persistante aujourd'hui peut etre l'inondation de la semaine prochaine."
    ]
  },
  {
    id: 2,
    categorie: 'dechets',
    titre: "Dépôts sauvages : pourquoi une photo change tout",
    lieu: 'Toutes communes',
    date: '10 juillet 2026',
    tempsLecture: '3 min',
    accroche: "Un tas de dechets au coin d'une rue peut sembler anodin. Documente et localise, il devient une preuve exploitable - et souvent le declencheur d'une intervention.",
    paragraphes: [
      "Le depot sauvage est, de loin, le type de signalement le plus frequent sur ELANGA. Marches informels, chantiers, ou simple manque de points de collecte reguliers : les causes varient d'une commune a l'autre, mais le resultat est le meme, des monticules qui grossissent au fil des semaines si personne ne les signale formellement.",
      "La photo jointe au signalement n'est pas un detail cosmetique. Elle permet a l'equipe de validation de distinguer un depot ponctuel d'une decharge installee depuis longtemps, et donne aux autorites communales un etat des lieux daté qu'elles peuvent comparer avant/apres une intervention.",
      "Un conseil pour les citoyens qui signalent : cadrer large plutot que serre. Une photo qui montre la rue et les batiments environnants, en plus du tas de dechets lui-meme, aide enormement a localiser precisement le probleme meme si le GPS du telephone est legerement imprecis."
    ]
  },
  {
    id: 3,
    categorie: 'erosion',
    titre: "Sur les collines de Kinshasa, l'érosion grignote les avenues",
    lieu: 'Mont-Ngafula, Kisenso, Selembao',
    date: '6 juillet 2026',
    tempsLecture: '4 min',
    accroche: "Les communes construites sur les collines sablonneuses du sud de la ville font face a un phenomene lent mais impressionnant : des ravins qui avancent parfois de plusieurs metres par saison des pluies.",
    paragraphes: [
      "Contrairement a une inondation, l'erosion ne se voit pas toujours d'un coup. Elle commence par une fissure dans le bitume, un filet d'eau qui trouve son chemin, puis un ravin qui s'elargit annee apres annee jusqu'a menacer des habitations entieres. Les communes situees sur le relief accidente au sud de la ville, ou le sol sablonneux offre peu de resistance au ruissellement, sont les plus exposees.",
      "Le signalement precoce fait ici une difference disproportionnee par rapport a son cout : un debut de ravine signalee et documentee peut parfois etre stabilisee avec des moyens simples, quand un ravin installe depuis des annees demande des travaux de genie civil bien plus lourds.",
      "C'est aussi le type de signalement ou la position GPS precise compte le plus : un ravin se deplace, et savoir exactement ou il se trouvait a une date donnee permet de mesurer sa progression dans le temps."
    ]
  },
  {
    id: 4,
    categorie: 'pollution',
    titre: "Eaux troubles : ce que révèlent les signalements de pollution",
    lieu: 'Rivière Ndjili, Rivière Makelele',
    date: '2 juillet 2026',
    tempsLecture: '4 min',
    accroche: "Rejets industriels, lessive dans les rivieres, dechets plastiques emportes par la pluie : la pollution des cours d'eau de Kinshasa a plusieurs visages, et tous ne sont pas visibles au premier coup d'oeil.",
    paragraphes: [
      "Les rivieres qui traversent Kinshasa jouent un role d'egout a ciel ouvert dans de nombreux quartiers, faute de reseau d'assainissement complet. Les signalements de pollution sur la plateforme melangent des situations tres differentes : eau visiblement coloree pres d'un point de rejet, accumulation de dechets plastiques dans un lit de riviere, ou odeurs signalees par les riverains.",
      "Cette diversite est volontaire : la plateforme ne cherche pas a qualifier techniquement la pollution (ce n'est pas son role), mais a construire un historique de terrain, photo a l'appui, que des acteurs mieux equipes pourront ensuite investiguer plus finement.",
      "A moyen terme, l'objectif est de pouvoir croiser ces signalements avec les points de captage d'eau utilises par les riverains en aval, afin de prioriser les zones ou la pollution presente un risque sanitaire direct."
    ]
  },
  {
    id: 5,
    categorie: 'communaute',
    titre: "Ils utilisent ELANGA au quotidien : trois façons de s'en servir",
    lieu: 'Kinshasa',
    date: '28 juin 2026',
    tempsLecture: '3 min',
    accroche: "Au-dela du signalement individuel, des habitudes collectives commencent a se dessiner autour de la plateforme, parfois de facon inattendue.",
    paragraphes: [
      "Le premier usage, le plus attendu, est individuel : un citoyen constate un probleme sur son trajet quotidien et le signale en quelques minutes depuis son telephone. C'est le coeur de la plateforme, et il reste le plus courant.",
      "Le deuxieme usage est plus collectif : dans certains quartiers, des petits groupes de voisins se coordonnent avant de signaler ensemble un meme probleme sous plusieurs angles, renforcant le dossier avant qu'il ne soit examine par un administrateur.",
      "Le troisieme, enfin, est preventif : consulter la carte partagee avant de se deplacer, notamment en periode de pluie, pour anticiper les zones a eviter. Un usage qui ne cree aucun signalement mais qui, pour beaucoup, justifie a lui seul l'installation de l'application."
    ]
  },
  {
    id: 6,
    categorie: 'dechets',
    titre: "Ce que devient un signalement après son envoi",
    lieu: 'Kinshasa',
    date: '22 juin 2026',
    tempsLecture: '3 min',
    accroche: "Entre le moment ou vous appuyez sur \"Envoyer\" et l'apparition eventuelle d'un marqueur sur la carte partagee, plusieurs etapes se jouent en coulisses.",
    paragraphes: [
      "Des l'envoi, le signalement passe au statut \"En cours\" et n'est visible que par vous, dans votre tableau de bord personnel. Rien n'est encore public a ce stade.",
      "Un administrateur examine ensuite le signalement : description, photo, position, et coherence entre la commune declaree et la localisation GPS. Selon ce qu'il constate, il le valide ou l'invalide.",
      "Si le signalement est valide, il rejoint instantanement la carte partagee, visible par tous les citoyens connectes, et vous recevez une notification. S'il est invalide, vous en etes egalement informe, ce qui vous permet de renvoyer un signalement corrige si besoin."
    ]
  }
];

const filtreActif = ref('tous');
const articleOuvertId = ref(articles.find(a => a.aLaUne)?.id ?? null);

const articlesSecondaires = computed(() => {
  const liste = articles.filter(a => !a.aLaUne);
  if (filtreActif.value === 'tous') return liste;
  return liste.filter(a => a.categorie === filtreActif.value);
});

const articleUne = computed(() => articles.find(a => a.aLaUne));

function categorieDe(id) {
  return categories.find(c => c.id === id);
}

function basculerArticle(id) {
  articleOuvertId.value = articleOuvertId.value === id ? null : id;
}
</script>

<template>
  <div class="space-y-14 py-10">

    <!-- MASTHEAD -->
    <section v-motion="sectionInitial" class="text-center space-y-3">
      <span class="inline-flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-[0.2em]">
        <Newspaper :size="16" /> Le journal d'ELANGA
      </span>
      <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900">Actualités & terrain</h1>
      <p class="text-gray-500 max-w-xl mx-auto">
        Ce qui se passe dans les rues de Kinshasa, vu a travers les signalements de la communaute.
      </p>
    </section>

    <!-- FILTRES CATEGORIES -->
    <section class="flex flex-wrap justify-center gap-3">
      <button
        @click="filtreActif = 'tous'"
        :class="filtreActif === 'tous' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        class="px-4 py-2 rounded-full text-sm font-semibold transition-colors">
        Tout
      </button>
      <button
        v-for="c in categories" :key="c.id"
        @click="filtreActif = c.id"
        :class="filtreActif === c.id ? 'bg-gray-900 text-white' : `${c.couleur} hover:opacity-80`"
        class="px-4 py-2 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-2">
        <component :is="c.icone" :size="14" /> {{ c.label }}
      </button>
    </section>

    <!-- ARTICLE A LA UNE -->
    <section v-if="articleUne" v-motion="sectionInitial" class="bg-gray-900 rounded-[2rem] overflow-hidden">
      <div class="grid md:grid-cols-5 gap-0">
        <div class="md:col-span-2 p-10 flex flex-col justify-center bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <component :is="categorieDe(articleUne.categorie).icone" :size="40" class="mb-6 opacity-80" />
          <span class="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">À la une</span>
          <h2 class="text-2xl font-bold leading-snug">{{ articleUne.titre }}</h2>
        </div>
        <div class="md:col-span-3 p-10 text-gray-200">
          <div class="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span class="inline-flex items-center gap-1"><MapPin :size="14" /> {{ articleUne.lieu }}</span>
            <span class="inline-flex items-center gap-1"><Clock :size="14" /> {{ articleUne.tempsLecture }}</span>
            <span>{{ articleUne.date }}</span>
          </div>
          <p class="text-lg text-gray-100 mb-4">{{ articleUne.accroche }}</p>
          <div v-if="articleOuvertId === articleUne.id" class="space-y-4 text-gray-300 text-sm leading-relaxed">
            <p v-for="(p, i) in articleUne.paragraphes" :key="i">{{ p }}</p>
          </div>
          <button @click="basculerArticle(articleUne.id)"
            class="mt-4 inline-flex items-center gap-2 text-primary-400 font-semibold text-sm hover:text-primary-300">
            {{ articleOuvertId === articleUne.id ? 'Réduire' : "Lire l'article complet" }}
            <ChevronDown :size="16" :class="articleOuvertId === articleUne.id && 'rotate-180'" class="transition-transform" />
          </button>
        </div>
      </div>
    </section>

    <!-- GRILLE D'ARTICLES -->
    <section class="grid md:grid-cols-2 gap-6">
      <article
        v-for="a in articlesSecondaires" :key="a.id"
        v-motion="sectionInitial"
        class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">

        <div :class="categorieDe(a.categorie).couleur" class="p-6 flex items-center justify-between">
          <span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <component :is="categorieDe(a.categorie).icone" :size="16" /> {{ categorieDe(a.categorie).label }}
          </span>
        </div>

        <div class="p-6">
          <div class="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <span class="inline-flex items-center gap-1"><MapPin :size="12" /> {{ a.lieu }}</span>
            <span class="inline-flex items-center gap-1"><Clock :size="12" /> {{ a.tempsLecture }}</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2 leading-snug">{{ a.titre }}</h3>
          <p class="text-sm text-gray-500 mb-4">{{ a.accroche }}</p>

          <Transition name="depli">
            <div v-if="articleOuvertId === a.id" class="space-y-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 mb-4">
              <p v-for="(p, i) in a.paragraphes" :key="i">{{ p }}</p>
            </div>
          </Transition>

          <button @click="basculerArticle(a.id)"
            class="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm hover:text-primary-700">
            {{ articleOuvertId === a.id ? 'Réduire' : 'Lire la suite' }}
            <ChevronDown :size="16" :class="articleOuvertId === a.id && 'rotate-180'" class="transition-transform" />
          </button>
        </div>
      </article>
    </section>

    <!-- CTA VERS LA CARTE -->
    <section v-motion="sectionInitial" class="bg-primary-50 rounded-3xl p-10 text-center">
      <p class="text-primary-800 font-semibold mb-4">Envie de voir ces signalements sur le terrain plutôt qu'en lecture ?</p>
      <router-link :to="{ name: 'carte' }"
        class="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-primary-700 transition">
        Explorer la carte en direct <ArrowRight :size="18" />
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.depli-enter-active, .depli-leave-active {
  transition: all 0.25s ease;
}
.depli-enter-from, .depli-leave-to {
  opacity: 0;
  max-height: 0;
}
.depli-enter-to, .depli-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
