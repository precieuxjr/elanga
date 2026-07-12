const { statistiquesGlobales, repartitionParType } = require('../models/signalementModel');

// GET /api/public/statistiques
// Aucune authentification requise : donnees agregees uniquement, sans aucune
// information personnelle, utilisees sur la page d'accueil publique.
async function statistiques(req, res) {
  try {
    const [globales, parType] = await Promise.all([
      statistiquesGlobales(),
      repartitionParType()
    ]);

    const total = parType.reduce((acc, t) => acc + t.total, 0);
    const repartition = parType.map((t) => ({
      nom: t.nom,
      total: t.total,
      pourcentage: total > 0 ? Math.round((t.total / total) * 100) : 0
    }));

    return res.json({ statistiques: globales, repartition_par_type: repartition });
  } catch (err) {
    console.error('Erreur statistiques publiques:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { statistiques };
