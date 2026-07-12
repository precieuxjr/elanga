const express = require('express');
const router = express.Router();
const { authentifier } = require('../middleware/authMiddleware');
const { autoriserRoles } = require('../middleware/roleMiddleware');
const { validerSignalement, inValiderSignalement } = require('../controllers/adminController');

router.use(authentifier, autoriserRoles('ADMINISTRATEUR'));

router.post('/signalements/:id/valider', validerSignalement);
router.post('/signalements/:id/invalider', inValiderSignalement);

module.exports = router;
