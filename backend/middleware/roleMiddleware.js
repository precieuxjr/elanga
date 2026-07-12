// A utiliser APRES le middleware authentifier (qui remplit req.utilisateur).
function autoriserRoles(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.utilisateur || !rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
    next();
  };
}

module.exports = { autoriserRoles };
