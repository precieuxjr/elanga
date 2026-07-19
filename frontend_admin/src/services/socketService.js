import { io } from 'socket.io-client';

// Point d'entree unique pour le temps reel cote admin, au meme titre que
// api.js pour le REST. Calque sur frontend_user/src/services/socketService.js.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket = null;

function connecterSocket() {
  // Cle confirmee par frontend_admin/src/services/api.js (intercepteur Axios).
  const token = localStorage.getItem('elanga_admin_token');
  if (!token) return null;

  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true
  });

  return socket;
}

function deconnecterSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function getSocket() {
  return socket;
}

export default { connecterSocket, deconnecterSocket, getSocket };