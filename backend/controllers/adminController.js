const { changerStatut } = require('../models/signalementModel');

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

module.exports = { validerSignalement, inValiderSignalement };
