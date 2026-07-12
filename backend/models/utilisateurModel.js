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

module.exports = { creerUtilisateur, trouverParEmail, trouverParId };
