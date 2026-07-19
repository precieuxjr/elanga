const collaborationModel = require('../models/collaboration_Model');

// GET /api/evenements
// Tout utilisateur connecte (contributeur, collaborateur ou admin) peut
// voir les evenements ouverts a la participation.
async function lister(req, res) {
  try {
    const evenements = await collaborationModel.listerEvenementsPublics();
    // Indique, pour l'utilisateur courant, s'il a deja rejoint chaque evenement.
    const avecParticipation = await Promise.all(
      evenements.map(async (e) => ({
        ...e,
        deja_participant: await collaborationModel.estParticipant(e.id, req.utilisateur.id)
      }))
    );
    return res.json({ evenements: avecParticipation });
  } catch (err) {
    console.error('Erreur liste evenements:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/evenements/statistiques
// Evenements clotures (assainissement termine et valide) : statistiques
// publiques, visibles par tout contributeur de la plateforme.
async function statistiques(req, res) {
  try {
    const evenements = await collaborationModel.listerEvenementsResolus();
    return res.json({
      total_evenements: evenements.length,
      total_participants: evenements.reduce((somme, e) => somme + Number(e.nb_participants || 0), 0),
      evenements
    });
  } catch (err) {
    console.error('Erreur statistiques evenements:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/evenements/:id/rejoindre
// Reserve implicitement aux CONTRIBUTEUR (un collaborateur ou un admin n'a
// pas besoin de "participer", ce n'est pas bloquant mais peu utile).
async function rejoindre(req, res) {
  try {
    const evenement = await collaborationModel.obtenirParId(req.params.id);
    if (!evenement) return res.status(404).json({ message: 'Événement introuvable.' });
    if (!['ACCEPTEE', 'ASSAINISSEMENT_EN_COURS'].includes(evenement.statut)) {
      return res.status(400).json({ message: "Cet événement n'accepte plus de nouveaux participants." });
    }

    const misAJour = await collaborationModel.rejoindre(req.params.id, req.utilisateur.id);
    req.app.get('io').emit('evenement:mis_a_jour', misAJour);

    return res.json({ message: 'Inscription confirmée. Merci pour votre engagement !', evenement: misAJour });
  } catch (err) {
    console.error('Erreur inscription evenement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/evenements/:id/quitter
async function quitter(req, res) {
  try {
    const misAJour = await collaborationModel.quitter(req.params.id, req.utilisateur.id);
    req.app.get('io').emit('evenement:mis_a_jour', misAJour);
    return res.json({ message: 'Vous ne participez plus à cet événement.', evenement: misAJour });
  } catch (err) {
    console.error('Erreur desinscription evenement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { lister, statistiques, rejoindre, quitter };