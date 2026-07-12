import api from './api';

export default {
  async getStatistiques() {
    const { data } = await api.get('/public/statistiques');
    return data;
  }
};
