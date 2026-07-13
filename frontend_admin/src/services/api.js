import axios from 'axios';

// Construction de l'URL de base en s'assurant qu'elle se termine par '/api'
const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: baseURL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elanga_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('elanga_admin_token');
      localStorage.removeItem('elanga_admin_user');
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export default api;