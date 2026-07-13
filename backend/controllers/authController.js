const bcrypt = require('bcrypt');
const { creerUtilisateur, creerAdministrateur, trouverParEmail } = require('../models/utilisateurModel');
const { genererToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function inscrire(req, res) {
  try {
    const { nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, pseudo } = req.body;

    if (!nom || !postnom || !prenom || !date_naissance || !sexe || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent etre renseignes.' });
    }
    if (!['M', 'F'].includes(sexe)) {
      return res.status(400).json({ message: "Le champ sexe doit valoir 'M' ou 'F'." });
    }
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres.' });
    }

    const existant = await trouverParEmail(email);
    if (existant) {
      return res.status(409).json({ message: 'Un compte existe deja avec cet email.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const id = await creerUtilisateur({
      nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe: hash, pseudo
    });

    const token = genererToken({ id, email, role: 'CONTRIBUTEUR' });

    return res.status(201).json({
      message: 'Inscription reussie.',
      token,
      utilisateur: { id, nom, postnom, prenom, email, role: 'CONTRIBUTEUR' }
    });
  } catch (err) {
    console.error('Erreur inscription:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
}

async function connecter(req, res) {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const utilisateur = await trouverParEmail(email);
    if (!utilisateur) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = genererToken({ id: utilisateur.id, email: utilisateur.email, role: utilisateur.role });

    return res.json({
      message: 'Connexion reussie.',
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        postnom: utilisateur.postnom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });
  } catch (err) {
    console.error('Erreur connexion:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
}

// POST /api/auth/register-admin
// Reserve a l'espace admin : exige un code d'invitation (ADMIN_SIGNUP_CODE
// dans .env) pour empecher que n'importe qui puisse se creer un compte
// administrateur en tombant sur ce formulaire.
async function inscrireAdmin(req, res) {
  try {
    const { nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe, code_invitation } = req.body;

    if (!nom || !postnom || !prenom || !date_naissance || !sexe || !email || !mot_de_passe || !code_invitation) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent etre renseignes.' });
    }
    if (!process.env.ADMIN_SIGNUP_CODE) {
      return res.status(500).json({ message: "L'inscription administrateur n'est pas configuree (ADMIN_SIGNUP_CODE manquant)." });
    }
    if (code_invitation !== process.env.ADMIN_SIGNUP_CODE) {
      return res.status(403).json({ message: "Code d'invitation incorrect." });
    }
    if (!['M', 'F'].includes(sexe)) {
      return res.status(400).json({ message: "Le champ sexe doit valoir 'M' ou 'F'." });
    }
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres.' });
    }

    const existant = await trouverParEmail(email);
    if (existant) {
      return res.status(409).json({ message: 'Un compte existe deja avec cet email.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const id = await creerAdministrateur({
      nom, postnom, prenom, date_naissance, sexe, email, mot_de_passe: hash
    });

    const token = genererToken({ id, email, role: 'ADMINISTRATEUR' });

    return res.status(201).json({
      message: 'Compte administrateur cree.',
      token,
      utilisateur: { id, nom, postnom, prenom, email, role: 'ADMINISTRATEUR' }
    });
  } catch (err) {
    console.error('Erreur inscription admin:', err);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}

module.exports = { inscrire, inscrireAdmin, connecter };
