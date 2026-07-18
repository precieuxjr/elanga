const demandeCollaborateurModel = require('../models/demandecollaborateur_model');
const collaborationModel = require('../models/collaboration_Model');
const signalementModel = require('../models/signalementModel');

// ================================================================
// Demandes de statut collaborateur
// ================================================================

// GET /api/admin/demandes-collaborateur?statut=EN_ATTENTE
async function listerDemandes(req, res) {
  try {
    const demandes = await demandeCollaborateurModel.lister({
      statut: req.query.statut,
    });
    return res.json({ demandes });
  } catch (err) {
    console.error('Erreur liste demandes collaborateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/demandes-collaborateur/:id/accepter
async function accepterDemande(req, res) {
  try {
    const demande = await demandeCollaborateurModel.accepter(
      req.params.id,
      req.utilisateur.id
    );
    if (!demande)
      return res.status(404).json({ message: 'Demande introuvable.' });

    // Le contributeur devenu collaborateur est notifie individuellement,
    // meme mecanisme que signalement:statut_change (room user_<id>).
    req.app
      .get('io')
      .to(`user_${demande.utilisateur_id}`)
      .emit('collaborateur:demande_traitee', demande);

    return res.json({
      message: 'Demande acceptée, utilisateur promu collaborateur.',
      demande,
    });
  } catch (err) {
    console.error('Erreur acceptation demande:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/demandes-collaborateur/:id/refuser
async function refuserDemande(req, res) {
  try {
    const demande = await demandeCollaborateurModel.refuser(
      req.params.id,
      req.utilisateur.id
    );
    if (!demande)
      return res.status(404).json({ message: 'Demande introuvable.' });

    req.app
      .get('io')
      .to(`user_${demande.utilisateur_id}`)
      .emit('collaborateur:demande_traitee', demande);

    return res.json({ message: 'Demande refusée.', demande });
  } catch (err) {
    console.error('Erreur refus demande:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ================================================================
// Propositions de collaboration (proposer -> feu vert -> rapport -> cloture)
// ================================================================

// GET /api/admin/collaborations?statut=EN_ATTENTE
async function listerCollaborations(req, res) {
  try {
    const collaborations = await collaborationModel.lister({
      statut: req.query.statut,
    });
    return res.json({ collaborations });
  } catch (err) {
    console.error('Erreur liste collaborations:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/collaborations/:id/accepter  (le "feu vert")
async function accepterCollaboration(req, res) {
  try {
    const proposition = await collaborationModel.accepter(
      req.params.id,
      req.utilisateur.id
    );
    if (!proposition)
      return res.status(404).json({ message: 'Proposition introuvable.' });

    req.app
      .get('io')
      .to(`user_${proposition.collaborateur_id}`)
      .emit('collaborateur:proposition_traitee', proposition);

    return res.json({
      message: 'Feu vert donné au collaborateur.',
      proposition,
    });
  } catch (err) {
    console.error('Erreur acceptation collaboration:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/collaborations/:id/refuser
async function refuserCollaboration(req, res) {
  try {
    const proposition = await collaborationModel.refuser(
      req.params.id,
      req.utilisateur.id
    );
    if (!proposition)
      return res.status(404).json({ message: 'Proposition introuvable.' });

    req.app
      .get('io')
      .to(`user_${proposition.collaborateur_id}`)
      .emit('collaborateur:proposition_traitee', proposition);

    return res.json({ message: 'Proposition refusée.', proposition });
  } catch (err) {
    console.error('Erreur refus collaboration:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/collaborations/:id/cloturer
// L'admin juge le rapport suffisant : la collaboration est cloturee ET le
// signalement passe a RESOLU, ce qui le retire automatiquement de la carte
// (meme filtre que listerTousValides -> statut = 'VALIDE' uniquement).
async function cloturerCollaboration(req, res) {
  try {
    const proposition = await collaborationModel.obtenirParId(req.params.id);
    if (!proposition)
      return res.status(404).json({ message: 'Proposition introuvable.' });
    if (proposition.statut !== 'RAPPORT_ENVOYE') {
      return res
        .status(400)
        .json({ message: 'Aucun rapport à valider pour cette proposition.' });
    }

    const cloturee = await collaborationModel.cloturer(
      req.params.id,
      req.utilisateur.id
    );
    const signalement = await signalementModel.marquerResolu(
      proposition.signalement_id
    );

    req.app
      .get('io')
      .to(`user_${proposition.collaborateur_id}`)
      .emit('collaborateur:proposition_traitee', cloturee);
    // Meme evenement que pour une invalidation : le marqueur disparait de
    // toutes les cartes ouvertes en direct.
    req.app.get('io').emit('carte:marqueur_retire', { id: signalement.id });

    return res.json({
      message: 'Collaboration clôturée, signalement marqué résolu.',
      signalement,
    });
  } catch (err) {
    console.error('Erreur cloture collaboration:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ================================================================
// Idee 1 : retirer/restaurer un signalement de la carte publique,
// independamment de son statut en base.
// ================================================================

// POST /api/admin/signalements/:id/retirer-carte
async function retirerDeLaCarte(req, res) {
  try {
    const signalement = await signalementModel.definirVisibiliteCarte(
      req.params.id,
      false
    );
    if (!signalement)
      return res.status(404).json({ message: 'Signalement introuvable.' });

    req.app.get('io').emit('carte:marqueur_retire', { id: signalement.id });

    return res.json({
      message: 'Signalement retiré de la carte (toujours en base).',
      signalement,
    });
  } catch (err) {
    console.error('Erreur retrait carte:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/signalements/:id/restaurer-carte
async function restaurerSurLaCarte(req, res) {
  try {
    const signalement = await signalementModel.definirVisibiliteCarte(
      req.params.id,
      true
    );
    if (!signalement)
      return res.status(404).json({ message: 'Signalement introuvable.' });

    // Ne republie sur la carte que si les conditions normales d'affichage
    // sont remplies (statut VALIDE + commune coherente), pour rester
    // cohérent avec le filtre de listerTousValides.
    const coherenceOk =
      signalement.commune_coherente === null ||
      signalement.commune_coherente === 1;
    if (signalement.statut === 'VALIDE' && coherenceOk) {
      req.app.get('io').emit('carte:nouveau_marqueur', signalement);
    }

    return res.json({
      message: 'Signalement restauré sur la carte.',
      signalement,
    });
  } catch (err) {
    console.error('Erreur restauration carte:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = {
  listerDemandes,
  accepterDemande,
  refuserDemande,
  listerCollaborations,
  accepterCollaboration,
  refuserCollaboration,
  cloturerCollaboration,
  retirerDeLaCarte,
  restaurerSurLaCarte,
};
