const express = require('express');
const router = express.Router();
const { authentifier } = require('../middleware/authMiddleware');
const { getCommunes, getTypesSignalement } = require('../controllers/referenceController');

router.get('/communes', authentifier, getCommunes);
router.get('/types-signalement', authentifier, getTypesSignalement);

module.exports = router;
