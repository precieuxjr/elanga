import { defineStore } from 'pinia';
import authService from '@/services/authService';
import socketService from '@/services/socketService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('ecokin_token') || null,
    utilisateur: JSON.parse(localStorage.getItem('ecokin_user') || 'null')
  }),

  getters: {
    estConnecte: (state) => !!state.token
  },

  actions: {
    definirSession(token, utilisateur) {
      this.token = token;
      this.utilisateur = utilisateur;
      localStorage.setItem('ecokin_token', token);
      localStorage.setItem('ecokin_user', JSON.stringify(utilisateur));
      socketService.connecterSocket();
    },

    async inscrire(payload) {
      const data = await authService.register(payload);
      this.definirSession(data.token, data.utilisateur);
      return data;
    },

    async connecter(payload) {
      const data = await authService.login(payload);
      this.definirSession(data.token, data.utilisateur);
      return data;
    },

    deconnecter() {
      this.token = null;
      this.utilisateur = null;
      localStorage.removeItem('ecokin_token');
      localStorage.removeItem('ecokin_user');
      socketService.deconnecterSocket();
    }
  }
});
