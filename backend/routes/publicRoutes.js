const express = require('express');
const router = express.Router();
const { statistiques } = require('../controllers/statsController');

// Aucun middleware d'authentification ici : ces routes sont volontairement
// publiques (donnees agregees, sans aucune information personnelle).
router.get('/statistiques', statistiques);

module.exports = router;
