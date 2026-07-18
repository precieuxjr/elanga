// backend/routes/collaborationRoutes.js
//
// A monter dans routes/index.js (voir instructions livrées séparément) :
//   router.use(require('./collaborationRoutes'));
//
// ADAPTE l'import ci-dessous si ton middleware JWT n'est pas exporté sous
// le nom "authMiddleware" (vérifie authRoutes.js/userRoutes.js pour voir
// comment il est importé chez toi).
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const estCollaborateur = require('../middleware/estcollaborateur');
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
router.post('/collaborateur/demande', authMiddleware, collaborateurController.demanderStatut);
router.get('/collaborateur/ma-demande', authMiddleware, collaborateurController.maDemande);

// ---- Collaborateur : consulter et intervenir sur les signalements ----
router.get('/collaborateur/signalements', authMiddleware, estCollaborateur, collaborateurController.listerSignalements);
router.post('/collaborateur/signalements/:id/proposer', authMiddleware, estCollaborateur, collaborateurController.proposerSolution);
router.get('/collaborateur/propositions', authMiddleware, estCollaborateur, collaborateurController.mesPropositions);
router.post('/collaborateur/propositions/:id/rapport', authMiddleware, estCollaborateur, collaborateurController.envoyerRapport);

// ---- Admin : demandes de statut collaborateur ----
router.get('/admin/demandes-collaborateur', authMiddleware, estAdmin, adminCollaborationController.listerDemandes);
router.post('/admin/demandes-collaborateur/:id/accepter', authMiddleware, estAdmin, adminCollaborationController.accepterDemande);
router.post('/admin/demandes-collaborateur/:id/refuser', authMiddleware, estAdmin, adminCollaborationController.refuserDemande);

// ---- Admin : propositions de collaboration ----
router.get('/admin/collaborations', authMiddleware, estAdmin, adminCollaborationController.listerCollaborations);
router.post('/admin/collaborations/:id/accepter', authMiddleware, estAdmin, adminCollaborationController.accepterCollaboration);
router.post('/admin/collaborations/:id/refuser', authMiddleware, estAdmin, adminCollaborationController.refuserCollaboration);
router.post('/admin/collaborations/:id/cloturer', authMiddleware, estAdmin, adminCollaborationController.cloturerCollaboration);

// ---- Admin : visibilité carte (idée 1), independant du statut ----
router.post('/admin/signalements/:id/retirer-carte', authMiddleware, estAdmin, adminCollaborationController.retirerDeLaCarte);
router.post('/admin/signalements/:id/restaurer-carte', authMiddleware, estAdmin, adminCollaborationController.restaurerSurLaCarte);

module.exports = router;