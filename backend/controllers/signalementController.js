const { listerTousValides } = require('../models/signalementModel');

// GET /api/signalements/carte
// Visible par tout citoyen connecte : lui permet de voir tous les incidents
// deja valides sur la carte, afin d'eviter un signalement en double.
async function carte(req, res) {
  try {
    const signalements = await listerTousValides();
    return res.json({ signalements });
  } catch (err) {
    console.error('Erreur carte:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { carte };
