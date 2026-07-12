const communeModel = require('../models/communeModel');
const typeSignalementModel = require('../models/typeSignalementModel');

async function getCommunes(req, res) {
  try {
    const communes = await communeModel.lister();
    return res.json({ communes });
  } catch (err) {
    console.error('Erreur communes:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

async function getTypesSignalement(req, res) {
  try {
    const types = await typeSignalementModel.lister();
    return res.json({ types });
  } catch (err) {
    console.error('Erreur types signalement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { getCommunes, getTypesSignalement };
