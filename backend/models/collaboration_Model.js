const pool = require('../config/db');

// Un collaborateur cree un "evenement d'assainissement" en se proposant sur
// un signalement : titre + date prevue + message de proposition. Reste
// EN_ATTENTE tant que l'admin n'a pas donne le feu vert.
async function creerProposition(signalementId, collaborateurId, { titre, date_evenement, message }) {
  const [result] = await pool.execute(
    `INSERT INTO collaborations (signalement_id, collaborateur_id, titre, date_evenement, message)
     VALUES (?, ?, ?, ?, ?)`,
    [signalementId, collaborateurId, titre, date_evenement || null, message]
  );
  return result.insertId;
}

async function obtenirParId(id) {
  const [rows] = await pool.execute(
    `SELECT col.*,
            (SELECT COUNT(*) FROM participations_evenement p WHERE p.collaboration_id = col.id) AS nb_participants,
            s.description AS signalement_description, s.statut AS signalement_statut,
            s.longitude, s.latitude,
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
    `SELECT col.*,
            (SELECT COUNT(*) FROM participations_evenement p WHERE p.collaboration_id = col.id) AS nb_participants,
            s.description AS signalement_description, t.nom AS type_signalement, com.nom AS commune
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
            (SELECT COUNT(*) FROM participations_evenement p WHERE p.collaboration_id = col.id) AS nb_participants,
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

// Evenements ouverts a la participation des contributeurs : le feu vert a
// ete donne, l'assainissement n'est pas encore cloture. Visible cote
// citoyen (frontend_user), independamment de qui a signale a l'origine.
async function listerEvenementsPublics() {
  const [rows] = await pool.execute(
    `SELECT col.id, col.titre, col.message, col.statut, col.date_evenement, col.date_proposition,
            (SELECT COUNT(*) FROM participations_evenement p WHERE p.collaboration_id = col.id) AS nb_participants,
            s.description AS signalement_description, s.longitude, s.latitude,
            t.nom AS type_signalement, com.nom AS commune,
            c.prenom AS collaborateur_prenom, c.nom AS collaborateur_nom, c.nom_organisation
     FROM collaborations col
     JOIN signalements s ON s.id = col.signalement_id
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes com ON com.id = co.commune_id
     JOIN utilisateurs c ON c.id = col.collaborateur_id
     WHERE col.statut IN ('ACCEPTEE', 'ASSAINISSEMENT_EN_COURS')
     ORDER BY col.date_evenement ASC`
  );
  return rows;
}

// Evenements clotures (assainissement termine et valide par un admin) :
// statistiques publiques visibles par tous les contributeurs.
async function listerEvenementsResolus() {
  const [rows] = await pool.execute(
    `SELECT col.id, col.titre, col.date_evenement, col.date_cloture,
            col.photo_avant_lien, col.photo_apres_lien, col.rapport,
            (SELECT COUNT(*) FROM participations_evenement p WHERE p.collaboration_id = col.id) AS nb_participants,
            t.nom AS type_signalement, com.nom AS commune,
            c.prenom AS collaborateur_prenom, c.nom AS collaborateur_nom, c.nom_organisation
     FROM collaborations col
     JOIN signalements s ON s.id = col.signalement_id
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes com ON com.id = co.commune_id
     JOIN utilisateurs c ON c.id = col.collaborateur_id
     WHERE col.statut = 'CLOTUREE'
     ORDER BY col.date_cloture DESC`
  );
  return rows;
}

async function estParticipant(collaborationId, utilisateurId) {
  const [rows] = await pool.execute(
    `SELECT id FROM participations_evenement WHERE collaboration_id = ? AND utilisateur_id = ? LIMIT 1`,
    [collaborationId, utilisateurId]
  );
  return !!rows[0];
}

async function rejoindre(collaborationId, utilisateurId) {
  await pool.execute(
    `INSERT IGNORE INTO participations_evenement (collaboration_id, utilisateur_id) VALUES (?, ?)`,
    [collaborationId, utilisateurId]
  );
  return obtenirParId(collaborationId);
}

async function quitter(collaborationId, utilisateurId) {
  await pool.execute(
    `DELETE FROM participations_evenement WHERE collaboration_id = ? AND utilisateur_id = ?`,
    [collaborationId, utilisateurId]
  );
  return obtenirParId(collaborationId);
}

// Feu vert de l'admin. Refuse automatiquement les autres propositions
// EN_ATTENTE sur le meme signalement.
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

// Etape 1 : le collaborateur demarre l'assainissement sur le terrain,
// photo du lieu sale a l'appui.
async function demarrerAssainissement(id, photoAvantLien) {
  await pool.execute(
    `UPDATE collaborations SET statut = 'ASSAINISSEMENT_EN_COURS', photo_avant_lien = ? WHERE id = ?`,
    [photoAvantLien, id]
  );
  return obtenirParId(id);
}

// Etape 2 : le collaborateur termine, photo du lieu propre + rapport ecrit.
async function envoyerRapport(id, { rapport, photo_apres_lien }) {
  await pool.execute(
    `UPDATE collaborations SET statut = 'RAPPORT_ENVOYE', rapport = ?, photo_apres_lien = ?, date_rapport = NOW() WHERE id = ?`,
    [rapport, photo_apres_lien, id]
  );
  return obtenirParId(id);
}

// L'admin juge le rapport suffisant et cloture -> le signalement passera a
// RESOLU (fait par le controller via signalementModel.marquerResolu).
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
  listerEvenementsPublics,
  listerEvenementsResolus,
  estParticipant,
  rejoindre,
  quitter,
  accepter,
  refuser,
  demarrerAssainissement,
  envoyerRapport,
  cloturer
};