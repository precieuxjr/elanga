const { trouverParId } = require('../models/utilisateurModel');
const {
  listerParUtilisateur,
  statistiquesParUtilisateur,
  creerSignalement,
  obtenirParId: obtenirSignalementParId
} = require('../models/signalementModel');
const { trouverParId: trouverCommuneParId } = require('../models/communeModel');
const axios = require('axios');

/**
 * Fonction utilitaire pour vérifier la cohérence via Nominatim (Gratuit)
 * Appelle OpenStreetMap pour obtenir le nom de la commune à partir des coordonnées.
 */
async function verifierCommuneNominatim(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
        // Le User-Agent est obligatoire pour respecter les règles d'utilisation d'OpenStreetMap
        const response = await axios.get(url, { headers: { 'User-Agent': 'ElangaApp/1.0' } });
        
        if (response.data && response.data.address) {
            // Retourne le nom de la commune/suburb détectée
            return response.data.address.municipality || response.data.address.suburb || null;
        }
        return null;
    } catch (err) {
        console.error("Erreur géocodage Nominatim:", err.message);
        return null;
    }
}

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
async function ajouterSignalement(req, res) {
  try {
    const { type_signalement_id, description, longitude, latitude, commune_id } = req.body;

    if (!type_signalement_id || longitude === undefined || latitude === undefined || !commune_id) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    // 1. Récupérer la commune depuis la BDD pour obtenir son nom
    const commune = await trouverCommuneParId(commune_id);
    if (!commune) return res.status(400).json({ message: 'Commune invalide.' });

    // 2. Vérifier la cohérence via l'API Nominatim
    const communeReelle = await verifierCommuneNominatim(latitude, longitude);
    
    // On compare le nom (en minuscules pour éviter les erreurs de casse)
    const coherent = communeReelle 
        ? communeReelle.toLowerCase().includes(commune.nom.toLowerCase()) 
        : null;

    // 3. Préparer les données de la photo
    const photo = req.file
      ? {
          nom: req.file.originalname,
          lien: `/uploads/signalements/${req.file.filename}`,
          size: req.file.size
        }
      : null;

    // 4. Enregistrement en base de données
    const id = await creerSignalement(req.utilisateur.id, {
      type_signalement_id,
      description,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      commune_id,
      photo,
      commune_coherente: coherent
    });

    // 5. Notifie en temps reel tous les administrateurs connectes (room
    // 'admins', rejointe automatiquement au handshake socket - cf server.js).
    try {
      const signalementComplet = await obtenirSignalementParId(id);
      req.app.get('io').to('admins').emit('admin:nouveau_signalement', signalementComplet);
    } catch (e) {
      // Un probleme de notification temps reel ne doit jamais faire echouer
      // la creation du signalement elle-meme.
      console.error('Erreur emission socket admin:nouveau_signalement:', e);
    }

    return res.status(201).json({
      message: 'Signalement enregistré.',
      id,
      commune_coherente: coherent
    });
  } catch (err) {
    console.error('Erreur creation signalement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { profil, tableauDeBord, mesSignalements, ajouterSignalement };