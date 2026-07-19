// backend/routes/Collaborationroutes.js
const express = require('express');
const router = express.Router();

// authMiddleware.js exporte { authentifier }, pas une fonction directement
// (verifie dans adminRoutes.js : c'est le meme import chez toi).
const { authentifier } = require('../middleware/authMiddleware');
const estCollaborateur = require('../middleware/estcollaborateur');
const uploadRapportCollaboration = require('../middleware/uploadRapportCollaboration');
const collaborateurController = require('../controllers/Collaborateurcontroller');
const adminCollaborationController = require('../controllers/Admincollaborationcontroller');

// Petit middleware autonome (ne depend d'aucun fichier existant inconnu) :
// verifie que l'utilisateur authentifie est bien ADMINISTRATEUR.
function estAdmin(req, res, next) {
  if (!req.utilisateur || req.utilisateur.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
}

// ---- Contributeur : demande de statut collaborateur ----
router.post('/collaborateur/demande', authentifier, collaborateurController.demanderStatut);
router.get('/collaborateur/ma-demande', authentifier, collaborateurController.maDemande);

// ---- Collaborateur : consulter et intervenir sur les signalements ----
router.get('/collaborateur/signalements', authentifier, estCollaborateur, collaborateurController.listerSignalements);
router.post('/collaborateur/signalements/:id/proposer', authentifier, estCollaborateur, collaborateurController.proposerSolution);
router.get('/collaborateur/propositions', authentifier, estCollaborateur, collaborateurController.mesPropositions);
router.post('/collaborateur/propositions/:id/rapport', authentifier, estCollaborateur, uploadRapportCollaboration, collaborateurController.envoyerRapport);

// ---- Admin : demandes de statut collaborateur ----
router.get('/admin/demandes-collaborateur', authentifier, estAdmin, adminCollaborationController.listerDemandes);
router.post('/admin/demandes-collaborateur/:id/accepter', authentifier, estAdmin, adminCollaborationController.accepterDemande);
router.post('/admin/demandes-collaborateur/:id/refuser', authentifier, estAdmin, adminCollaborationController.refuserDemande);

// ---- Admin : propositions de collaboration ----
router.get('/admin/collaborations', authentifier, estAdmin, adminCollaborationController.listerCollaborations);
router.post('/admin/collaborations/:id/accepter', authentifier, estAdmin, adminCollaborationController.accepterCollaboration);
router.post('/admin/collaborations/:id/refuser', authentifier, estAdmin, adminCollaborationController.refuserCollaboration);
router.post('/admin/collaborations/:id/cloturer', authentifier, estAdmin, adminCollaborationController.cloturerCollaboration);

// ---- Admin : visibilité carte (idée 1), independant du statut ----
router.post('/admin/signalements/:id/retirer-carte', authentifier, estAdmin, adminCollaborationController.retirerDeLaCarte);
router.post('/admin/signalements/:id/restaurer-carte', authentifier, estAdmin, adminCollaborationController.restaurerSurLaCarte);

module.exports = router;