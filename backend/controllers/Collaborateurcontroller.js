const demandeCollaborateurModel = require('../models/demandecollaborateur_model.js');
const collaborationModel = require('../models/collaboration_Model.js');
const signalementModel = require('../models/signalementModel');

// POST /api/collaborateur/demande
// Un CONTRIBUTEUR demande a devenir COLLABORATEUR (ONG, centre, ecole...).
async function demanderStatut(req, res) {
  try {
    if (req.utilisateur.role !== 'CONTRIBUTEUR') {
      return res.status(400).json({ message: 'Seul un contributeur peut demander le statut de collaborateur.' });
    }

    const { type_organisation, nom_organisation, justification } = req.body;
    if (!type_organisation || !nom_organisation) {
      return res.status(400).json({ message: 'Type et nom de l\'organisation obligatoires.' });
    }

    const dejaEnAttente = await demandeCollaborateurModel.demandeEnAttentePour(req.utilisateur.id);
    if (dejaEnAttente) {
      return res.status(409).json({ message: 'Une demande est déjà en attente de traitement.' });
    }

    const id = await demandeCollaborateurModel.creerDemande(req.utilisateur.id, {
      type_organisation, nom_organisation, justification
    });

    // Notifie les admins en temps reel (meme room 'admins' que pour les
    // nouveaux signalements).
    try {
      const demande = await demandeCollaborateurModel.obtenirParId(id);
      req.app.get('io').to('admins').emit('admin:nouvelle_demande_collaborateur', demande);
    } catch (e) {
      console.error('Erreur emission socket nouvelle_demande_collaborateur:', e);
    }

    return res.status(201).json({ message: 'Demande envoyée.', id });
  } catch (err) {
    console.error('Erreur demande collaborateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/collaborateur/ma-demande
// Permet au contributeur de suivre le statut de sa derniere demande.
async function maDemande(req, res) {
  try {
    const demande = await demandeCollaborateurModel.obtenirDerniereDemandePour(req.utilisateur.id);
    return res.json({ demande: demande || null });
  } catch (err) {
    console.error('Erreur ma demande:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/collaborateur/signalements
// Reserve aux COLLABORATEUR (et ADMINISTRATEUR) via le middleware estCollaborateur.
async function listerSignalements(req, res) {
  try {
    const signalements = await signalementModel.listerValidesPourCollaboration();
    return res.json({ signalements });
  } catch (err) {
    console.error('Erreur liste signalements collaborateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/collaborateur/signalements/:id/proposer
async function proposerSolution(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Un message de proposition est requis.' });

    const signalement = await signalementModel.obtenirParId(req.params.id);
    if (!signalement) return res.status(404).json({ message: 'Signalement introuvable.' });
    if (signalement.statut !== 'VALIDE') {
      return res.status(400).json({ message: 'Ce signalement n\'est pas (ou plus) ouvert aux propositions.' });
    }

    const id = await collaborationModel.creerProposition(req.params.id, req.utilisateur.id, message);

    try {
      const proposition = await collaborationModel.obtenirParId(id);
      req.app.get('io').to('admins').emit('admin:nouvelle_proposition', proposition);
    } catch (e) {
      console.error('Erreur emission socket nouvelle_proposition:', e);
    }

    return res.status(201).json({ message: 'Proposition envoyée.', id });
  } catch (err) {
    console.error('Erreur proposition collaboration:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/collaborateur/propositions
async function mesPropositions(req, res) {
  try {
    const propositions = await collaborationModel.listerParCollaborateur(req.utilisateur.id);
    return res.json({ propositions });
  } catch (err) {
    console.error('Erreur mes propositions:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/collaborateur/propositions/:id/rapport
// POST /api/collaborateur/propositions/:id/rapport
// multipart/form-data : champ texte "rapport" + 2 fichiers "photo_avant" et
// "photo_apres" (traites par uploadRapportCollaboration.js / multer).
async function envoyerRapport(req, res) {
  try {
    const { rapport } = req.body;
    if (!rapport) return res.status(400).json({ message: 'Le rapport ne peut pas être vide.' });

    const photoAvant = req.files?.photo_avant?.[0];
    const photoApres = req.files?.photo_apres?.[0];
    if (!photoAvant || !photoApres) {
      return res.status(400).json({ message: 'Les deux photos (avant et après intervention) sont obligatoires.' });
    }

    const proposition = await collaborationModel.obtenirParId(req.params.id);
    if (!proposition) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (proposition.collaborateur_id !== req.utilisateur.id) {
      return res.status(403).json({ message: 'Ce n\'est pas votre proposition.' });
    }
    if (proposition.statut !== 'ACCEPTEE') {
      return res.status(400).json({ message: 'Cette proposition n\'a pas (encore) reçu le feu vert de l\'administrateur.' });
    }

    const misAJour = await collaborationModel.envoyerRapport(req.params.id, {
      rapport,
      photo_avant_lien: `/uploads/collaborations/${photoAvant.filename}`,
      photo_apres_lien: `/uploads/collaborations/${photoApres.filename}`
    });

    try {
      req.app.get('io').to('admins').emit('admin:rapport_recu', misAJour);
    } catch (e) {
      console.error('Erreur emission socket rapport_recu:', e);
    }

    return res.json({ message: 'Rapport envoyé à l\'administrateur.', proposition: misAJour });
  } catch (err) {
    console.error('Erreur envoi rapport:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = {
  demanderStatut,
  maDemande,
  listerSignalements,
  proposerSolution,
  mesPropositions,
  envoyerRapport
};