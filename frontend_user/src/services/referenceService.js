import api from './api';

export default {
  async getCommunes() {
    const { data } = await api.get('/reference/communes');
    return data;
  },
  async getTypesSignalement() {
    const { data } = await api.get('/reference/types-signalement');
    return data;
  }
};
