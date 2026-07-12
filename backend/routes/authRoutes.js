const express = require('express');
const router = express.Router();
const { inscrire, connecter } = require('../controllers/authController');

router.post('/register', inscrire);
router.post('/login', connecter);

module.exports = router;
