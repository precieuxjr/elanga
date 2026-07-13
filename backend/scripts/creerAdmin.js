/**
 * Script de creation d'un compte administrateur.
 *
 * Aucune route publique ne permet de creer un compte ADMINISTRATEUR (par
 * design, pour la securite). Ce script est le seul moyen prevu de le faire,
 * avec un mot de passe correctement hashe en bcrypt (comme le reste de
 * l'application).
 *
 * Utilise des arguments en ligne de commande plutot qu'un prompt
 * interactif : plus fiable sur tous les systemes (notamment Windows, ou
 * "npm run" ne relaie pas toujours correctement le clavier vers un script
 * interactif).
 *
 * Usage :
 *   node scripts/creerAdmin.js --nom=Kabeya --postnom=Mbuyi --prenom=Alice \
 *     --naissance=1990-05-12 --sexe=F --email=admin@elanga.cd --motdepasse=MonMotDePasse123
 *
 *   (ou via npm, en n'oubliant pas le "--" qui separe les options de npm) :
 *   npm run creer-admin -- --nom=Kabeya --postnom=Mbuyi --prenom=Alice \
 *     --naissance=1990-05-12 --sexe=F --email=admin@elanga.cd --motdepasse=MonMotDePasse123
 *
 * Le mot de passe peut aussi etre omis de la commande et fourni via la
 * variable d'environnement ADMIN_PASSWORD, pour eviter qu'il reste dans
 * l'historique du terminal :
 *   set ADMIN_PASSWORD=MonMotDePasse123   (PowerShell : $env:ADMIN_PASSWORD="...")
 *   npm run creer-admin -- --nom=Kabeya --postnom=Mbuyi --prenom=Alice --naissance=1990-05-12 --sexe=F --email=admin@elanga.cd
 */

const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = require('../config/db');
const { creerAdministrateur, trouverParEmail } = require('../models/utilisateurModel');

const SALT_ROUNDS = 10;

// Transforme --nom=Kabeya --sexe=F en { nom: 'Kabeya', sexe: 'F' }
function analyserArguments(argv) {
  const args = {};
  argv.forEach((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

function afficherUsage() {
  console.log(`
Usage :
  node scripts/creerAdmin.js --nom=... --postnom=... --prenom=... \\
    --naissance=AAAA-MM-JJ --sexe=M|F --email=... --motdepasse=...

Champs obligatoires : nom, postnom, prenom, naissance, sexe, email
Le mot de passe peut etre passe via --motdepasse=... OU via la variable
d'environnement ADMIN_PASSWORD (recommande, pour ne pas le laisser dans
l'historique du terminal).
`);
}

async function main() {
  const args = analyserArguments(process.argv.slice(2));
  const motDePasse = args.motdepasse || process.env.ADMIN_PASSWORD;

  const requis = ['nom', 'postnom', 'prenom', 'naissance', 'sexe', 'email'];
  const manquants = requis.filter((champ) => !args[champ]);

  if (manquants.length || !motDePasse) {
    console.error(`Champs manquants : ${[...manquants, !motDePasse && 'motdepasse'].filter(Boolean).join(', ')}`);
    afficherUsage();
    process.exitCode = 1;
    return;
  }

  const sexe = args.sexe.trim().toUpperCase();
  if (!['M', 'F'].includes(sexe)) {
    console.error('Le sexe doit etre "M" ou "F".');
    process.exitCode = 1;
    return;
  }
  if (motDePasse.length < 6) {
    console.error('Le mot de passe doit contenir au moins 6 caracteres.');
    process.exitCode = 1;
    return;
  }

  const email = args.email.trim();
  const existant = await trouverParEmail(email);
  if (existant) {
    console.error(`Un compte existe deja avec cet email (role actuel : ${existant.role}).`);
    console.error('Pour le promouvoir en administrateur, executez plutot :');
    console.error(`  UPDATE utilisateurs SET role = 'ADMINISTRATEUR' WHERE email = '${email}';`);
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(motDePasse, SALT_ROUNDS);
  const id = await creerAdministrateur({
    nom: args.nom,
    postnom: args.postnom,
    prenom: args.prenom,
    date_naissance: args.naissance,
    sexe,
    email,
    mot_de_passe: hash
  });

  console.log(`Compte administrateur cree avec succes (id ${id}).`);
  console.log(`Connectez-vous sur le frontend_admin avec : ${email}`);
}

main()
  .catch((err) => {
    console.error('Erreur lors de la creation du compte :', err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
