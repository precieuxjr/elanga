const pool = require('../config/db');

async function lister() {
  const [rows] = await pool.execute(
    `SELECT id, nom FROM types_signalement ORDER BY nom ASC`
  );
  return rows;
}

module.exports = { lister };
