const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const routes = require('./routes');
const { verifierToken } = require('./utils/jwt');

const app = express();
const server = http.createServer(app);

// --------------------------------------------------------------
// 1. Construction de la liste des origines autorisées
// --------------------------------------------------------------
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const adminOrigins = (process.env.ADMIN_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const originsAutorisees = [...new Set([...clientOrigins, ...adminOrigins])];

console.log('🔐 Origines autorisées (CORS) :', originsAutorisees);

// --------------------------------------------------------------
// 2. Middleware CORS personnalisé (plus fiable que la librairie)
// --------------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Vérifier si l'origine est dans la liste autorisée
  if (originsAutorisees.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (originsAutorisees.length === 1 && originsAutorisees[0] === '*') {
    // Cas particulier : si on autorise toutes les origines
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  // En-têtes communs
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Gestion du preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Réponse immédiate sans suite
  }
  next();
});

// --------------------------------------------------------------
// 3. Middlewares standards
// --------------------------------------------------------------
app.use(express.json());

// --------------------------------------------------------------
// 4. Fichiers statiques (uploads)
// --------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------------------------------------------
// 5. Routes API
// --------------------------------------------------------------
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'API EcoKin operationnelle.' });
});

// --------------------------------------------------------------
// 6. Socket.IO avec CORS
// --------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: originsAutorisees,
    credentials: true,
  }
});

// --------------------------------------------------------------
// 7. Authentification Socket.IO (JWT)
// --------------------------------------------------------------
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
  const room = `user_${socket.utilisateur.id}`;
  socket.join(room);
  console.log(`Client connecté (socket ${socket.id}) -> room ${room}`);

  socket.on('disconnect', () => {
    console.log(`Client déconnecté: ${socket.id}`);
  });
});

app.set('io', io);

// --------------------------------------------------------------
// 8. Démarrage du serveur
// --------------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur EcoKin démarré sur le port ${PORT}`);
});