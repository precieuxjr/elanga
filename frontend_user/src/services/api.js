import axios from 'axios';

// Construction de la baseURL avec '/api' automatiquement ajouté
const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Si la base ne contient pas '/api' à la fin, on l'ajoute
const baseURL = base.endsWith('/api') ? base : `${base}/api`;

const api = axios.create({
  baseURL: baseURL
});

// Le reste de votre code (intercepteurs) reste inchangé
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecokin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ecokin_token');
      localStorage.removeItem('ecokin_user');
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export default api;