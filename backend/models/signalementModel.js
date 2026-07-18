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
  const {
    type_signalement_id,
    description,
    longitude,
    latitude,
    commune_id,
    photo,
    commune_coherente = null // true/false/null, calcule par le controller
  } = data;

  const [coordResult] = await pool.execute(
    `INSERT INTO coordonnees (longitude, latitude, commune_id) VALUES (?, ?, ?)`,
    [longitude, latitude, commune_id]
  );

  const [result] = await pool.execute(
    `INSERT INTO signalements
      (date_signale, heure_signale, statut, description, type_signalement_id, utilisateur_id, coordonnee_id, commune_coherente)
     VALUES (CURDATE(), CURTIME(), 'EN_COURS', ?, ?, ?, ?, ?)`,
    [description || null, type_signalement_id, utilisateurId, coordResult.insertId, commune_coherente]
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

// Signalement complet, avec proprietaire + commune + nom du citoyen.
// Utilise pour cibler la notification socket au bon citoyen apres
// changement de statut, ET pour la notification temps reel envoyee aux
// administrateurs a la creation d'un signalement.
async function obtenirParId(id) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.heure_signale, s.date_analyse, s.heure_analyse,
            s.statut, s.description, s.utilisateur_id, s.commune_coherente, s.visible_carte,
            t.nom AS type_signalement,
            c.longitude, c.latitude,
            com.nom AS commune,
            u.prenom AS utilisateur_prenom, u.nom AS utilisateur_nom,
            p.lien AS photo_lien
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     JOIN communes com ON com.id = c.commune_id
     JOIN utilisateurs u ON u.id = s.utilisateur_id
     LEFT JOIN photos p ON p.signalement_id = s.id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Tous les signalements VALIDE, visibles par tout citoyen connecte sur la
// carte generale. Exclut : ceux retires manuellement par un admin
// (visible_carte = 0, idee "retirer de la carte sans supprimer") et ceux
// dont la commune declaree est incoherente avec le GPS (commune_coherente
// = 0). Un signalement non-verifiable (commune_coherente NULL) reste
// affiche, par prudence, plutot que de masquer par defaut.
async function listerTousValides() {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.statut, s.description,
            t.nom AS type_signalement,
            c.longitude, c.latitude,
            com.nom AS commune,
            p.lien AS photo_lien
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     JOIN communes com ON com.id = c.commune_id
     LEFT JOIN photos p ON p.signalement_id = s.id
     WHERE s.statut = 'VALIDE'
       AND s.visible_carte = 1
       AND (s.commune_coherente IS NULL OR s.commune_coherente = 1)
     ORDER BY s.date_signale DESC`
  );
  return rows;
}

// Retire/restaure un signalement de la carte SANS toucher a son statut ni
// le supprimer de la base. Renvoie le signalement complet pour la
// notification socket (carte:marqueur_retire / carte:nouveau_marqueur).
async function definirVisibiliteCarte(id, visible) {
  await pool.execute(
    `UPDATE signalements SET visible_carte = ? WHERE id = ?`,
    [visible ? 1 : 0, id]
  );
  return obtenirParId(id);
}

// Signalements VALIDE proposes aux collaborateurs environnementaux : pas de
// filtre visible_carte/commune_coherente ici, un collaborateur doit pouvoir
// intervenir meme sur un signalement retire de la carte publique. On
// indique en plus si une collaboration est deja acceptee dessus, pour
// eviter que deux collaborateurs se marchent dessus sans le savoir.
async function listerValidesPourCollaboration() {
  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.description,
            t.nom AS type_signalement,
            c.longitude, c.latitude,
            com.nom AS commune,
            p.lien AS photo_lien,
            col.statut AS collaboration_statut,
            col.collaborateur_id AS collaboration_collaborateur_id
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees c ON c.id = s.coordonnee_id
     JOIN communes com ON com.id = c.commune_id
     LEFT JOIN photos p ON p.signalement_id = s.id
     LEFT JOIN collaborations col
       ON col.signalement_id = s.id AND col.statut IN ('ACCEPTEE','RAPPORT_ENVOYE')
     WHERE s.statut = 'VALIDE'
     ORDER BY s.date_signale DESC`
  );
  return rows;
}

// Marque un signalement comme resolu (conclusion d'une collaboration
// cloturee par l'admin). Sort automatiquement de la carte : listerTousValides
// ne selectionne que statut = 'VALIDE'.
async function marquerResolu(id) {
  await pool.execute(`UPDATE signalements SET statut = 'RESOLU' WHERE id = ?`, [id]);
  return obtenirParId(id);
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

// Liste complete des signalements (tous statuts), pour l'onglet admin
// "Signalements" - avec commune, type, auteur et photo. Filtre optionnel
// par statut et/ou commune.
async function listerPourAdmin({ statut, commune_id } = {}) {
  const conditions = [];
  const params = [];

  if (statut) {
    conditions.push('s.statut = ?');
    params.push(statut);
  }
  if (commune_id) {
    conditions.push('co.commune_id = ?');
    params.push(commune_id);
  }

  const clauseOu = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT s.id, s.date_signale, s.heure_signale, s.date_analyse, s.heure_analyse,
            s.statut, s.description, s.commune_coherente,
            t.nom AS type_signalement,
            co.longitude, co.latitude,
            c.nom AS commune,
            u.id AS utilisateur_id, u.nom AS utilisateur_nom, u.postnom AS utilisateur_postnom,
            u.prenom AS utilisateur_prenom, u.pseudo AS utilisateur_pseudo,
            p.lien AS photo_lien
     FROM signalements s
     JOIN types_signalement t ON t.id = s.type_signalement_id
     JOIN coordonnees co ON co.id = s.coordonnee_id
     JOIN communes c ON c.id = co.commune_id
     JOIN utilisateurs u ON u.id = s.utilisateur_id
     LEFT JOIN photos p ON p.signalement_id = s.id
     ${clauseOu}
     ORDER BY (s.commune_coherente = 0) DESC, s.date_signale DESC, s.heure_signale DESC`,
    params
  );
  return rows;
}

/**
 * Statistiques croisées : Ville > Commune > Nombre de signalements.
 * C'est cette fonction qui permettra à votre admin de voir la répartition géographique.
 */
async function statistiquesParVilleEtCommune() {
  const [rows] = await pool.execute(
    `SELECT v.nom AS ville, c.nom AS commune, COUNT(s.id) AS total
     FROM villes v
     JOIN communes c ON c.ville_id = v.id
     JOIN coordonnees co ON co.commune_id = c.id
     JOIN signalements s ON s.coordonnee_id = co.id
     GROUP BY v.nom, c.nom
     ORDER BY v.nom ASC, total DESC`
  );
  return rows;
}

// Repartition des signalements par commune - utilisee pour le graphique
// "signalements par commune" du tableau de bord admin.
async function statistiquesParCommune() {
  const [rows] = await pool.execute(
    `SELECT c.nom AS commune, COUNT(s.id) AS total
     FROM communes c
     JOIN coordonnees co ON co.commune_id = c.id
     JOIN signalements s ON s.coordonnee_id = co.id
     GROUP BY c.id, c.nom
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
  definirVisibiliteCarte,
  listerValidesPourCollaboration,
  marquerResolu,
  changerStatut,
  statistiquesGlobales,
  repartitionParType,
  listerPourAdmin,
  statistiquesParCommune,
  statistiquesParVilleEtCommune
};