import api from './api';

export default {
  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  async registerAdmin(payload) {
    const { data } = await api.post('/auth/register-admin', payload);
    return data;
  }
};
