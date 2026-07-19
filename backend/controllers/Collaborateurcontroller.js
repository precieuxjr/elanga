const demandeCollaborateurModel = require('../models/demandecollaborateur_model');
const collaborationModel = require('../models/collaboration_Model');
const signalementModel = require('../models/signalementModel');

// POST /api/collaborateur/demande
async function demanderStatut(req, res) {
  try {
    if (req.utilisateur.role !== 'CONTRIBUTEUR') {
      return res.status(400).json({ message: 'Seul un contributeur peut demander le statut de collaborateur.' });
    }
    const { type_organisation, nom_organisation, justification } = req.body;
    if (!type_organisation || !nom_organisation) {
      return res.status(400).json({ message: "Type et nom de l'organisation obligatoires." });
    }
    const dejaEnAttente = await demandeCollaborateurModel.demandeEnAttentePour(req.utilisateur.id);
    if (dejaEnAttente) {
      return res.status(409).json({ message: 'Une demande est déjà en attente de traitement.' });
    }
    const id = await demandeCollaborateurModel.creerDemande(req.utilisateur.id, {
      type_organisation, nom_organisation, justification
    });
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
// Signalements VALIDE ouverts a une proposition de collaboration.
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
// Cree un "evenement d'assainissement" : titre + date prevue + message.
async function proposerSolution(req, res) {
  try {
    const { titre, date_evenement, message } = req.body;
    if (!titre || !message) {
      return res.status(400).json({ message: 'Un titre et un message de proposition sont requis.' });
    }

    const signalement = await signalementModel.obtenirParId(req.params.id);
    if (!signalement) return res.status(404).json({ message: 'Signalement introuvable.' });
    if (signalement.statut !== 'VALIDE') {
      return res.status(400).json({ message: "Ce signalement n'est pas (ou plus) ouvert aux propositions." });
    }

    const id = await collaborationModel.creerProposition(req.params.id, req.utilisateur.id, {
      titre, date_evenement, message
    });

    try {
      const proposition = await collaborationModel.obtenirParId(id);
      req.app.get('io').to('admins').emit('admin:nouvelle_proposition', proposition);
    } catch (e) {
      console.error('Erreur emission socket nouvelle_proposition:', e);
    }

    return res.status(201).json({ message: 'Événement proposé, en attente de validation.', id });
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

// POST /api/collaborateur/collaborations/:id/debuter
// Etape 1 : le collaborateur commence l'assainissement sur le terrain.
// multipart/form-data : un seul fichier "photo_avant".
async function demarrerAssainissement(req, res) {
  try {
    const proposition = await collaborationModel.obtenirParId(req.params.id);
    if (!proposition) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (proposition.collaborateur_id !== req.utilisateur.id) {
      return res.status(403).json({ message: "Ce n'est pas votre événement." });
    }
    if (proposition.statut !== 'ACCEPTEE') {
      return res.status(400).json({ message: "Cet événement n'a pas (encore) reçu le feu vert, ou a déjà démarré." });
    }
    const photoAvant = req.file;
    if (!photoAvant) {
      return res.status(400).json({ message: 'La photo du lieu avant intervention est obligatoire.' });
    }

    const misAJour = await collaborationModel.demarrerAssainissement(
      req.params.id,
      `/uploads/collaborations/${photoAvant.filename}`
    );

    // Les participants inscrits (et les admins) sont informes que ça a demarre.
    req.app.get('io').emit('evenement:mis_a_jour', misAJour);

    return res.json({ message: 'Assainissement démarré.', proposition: misAJour });
  } catch (err) {
    console.error('Erreur demarrage assainissement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/collaborateur/propositions/:id/rapport
// Etape 2 : cloture terrain. multipart/form-data : "rapport" (texte) +
// un seul fichier "photo_apres" (la photo avant a deja ete fournie a
// l'etape "debuter").
async function envoyerRapport(req, res) {
  try {
    const { rapport } = req.body;
    if (!rapport) return res.status(400).json({ message: 'Le rapport ne peut pas être vide.' });

    const photoApres = req.file;
    if (!photoApres) {
      return res.status(400).json({ message: 'La photo du lieu après intervention est obligatoire.' });
    }

    const proposition = await collaborationModel.obtenirParId(req.params.id);
    if (!proposition) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (proposition.collaborateur_id !== req.utilisateur.id) {
      return res.status(403).json({ message: "Ce n'est pas votre événement." });
    }
    if (proposition.statut !== 'ASSAINISSEMENT_EN_COURS') {
      return res.status(400).json({ message: "L'assainissement doit d'abord être démarré (photo avant) avant d'envoyer le rapport final." });
    }

    const misAJour = await collaborationModel.envoyerRapport(req.params.id, {
      rapport,
      photo_apres_lien: `/uploads/collaborations/${photoApres.filename}`
    });

    try {
      req.app.get('io').to('admins').emit('admin:rapport_recu', misAJour);
    } catch (e) {
      console.error('Erreur emission socket rapport_recu:', e);
    }

    return res.json({ message: "Rapport envoyé à l'administrateur.", proposition: misAJour });
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
  demarrerAssainissement,
  envoyerRapport
};