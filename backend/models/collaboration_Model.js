const pool = require('../config/db');

async function creerProposition(signalementId, collaborateurId, message) {
  const [result] = await pool.execute(
    `INSERT INTO collaborations (signalement_id, collaborateur_id, message) VALUES (?, ?, ?)`,
    [signalementId, collaborateurId, message]
  );
  return result.insertId;
}

async function obtenirParId(id) {
  const [rows] = await pool.execute(
    `SELECT col.*,
            s.description AS signalement_description, s.statut AS signalement_statut,
            t.nom AS type_signalement, com.nom AS commune,
            c.prenom AS collaborateur_prenom, c.nom AS collaborateur_nom, c.nom_organisation, c.type_organisation
     FROM collaborations col
     JOIN signalements s ON s.id = col.signalement_id
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes com ON com.id = co.commune_id
     JOIN utilisateurs c ON c.id = col.collaborateur_id
     WHERE col.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listerParCollaborateur(collaborateurId) {
  const [rows] = await pool.execute(
    `SELECT col.*, s.description AS signalement_description, t.nom AS type_signalement, com.nom AS commune
     FROM collaborations col
     JOIN signalements s ON s.id = col.signalement_id
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes com ON com.id = co.commune_id
     WHERE col.collaborateur_id = ?
     ORDER BY col.date_proposition DESC`,
    [collaborateurId]
  );
  return rows;
}

async function lister({ statut } = {}) {
  const params = [];
  let clause = '';
  if (statut) {
    clause = 'WHERE col.statut = ?';
    params.push(statut);
  }
  const [rows] = await pool.execute(
    `SELECT col.*,
            s.description AS signalement_description,
            t.nom AS type_signalement, com.nom AS commune,
            c.prenom AS collaborateur_prenom, c.nom AS collaborateur_nom, c.nom_organisation
     FROM collaborations col
     JOIN signalements s ON s.id = col.signalement_id
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes com ON com.id = co.commune_id
     JOIN utilisateurs c ON c.id = col.collaborateur_id
     ${clause}
     ORDER BY col.date_proposition DESC`,
    params
  );
  return rows;
}

// Feu vert de l'admin. Refuse automatiquement les autres propositions
// EN_ATTENTE sur le meme signalement, pour eviter que deux collaborateurs
// interviennent independamment sur le meme probleme sans le savoir.
async function accepter(id, administrateurId) {
  const proposition = await obtenirParId(id);
  if (!proposition) return null;

  await pool.execute(
    `UPDATE collaborations SET statut = 'ACCEPTEE', administrateur_id = ?, date_decision = NOW() WHERE id = ?`,
    [administrateurId, id]
  );
  await pool.execute(
    `UPDATE collaborations SET statut = 'REFUSEE', administrateur_id = ?, date_decision = NOW()
     WHERE signalement_id = ? AND id != ? AND statut = 'EN_ATTENTE'`,
    [administrateurId, proposition.signalement_id, id]
  );
  return obtenirParId(id);
}

async function refuser(id, administrateurId) {
  await pool.execute(
    `UPDATE collaborations SET statut = 'REFUSEE', administrateur_id = ?, date_decision = NOW() WHERE id = ?`,
    [administrateurId, id]
  );
  return obtenirParId(id);
}

// Le collaborateur signale que le probleme est regle sur le terrain.
async function envoyerRapport(id, rapport) {
  await pool.execute(
    `UPDATE collaborations SET statut = 'RAPPORT_ENVOYE', rapport = ?, date_rapport = NOW() WHERE id = ?`,
    [rapport, id]
  );
  return obtenirParId(id);
}

// L'admin juge le rapport suffisant et cloture -> le signalement passera a
// RESOLU (fait par le controller via signalementModel.marquerResolu, pour
// garder la responsabilite de chaque modele sur sa propre table).
async function cloturer(id, administrateurId) {
  await pool.execute(
    `UPDATE collaborations SET statut = 'CLOTUREE', administrateur_id = ?, date_cloture = NOW() WHERE id = ?`,
    [administrateurId, id]
  );
  return obtenirParId(id);
}

module.exports = {
  creerProposition,
  obtenirParId,
  listerParCollaborateur,
  lister,
  accepter,
  refuser,
  envoyerRapport,
  cloturer
};