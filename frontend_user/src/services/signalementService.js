import api from './api';

export default {
  // Tous les signalements VALIDE (visibles par tout citoyen connecte), pour
  // afficher la carte generale et eviter les signalements en double.
  async getCarte() {
    const { data } = await api.get('/signalements/carte');
    return data;
  }
};
