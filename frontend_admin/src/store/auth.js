import { defineStore } from 'pinia';
import authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('elanga_admin_token') || null,
    utilisateur: JSON.parse(localStorage.getItem('elanga_admin_user') || 'null')
  }),

  getters: {
    estConnecte: (state) => !!state.token
  },

  actions: {
    definirSession(token, utilisateur) {
      this.token = token;
      this.utilisateur = utilisateur;
      localStorage.setItem('elanga_admin_token', token);
      localStorage.setItem('elanga_admin_user', JSON.stringify(utilisateur));
    },

    async connecter(payload) {
      const data = await authService.login(payload);

      // Le backend authentifie n'importe quel role : cote client, on
      // refuse explicitement les comptes non-administrateurs.
      if (data.utilisateur.role !== 'ADMINISTRATEUR') {
        throw { response: { data: { message: "Ce compte n'a pas les droits administrateur." } } };
      }

      this.definirSession(data.token, data.utilisateur);
      return data;
    },

    async inscrire(payload) {
      const data = await authService.registerAdmin(payload);
      this.definirSession(data.token, data.utilisateur);
      return data;
    },

    deconnecter() {
      this.token = null;
      this.utilisateur = null;
      localStorage.removeItem('elanga_admin_token');
      localStorage.removeItem('elanga_admin_user');
    }
  }
});
