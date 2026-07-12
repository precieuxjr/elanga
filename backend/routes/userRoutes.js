const express = require('express');
const router = express.Router();
const { authentifier } = require('../middleware/authMiddleware');
const { uploadPhotoSignalement } = require('../config/upload');
const {
  profil,
  tableauDeBord,
  mesSignalements,
  ajouterSignalement
} = require('../controllers/userController');

router.use(authentifier); // toutes les routes ci-dessous exigent un token valide

router.get('/me', profil);
router.get('/me/dashboard', tableauDeBord);
router.get('/me/signalements', mesSignalements);
router.post('/me/signalements', uploadPhotoSignalement.single('photo'), ajouterSignalement);

module.exports = router;
