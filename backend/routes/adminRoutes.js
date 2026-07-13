const express = require('express');
const router = express.Router();
const { authentifier } = require('../middleware/authMiddleware');
const { autoriserRoles } = require('../middleware/roleMiddleware');
const {
  validerSignalement,
  inValiderSignalement,
  listerUtilisateurs,
  detailUtilisateur,
  listerSignalements,
  statistiques
} = require('../controllers/adminController');

router.use(authentifier, autoriserRoles('ADMINISTRATEUR'));

router.get('/statistiques', statistiques);
router.get('/utilisateurs', listerUtilisateurs);
router.get('/utilisateurs/:id', detailUtilisateur);
router.get('/signalements', listerSignalements);
router.post('/signalements/:id/valider', validerSignalement);
router.post('/signalements/:id/invalider', inValiderSignalement);

module.exports = router;
