const pool = require('../config/db');

async function lister() {
  const [rows] = await pool.execute(
    `SELECT id, nom FROM communes ORDER BY nom ASC`
  );
  return rows;
}

// Utilisee pour la verification de coherence GPS / commune declaree :
// on a besoin du polygone en plus du nom.
async function trouverParId(id) {
  const [rows] = await pool.execute(
    `SELECT id, nom, ville_id, polygone FROM communes WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { lister, trouverParId };
