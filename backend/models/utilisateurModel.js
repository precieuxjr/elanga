const pool = require('../config/db');

// Toutes les requetes utilisent des requetes preparees (parametres "?")
// afin d'eviter toute injection SQL.

async function creerUtilisateur({ nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, pseudo }) {
  const [result] = await pool.execute(
    `INSERT INTO utilisateurs
      (nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, role, pseudo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'CONTRIBUTEUR', ?)`,
    [nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, pseudo || null]
  );
  return result.insertId;
}

async function trouverParEmail(email) {
  const [rows] = await pool.execute(
    `SELECT * FROM utilisateurs WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function trouverParId(id) {
  const [rows] = await pool.execute(
    `SELECT id, nom, postnom, prenom, date_naissance, sexe, email, role, pseudo, created_at
     FROM utilisateurs WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Liste des contributeurs (citoyens), avec le nombre de signalements
// postes par chacun - utilisee par l'onglet "Utilisateurs" de l'admin.
// Un utilisateur est considere "actif" s'il a poste au moins un signalement.
async function listerContributeurs() {
  const [rows] = await pool.execute(
    `SELECT u.id, u.nom, u.postnom, u.prenom, u.email, u.pseudo, u.created_at,
            COUNT(s.id) AS total_signalements,
            SUM(CASE WHEN s.statut = 'VALIDE' THEN 1 ELSE 0 END) AS signalements_valides,
            SUM(CASE WHEN s.statut = 'EN_COURS' THEN 1 ELSE 0 END) AS signalements_en_cours,
            MAX(s.date_signale) AS dernier_signalement
     FROM utilisateurs u
     LEFT JOIN signalements s ON s.utilisateur_id = u.id
     WHERE u.role = 'CONTRIBUTEUR'
     GROUP BY u.id, u.nom, u.postnom, u.prenom, u.email, u.pseudo, u.created_at
     ORDER BY total_signalements DESC, u.created_at DESC`
  );
  return rows;
}

async function compterUtilisateurs() {
  const [rows] = await pool.execute(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN role = 'CONTRIBUTEUR' THEN 1 ELSE 0 END) AS contributeurs,
        SUM(CASE WHEN role = 'ADMINISTRATEUR' THEN 1 ELSE 0 END) AS administrateurs
     FROM utilisateurs`
  );
  return rows[0];
}

// Reservee au script de creation d'administrateur (aucune route publique
// ne doit permettre de creer un compte ADMINISTRATEUR).
async function creerAdministrateur({ nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, pseudo }) {
  const [result] = await pool.execute(
    `INSERT INTO utilisateurs
      (nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, role, pseudo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ADMINISTRATEUR', ?)`,
    [nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, pseudo || null]
  );
  return result.insertId;
}

module.exports = {
  creerUtilisateur,
  creerAdministrateur,
  trouverParEmail,
  trouverParId,
  listerContributeurs,
  compterUtilisateurs
};
