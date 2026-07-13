const {
  changerStatut,
  listerPourAdmin,
  statistiquesGlobales,
  statistiquesParCommune,
  repartitionParType,
  listerParUtilisateur,
  statistiquesParUtilisateur
} = require('../models/signalementModel');
const { listerContributeurs, compterUtilisateurs, trouverParId } = require('../models/utilisateurModel');

// Emet une notification ciblee au citoyen proprietaire du signalement,
// et met a jour la carte partagee de tous les clients connectes.
async function notifierChangement(req, signalement, statut) {
  const io = req.app.get('io');
  if (!io) return;

  // Notification privee : seul le proprietaire du signalement la recoit.
  io.to(`user_${signalement.utilisateur_id}`).emit('signalement:statut_change', {
    id: signalement.id,
    statut,
    type_signalement: signalement.type_signalement,
    date_analyse: signalement.date_analyse,
    heure_analyse: signalement.heure_analyse
  });

  // Synchronisation de la carte pour TOUS les clients connectes.
  if (statut === 'VALIDE') {
    io.emit('carte:nouveau_marqueur', {
      id: signalement.id,
      longitude: signalement.longitude,
      latitude: signalement.latitude,
      type_signalement: signalement.type_signalement,
      date_signale: signalement.date_signale
    });
  } else if (statut === 'INVALIDE') {
    io.emit('carte:marqueur_retire', { id: signalement.id });
  }
}

// POST /api/admin/signalements/:id/valider
async function validerSignalement(req, res) {
  try {
    const { id } = req.params;
    const signalement = await changerStatut(id, 'VALIDE', req.utilisateur.id);
    if (!signalement) return res.status(404).json({ message: 'Signalement introuvable.' });

    await notifierChangement(req, signalement, 'VALIDE');
    return res.json({ message: 'Signalement valide.', signalement });
  } catch (err) {
    console.error('Erreur validation signalement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/admin/signalements/:id/invalider
async function inValiderSignalement(req, res) {
  try {
    const { id } = req.params;
    const signalement = await changerStatut(id, 'INVALIDE', req.utilisateur.id);
    if (!signalement) return res.status(404).json({ message: 'Signalement introuvable.' });

    await notifierChangement(req, signalement, 'INVALIDE');
    return res.json({ message: 'Signalement invalide.', signalement });
  } catch (err) {
    console.error('Erreur invalidation signalement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/admin/utilisateurs
// Liste des citoyens (contributeurs) avec leur activite (nb de signalements).
async function listerUtilisateurs(req, res) {
  try {
    const utilisateurs = await listerContributeurs();
    return res.json({ utilisateurs });
  } catch (err) {
    console.error('Erreur liste utilisateurs:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/admin/utilisateurs/:id
// Detail d'un citoyen : profil + tous ses signalements + ses statistiques.
async function detailUtilisateur(req, res) {
  try {
    const { id } = req.params;
    const utilisateur = await trouverParId(id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const [signalements, statistiques] = await Promise.all([
      listerParUtilisateur(id),
      statistiquesParUtilisateur(id)
    ]);

    return res.json({ utilisateur, signalements, statistiques });
  } catch (err) {
    console.error('Erreur detail utilisateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/admin/signalements?statut=EN_COURS&commune_id=3
// Liste complete des signalements (tous statuts), pour validation/refus.
async function listerSignalements(req, res) {
  try {
    const { statut, commune_id } = req.query;
    const signalements = await listerPourAdmin({ statut, commune_id });
    return res.json({ signalements });
  } catch (err) {
    console.error('Erreur liste signalements admin:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/admin/statistiques
// Donnees agregees du tableau de bord admin : compteurs globaux, repartition
// par commune, repartition par type, nombre d'utilisateurs.
async function statistiques(req, res) {
  try {
    const [globales, parCommune, parType, utilisateurs] = await Promise.all([
      statistiquesGlobales(),
      statistiquesParCommune(),
      repartitionParType(),
      compterUtilisateurs()
    ]);

    return res.json({
      signalements: globales,
      par_commune: parCommune,
      par_type: parType,
      utilisateurs
    });
  } catch (err) {
    console.error('Erreur statistiques admin:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = {
  validerSignalement,
  inValiderSignalement,
  listerUtilisateurs,
  detailUtilisateur,
  listerSignalements,
  statistiques
};
