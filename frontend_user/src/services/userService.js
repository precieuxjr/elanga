import api from './api';

export default {
  async getProfil() {
    const { data } = await api.get('/users/me');
    return data;
  },
  async getDashboard() {
    const { data } = await api.get('/users/me/dashboard');
    return data;
  },
  async getMesSignalements() {
    const { data } = await api.get('/users/me/signalements');
    return data;
  },
  async creerSignalement(formData) {
    // formData est une instance de FormData (champs texte + photo).
    const { data } = await api.post('/users/me/signalements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};
