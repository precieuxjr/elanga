import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/',
    name: 'accueil',
    component: () => import('@/views/HomeView.vue'),
    meta: { public: true }
  },
  {
    path: '/actualites',
    name: 'actualites',
    component: () => import('@/views/NewsView.vue'),
    meta: { public: true }
  },
  {
    path: '/inscription',
    name: 'inscription',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true }
  },
  {
    path: '/connexion',
    name: 'connexion',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/tableau-de-bord',
    name: 'tableau-de-bord',
    component: () => import('@/views/DashboardView.vue'),
    meta: { public: false }
  },
  {
    path: '/carte',
    name: 'carte',
    component: () => import('@/views/MapView.vue'),
    meta: { public: false }
  },
  {
    path: '/signaler',
    name: 'signaler',
    component: () => import('@/views/SignalerView.vue'),
    meta: { public: false }
  },
  {
    path: '/devenir-collaborateur',
    name: 'devenir-collaborateur',
    component: () => import('@/views/DevenirCollaborateurView.vue'),
    meta: { public: false }
  },
  {
    path: '/evenements',
    name: 'evenements',
    component: () => import('@/views/EvenementsView.vue'),
    meta: { public: false }
  },
  {
    path: '/espace-collaborateur',
    name: 'espace-collaborateur',
    component: () => import('@/views/EspaceCollaborateurView.vue'),
    meta: { public: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Redirection si accès privé non autorisé
  if (!to.meta.public && !authStore.estConnecte) {
    return next({ name: 'connexion' });
  }
  
  // Redirection si déjà connecté et tentative d'accès à login/inscription
  if (to.meta.public && authStore.estConnecte && (to.name === 'connexion' || to.name === 'inscription')) {
    return next({ name: 'tableau-de-bord' });
  }
  
  next();
});

export default router;