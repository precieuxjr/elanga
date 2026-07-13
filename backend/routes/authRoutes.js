const express = require('express');
const router = express.Router();
const { inscrire, inscrireAdmin, connecter } = require('../controllers/authController');

router.post('/register', inscrire);
router.post('/register-admin', inscrireAdmin);
router.post('/login', connecter);

module.exports = router;
