const { trouverParId } = require('../models/utilisateurModel');
const { listerParUtilisateur, statistiquesParUtilisateur, creerSignalement } = require('../models/signalementModel');

// GET /api/users/me
async function profil(req, res) {
  try {
    const utilisateur = await trouverParId(req.utilisateur.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.json({ utilisateur });
  } catch (err) {
    console.error('Erreur profil:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/users/me/dashboard
// Ne renvoie QUE les donnees appartenant a l'utilisateur authentifie.
async function tableauDeBord(req, res) {
  try {
    const utilisateurId = req.utilisateur.id;
    const [stats, signalements] = await Promise.all([
      statistiquesParUtilisateur(utilisateurId),
      listerParUtilisateur(utilisateurId)
    ]);

    return res.json({
      statistiques: stats,
      signalements_recents: signalements.slice(0, 5)
    });
  } catch (err) {
    console.error('Erreur tableau de bord:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/users/me/signalements
async function mesSignalements(req, res) {
  try {
    const signalements = await listerParUtilisateur(req.utilisateur.id);
    return res.json({ signalements });
  } catch (err) {
    console.error('Erreur signalements:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/users/me/signalements
// Requete multipart/form-data : champs texte + un fichier "photo" (multer).
async function ajouterSignalement(req, res) {
  try {
    const { type_signalement_id, description, longitude, latitude, commune_id } = req.body;

    if (!type_signalement_id || longitude === undefined || latitude === undefined || !commune_id) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const photo = req.file
      ? {
          nom: req.file.originalname,
          lien: `/uploads/signalements/${req.file.filename}`,
          size: req.file.size
        }
      : null;

    const id = await creerSignalement(req.utilisateur.id, {
      type_signalement_id,
      description,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      commune_id,
      photo
    });

    return res.status(201).json({ message: 'Signalement enregistre.', id });
  } catch (err) {
    console.error('Erreur creation signalement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { profil, tableauDeBord, mesSignalements, ajouterSignalement };
