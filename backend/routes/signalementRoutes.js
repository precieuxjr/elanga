const express = require('express');
const router = express.Router();
const { authentifier } = require('../middleware/authMiddleware');
const { carte } = require('../controllers/signalementController');

router.get('/carte', authentifier, carte);

module.exports = router;
