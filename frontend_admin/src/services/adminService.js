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
  }
};
