// backend/utils/geoCoherence.js
//
// Verifie si des coordonnees GPS tombent bien a l'interieur du polygone
// de la commune declaree par le citoyen. Sert a detecter une incoherence
// entre "commune choisie dans le formulaire" et "position reelle du
// telephone" au moment de la creation d'un signalement.
//
// npm install @turf/turf   (a lancer dans backend/)

const turf = require('@turf/turf');

/**
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {object|string|null} polygoneGeoJSON  colonne `communes.polygone`
 *        (deja parsee en objet par mysql2 pour une colonne JSON, ou string)
 * @returns {boolean|null}  true=coherent, false=incoherent,
 *          null=impossible a verifier (commune sans polygone importe,
 *          ou coordonnees/polygone invalides)
 */
function communeCoherente(latitude, longitude, polygoneGeoJSON) {
  if (!polygoneGeoJSON) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const geojson = typeof polygoneGeoJSON === 'string'
    ? JSON.parse(polygoneGeoJSON)
    : polygoneGeoJSON;

  // Accepte aussi bien un objet Feature qu'une geometrie brute.
  const geometrie = geojson.type === 'Feature' ? geojson.geometry : geojson;

  try {
    const point = turf.point([lng, lat]);
    return turf.booleanPointInPolygon(point, geometrie);
  } catch (e) {
    // Polygone malforme -> on ne bloque jamais le citoyen pour ca,
    // on marque simplement "non verifiable".
    return null;
  }
}

module.exports = { communeCoherente };
