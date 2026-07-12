const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const signalementRoutes = require('./signalementRoutes');
const referenceRoutes = require('./referenceRoutes');
const publicRoutes = require('./publicRoutes');

// Toutes les routes de l'API sont centralisees ici, puis montees
// une seule fois dans server.js sous le prefixe /api.
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/signalements', signalementRoutes);
router.use('/reference', referenceRoutes);
router.use('/public', publicRoutes);

module.exports = router;
