const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const routes = require('./routes');
const { verifierToken } = require('./utils/jwt');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Photos des signalements (uploadees via multer) servies statiquement.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Point d'entree unique des routes API (aucune route n'est declaree ailleurs)
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'API EcoKin operationnelle.' });
});

// Authentification du socket : le client envoie son JWT dans le handshake
// (auth.token). Un socket non authentifie est rejete.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentification requise.'));
    socket.utilisateur = verifierToken(token); // { id, email, role }
    next();
  } catch (err) {
    next(new Error('Token invalide.'));
  }
});

io.on('connection', (socket) => {
  // Chaque utilisateur rejoint sa propre "room" : cela permet d'envoyer une
  // notification privee (ex: changement de statut d'un signalement) sans
  // jamais l'exposer aux autres clients connectes.
  const room = `user_${socket.utilisateur.id}`;
  socket.join(room);
  console.log(`Client connecte (socket ${socket.id}) -> room ${room}`);

  socket.on('disconnect', () => {
    console.log(`Client deconnecte: ${socket.id}`);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur EcoKin demarre sur le port ${PORT}`);
});
