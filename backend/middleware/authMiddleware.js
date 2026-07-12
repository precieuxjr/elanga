const { verifierToken } = require('../utils/jwt');

function authentifier(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifierToken(token);
    req.utilisateur = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expire.' });
  }
}

module.exports = { authentifier };
