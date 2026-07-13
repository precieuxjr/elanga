import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/connexion',
    name: 'connexion',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/inscription',
    name: 'inscription',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'tableau-de-bord',
    component: () => import('@/views/DashboardView.vue'),
    meta: { public: false }
  },
  {
    path: '/utilisateurs',
    name: 'utilisateurs',
    component: () => import('@/views/UsersView.vue'),
    meta: { public: false }
  },
  {
    path: '/utilisateurs/:id',
    name: 'utilisateur-detail',
    component: () => import('@/views/UserDetailView.vue'),
    meta: { public: false }
  },
  {
    path: '/signalements',
    name: 'signalements',
    component: () => import('@/views/ReportsView.vue'),
    meta: { public: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (!to.meta.public && !authStore.estConnecte) {
    return next({ name: 'connexion' });
  }
  if (to.meta.public && authStore.estConnecte && (to.name === 'connexion' || to.name === 'inscription')) {
    return next({ name: 'tableau-de-bord' });
  }
  next();
});

export default router;
