// backend/middleware/estCollaborateur.js
//
// A chainer APRES ton middleware JWT existant (celui qui peuple
// req.utilisateur = { id, email, role }). Autorise COLLABORATEUR et
// ADMINISTRATEUR (un admin doit pouvoir tout voir).
module.exports = function estCollaborateur(req, res, next) {
    if (!req.utilisateur || (req.utilisateur.role !== 'COLLABORATEUR' && req.utilisateur.role !== 'ADMINISTRATEUR')) {
      return res.status(403).json({ message: 'Accès réservé aux collaborateurs environnementaux.' });
    }
    next();
  };