const pool = require('../config/db');

// Requetes preparees, toujours filtrees par utilisateur_id cote serveur
// (le tableau de bord ne doit exposer que les donnees du proprietaire).

async function listerParUtilisateur(utilisateurId) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.heure_signale, s.statut, s.description,
            t.nom AS type_signalement,
            c.longitude, c.latitude
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     WHERE s.utilisateur_id = ?
     ORDER BY s.date_signale DESC, s.heure_signale DESC`,
    [utilisateurId]
  );
  return rows;
}

async function statistiquesParUtilisateur(utilisateurId) {
  const [rows] = await pool.execute(
    `SELECT statut, COUNT(*) AS total
     FROM signalements
     WHERE utilisateur_id = ?
     GROUP BY statut`,
    [utilisateurId]
  );

  const stats = { EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 };
  rows.forEach((r) => {
    stats[r.statut] = r.total;
    stats.total += r.total;
  });
  return stats;
}

async function creerSignalement(utilisateurId, data) {
  const { type_signalement_id, description, longitude, latitude, commune_id, photo } = data;

  const [coordResult] = await pool.execute(
    `INSERT INTO coordonnees (longitude, latitude, commune_id) VALUES (?, ?, ?)`,
    [longitude, latitude, commune_id]
  );

  const [result] = await pool.execute(
    `INSERT INTO signalements
      (date_signale, heure_signale, statut, description, type_signalement_id, utilisateur_id, coordonnee_id)
     VALUES (CURDATE(), CURTIME(), 'EN_COURS', ?, ?, ?, ?)`,
    [description || null, type_signalement_id, utilisateurId, coordResult.insertId]
  );

  // La photo prise sur le terrain est rattachee au signalement (relation
  // "contenir" 1..* Photo - 1..1 Signalement du diagramme de classe).
  if (photo) {
    await pool.execute(
      `INSERT INTO photos (nom, lien, size, signalement_id) VALUES (?, ?, ?, ?)`,
      [photo.nom, photo.lien, photo.size, result.insertId]
    );
  }

  return result.insertId;
}

// Signalement complet, avec proprietaire (utile pour cibler la notification
// socket au bon citoyen apres changement de statut).
async function obtenirParId(id) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.heure_signale, s.date_analyse, s.heure_analyse,
            s.statut, s.description, s.utilisateur_id,
            t.nom AS type_signalement,
            c.longitude, c.latitude
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Tous les signalements VALIDE, visibles par tout citoyen connecte sur la
// carte generale, afin d'eviter qu'il ne signale un incident deja connu.
async function listerTousValides() {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.statut, s.description,
            t.nom AS type_signalement,
            c.longitude, c.latitude
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     WHERE s.statut = 'VALIDE'
     ORDER BY s.date_signale DESC`
  );
  return rows;
}

// Changement de statut par un administrateur (validerSignalement /
// inValiderSignalement du diagramme de classe).
async function changerStatut(id, statut, administrateurId) {
  await pool.execute(
    `UPDATE signalements
     SET statut = ?, administrateur_id = ?, date_analyse = CURDATE(), heure_analyse = CURTIME()
     WHERE id = ?`,
    [statut, administrateurId, id]
  );
  return obtenirParId(id);
}

// Statistiques globales de la plateforme (tous utilisateurs confondus),
// utilisees sur la page d'accueil publique - aucune donnee personnelle.
async function statistiquesGlobales() {
  const [rows] = await pool.execute(
    `SELECT statut, COUNT(*) AS total FROM signalements GROUP BY statut`
  );

  const stats = { EN_COURS: 0, VALIDE: 0, INVALIDE: 0, total: 0 };
  rows.forEach((r) => {
    stats[r.statut] = r.total;
    stats.total += r.total;
  });
  return stats;
}

// Repartition des signalements par type d'incident (pour le graphique
// "repartition par type de probleme" de la page d'accueil).
async function repartitionParType() {
  const [rows] = await pool.execute(
    `SELECT t.nom, COUNT(s.id) AS total
     FROM types_signalement t
     LEFT JOIN signalements s ON s.type_signalement_id = t.id
     GROUP BY t.id, t.nom
     ORDER BY total DESC`
  );
  return rows;
}

module.exports = {
  listerParUtilisateur,
  statistiquesParUtilisateur,
  creerSignalement,
  obtenirParId,
  listerTousValides,
  changerStatut,
  statistiquesGlobales,
  repartitionParType
};

