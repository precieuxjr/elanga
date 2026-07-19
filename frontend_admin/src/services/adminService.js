import api from './api';

export default {
  async getStatistiques() {
    const { data } = await api.get('/admin/statistiques');
    return data;
  },
  async getUtilisateurs() {
    const { data } = await api.get('/admin/utilisateurs');
    return data;
  },
  async getUtilisateur(id) {
    const { data } = await api.get(`/admin/utilisateurs/${id}`);
    return data;
  },
  async getSignalements(filtres = {}) {
    const { data } = await api.get('/admin/signalements', { params: filtres });
    return data;
  },
  async validerSignalement(id) {
    const { data } = await api.post(`/admin/signalements/${id}/valider`);
    return data;
  },
  async invaliderSignalement(id) {
    const { data } = await api.post(`/admin/signalements/${id}/invalider`);
    return data;
  },

  // --- Idee 1 : visibilite carte independante du statut ---
  async retirerDeLaCarte(id) {
    const { data } = await api.post(`/admin/signalements/${id}/retirer-carte`);
    return data;
  },
  async restaurerSurLaCarte(id) {
    const { data } = await api.post(`/admin/signalements/${id}/restaurer-carte`);
    return data;
  },

  // --- Demandes de statut collaborateur ---
  async getDemandesCollaborateur(filtres = {}) {
    const { data } = await api.get('/admin/demandes-collaborateur', { params: filtres });
    return data;
  },
  async accepterDemandeCollaborateur(id) {
    const { data } = await api.post(`/admin/demandes-collaborateur/${id}/accepter`);
    return data;
  },
  async refuserDemandeCollaborateur(id) {
    const { data } = await api.post(`/admin/demandes-collaborateur/${id}/refuser`);
    return data;
  },

  // --- Propositions de collaboration (feu vert -> rapport -> cloture) ---
  async getCollaborations(filtres = {}) {
    const { data } = await api.get('/admin/collaborations', { params: filtres });
    return data;
  },
  async accepterCollaboration(id) {
    const { data } = await api.post(`/admin/collaborations/${id}/accepter`);
    return data;
  },
  async refuserCollaboration(id) {
    const { data } = await api.post(`/admin/collaborations/${id}/refuser`);
    return data;
  },
  async cloturerCollaboration(id) {
    const { data } = await api.post(`/admin/collaborations/${id}/cloturer`);
    return data;
  }
};