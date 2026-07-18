const pool = require('../config/db');

async function creerDemande(utilisateurId, { type_organisation, nom_organisation, justification }) {
  const [result] = await pool.execute(
    `INSERT INTO demandes_collaborateur (utilisateur_id, type_organisation, nom_organisation, justification)
     VALUES (?, ?, ?, ?)`,
    [utilisateurId, type_organisation, nom_organisation, justification || null]
  );
  return result.insertId;
}

// Une seule demande EN_ATTENTE a la fois par utilisateur, pour eviter le spam.
async function demandeEnAttentePour(utilisateurId) {
  const [rows] = await pool.execute(
    `SELECT id FROM demandes_collaborateur WHERE utilisateur_id = ? AND statut = 'EN_ATTENTE' LIMIT 1`,
    [utilisateurId]
  );
  return rows[0] || null;
}

async function obtenirDerniereDemandePour(utilisateurId) {
  const [rows] = await pool.execute(
    `SELECT * FROM demandes_collaborateur WHERE utilisateur_id = ? ORDER BY date_demande DESC LIMIT 1`,
    [utilisateurId]
  );
  return rows[0] || null;
}

async function obtenirParId(id) {
  const [rows] = await pool.execute(
    `SELECT d.*, u.nom AS utilisateur_nom, u.prenom AS utilisateur_prenom, u.email AS utilisateur_email
     FROM demandes_collaborateur d
     JOIN utilisateurs u ON u.id = d.utilisateur_id
     WHERE d.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function lister({ statut } = {}) {
  const params = [];
  let clause = '';
  if (statut) {
    clause = 'WHERE d.statut = ?';
    params.push(statut);
  }
  const [rows] = await pool.execute(
    `SELECT d.*, u.nom AS utilisateur_nom, u.prenom AS utilisateur_prenom, u.email AS utilisateur_email
     FROM demandes_collaborateur d
     JOIN utilisateurs u ON u.id = d.utilisateur_id
     ${clause}
     ORDER BY d.date_demande DESC`,
    params
  );
  return rows;
}

// Accepte la demande : passe l'utilisateur en role COLLABORATEUR et copie
// les infos d'organisation sur son profil (affichage direct sans jointure).
async function accepter(id, administrateurId) {
  const demande = await obtenirParId(id);
  if (!demande) return null;

  await pool.execute(
    `UPDATE demandes_collaborateur SET statut = 'ACCEPTEE', administrateur_id = ?, date_decision = NOW() WHERE id = ?`,
    [administrateurId, id]
  );
  await pool.execute(
    `UPDATE utilisateurs SET role = 'COLLABORATEUR', type_organisation = ?, nom_organisation = ? WHERE id = ?`,
    [demande.type_organisation, demande.nom_organisation, demande.utilisateur_id]
  );
  return obtenirParId(id);
}

async function refuser(id, administrateurId) {
  await pool.execute(
    `UPDATE demandes_collaborateur SET statut = 'REFUSEE', administrateur_id = ?, date_decision = NOW() WHERE id = ?`,
    [administrateurId, id]
  );
  return obtenirParId(id);
}

module.exports = {
  creerDemande,
  demandeEnAttentePour,
  obtenirDerniereDemandePour,
  obtenirParId,
  lister,
  accepter,
  refuser
};