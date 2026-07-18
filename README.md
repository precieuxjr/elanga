# ELANGA — Plateforme numerique ecologique de Kinshasa

> Anciennement nomme "EcoKin" en interne ; la marque et le nom de la
> plateforme sont desormais **ELANGA** (voir `frontend_user/index.html`,
> `NavBar.vue`, `HomeView.vue`).

## Structure du projet

```
elanga/
├── backend/            API Node.js + Express + MySQL (architecture MVC)
├── frontend_user/       Interface citoyenne (Vue 3 + Vite + Pinia + Tailwind)
└── frontend_admin/      Interface administrateur (tableau de bord, gestion
                          des signalements, des utilisateurs et des
                          collaborations)
```

Cette livraison couvre desormais trois profils : le **citoyen**
(inscription, signalement, tableau de bord personnel), l'**administrateur**
(validation des signalements, gestion des utilisateurs, pilotage des
collaborations) et le **collaborateur** (ONG, centre de sante, ecole...)
qui peut se saisir des signalements valides pour proposer une intervention.

## Backend (MVC)

```
backend/
├── config/db.js              pool MySQL (mysql2), requetes preparees
├── models/                   acces aux donnees (utilisateurModel,
│                              signalementModel, demandecollaborateur_model,
│                              collaboration_Model)
├── controllers/               logique metier (authController, userController,
│                              adminCollaborationController,
│                              collaborateurController)
├── middleware/authMiddleware.js  verification du JWT + roles
├── routes/                   TOUTES les routes sont ici (authRoutes,
│                              userRoutes, adminRoutes, collaborateurRoutes)
│   └── index.js               centralise et exporte l'ensemble vers server.js
├── database/schema.sql        schema MySQL derive du diagramme de classe
├── utils/jwt.js
└── server.js                  point d'entree unique, monte /api
```

Aucune route n'est declaree ailleurs que dans `routes/` : `server.js` ne fait
que monter `app.use('/api', routes)`.

### Installation

```bash
cd backend
cp .env.example .env      # renseigner les identifiants MySQL
npm install
mysql -u root -p < database/schema.sql
npm run dev                # http://localhost:5000
```

### Routes API (citoyen)

| Methode | Route                        | Description                              |
|---------|-------------------------------|-------------------------------------------|
| POST    | /api/auth/register            | Inscription d'un contributeur             |
| POST    | /api/auth/login                | Connexion (retourne un JWT)               |
| GET     | /api/users/me                  | Profil de l'utilisateur connecte          |
| GET     | /api/users/me/dashboard         | Statistiques + signalements de l'utilisateur (donnees filtrees par JWT) |
| GET     | /api/users/me/signalements       | Liste complete des signalements de l'utilisateur |
| POST    | /api/users/me/signalements        | Creer un signalement                      |
| GET     | /api/signalements/carte            | Tous les signalements VALIDE (carte partagee, tout citoyen connecte) |
| GET     | /api/reference/communes            | Liste des communes (dropdown formulaire)   |
| GET     | /api/reference/types-signalement    | Liste des types d'incident (dropdown formulaire) |
| GET     | /api/public/statistiques            | Statistiques globales agregees (page d'accueil, aucune auth requise) |

### Routes API (collaborateur)

Reservees aux comptes ayant le role `COLLABORATEUR` (ou `ADMINISTRATEUR`) via
le middleware `estCollaborateur`.

| Methode | Route                                          | Description                                       |
|---------|--------------------------------------------------|-----------------------------------------------------|
| POST    | /api/collaborateur/demande                        | Un contributeur demande a devenir collaborateur (ONG, centre, ecole...) |
| GET     | /api/collaborateur/ma-demande                      | Suivre le statut de sa derniere demande             |
| GET     | /api/collaborateur/signalements                     | Liste des signalements VALIDE ouverts a une proposition |
| POST    | /api/collaborateur/signalements/:id/proposer         | Proposer une solution/intervention sur un signalement |
| GET     | /api/collaborateur/propositions                      | Liste de ses propres propositions                   |
| POST    | /api/collaborateur/propositions/:id/rapport           | Envoyer le rapport d'intervention (une fois le feu vert donne) |

### Routes API (administrateur)

| Methode | Route                                                | Description                                    |
|---------|---------------------------------------------------------|--------------------------------------------------|
| POST    | /api/admin/signalements/:id/valider                       | Valide un signalement                             |
| POST    | /api/admin/signalements/:id/invalider                     | Invalide un signalement                           |
| POST    | /api/admin/signalements/:id/retirer-carte                  | Retire un signalement de la carte publique (reste en base) |
| POST    | /api/admin/signalements/:id/restaurer-carte                 | Restaure un signalement sur la carte (si VALIDE et coherent) |
| GET     | /api/admin/demandes-collaborateur?statut=EN_ATTENTE          | Liste les demandes de statut collaborateur         |
| POST    | /api/admin/demandes-collaborateur/:id/accepter                | Accepte une demande : le contributeur devient collaborateur |
| POST    | /api/admin/demandes-collaborateur/:id/refuser                 | Refuse une demande                                |
| GET     | /api/admin/collaborations?statut=EN_ATTENTE                    | Liste les propositions de collaboration             |
| POST    | /api/admin/collaborations/:id/accepter                         | Donne le "feu vert" a une proposition               |
| POST    | /api/admin/collaborations/:id/refuser                          | Refuse une proposition                             |
| POST    | /api/admin/collaborations/:id/cloturer                          | Cloture une collaboration dont le rapport a ete envoye ; le signalement passe a RESOLU |

Toutes les requetes SQL utilisent des requetes preparees (`?`) pour eviter
les injections SQL. Les mots de passe sont hashes avec bcrypt.

## Cycle de vie d'un signalement

```
EN_COURS --(admin valide)--> VALIDE --(collaboration cloturee)--> RESOLU
   |                            |
   +---(admin invalide)-->  INVALIDE
```

Un signalement `VALIDE` peut en plus etre retire/restaure de la carte
publique independamment de son statut, via `retirer-carte` /
`restaurer-carte` (visibilite d'affichage, sans changer le statut en base).

## Cycle de vie d'une collaboration

```
EN_ATTENTE --(admin accepte : feu vert)--> ACCEPTEE
    |                                          |
    +--(admin refuse)--> REFUSEE               +--(collaborateur envoie son rapport)--> RAPPORT_ENVOYE
                                                                                              |
                                                                        (admin cloture) -----> CLOTUREE
                                                                        -> signalement passe a RESOLU
```

## Temps reel (Socket.IO)

Le socket est authentifie par JWT au handshake (`socket.handshake.auth.token`).
Chaque client rejoint automatiquement une room privee `user_<id>` ; les
comptes administrateur rejoignent en plus la room `admins`.

| Evenement                              | Portee                              | Declencheur                                                    |
|------------------------------------------|----------------------------------------|-------------------------------------------------------------------|
| `signalement:statut_change`               | Prive (room `user_<id>`)                | Un admin valide/invalide un signalement du citoyen concerne        |
| `carte:nouveau_marqueur`                   | Diffuse a tous les clients connectes     | Un signalement passe a VALIDE, ou est restaure sur la carte -> nouveau marqueur synchronise |
| `carte:marqueur_retire`                    | Diffuse a tous les clients connectes     | Un signalement passe a INVALIDE, est retire de la carte, ou une collaboration est cloturee (RESOLU) -> le marqueur est retire partout |
| `admin:nouvelle_demande_collaborateur`      | Room `admins`                           | Un contributeur soumet une demande de statut collaborateur         |
| `collaborateur:demande_traitee`             | Prive (room `user_<id>`)                | L'administrateur accepte/refuse une demande de statut collaborateur |
| `admin:nouvelle_proposition`                | Room `admins`                           | Un collaborateur propose une solution sur un signalement            |
| `collaborateur:proposition_traitee`          | Prive (room `user_<id>`)                | L'administrateur accepte/refuse/cloture une proposition de collaboration |
| `admin:rapport_recu`                         | Room `admins`                           | Un collaborateur envoie son rapport d'intervention                  |

Cote frontend, `src/services/socketService.js` est le point d'entree unique
(connexion/deconnexion), `NotificationToast.vue` affiche les notifications
privees, et `MapView.vue` (route `/carte`) affiche et synchronise en direct
tous les signalements valides, pour eviter qu'un citoyen ne signale deux fois
le meme incident.

## Frontend citoyen (frontend_user)

```
frontend_user/src/
├── services/     TOUTES les routes vers le backend sont ici
│   ├── api.js         instance Axios + intercepteur JWT
│   ├── authService.js
│   ├── userService.js
│   └── collaborateurService.js
├── store/auth.js  Pinia (session, token, role)
├── router/index.js  garde de navigation (routes protegees par role)
├── views/         HomeView, NewsView, RegisterView, LoginView, DashboardView,
│                   MapView, SignalerView, CollaborateurView
└── components/    NavBar, LogoEcoKin (globe + deux mains, en SVG), NotificationToast
```

Les vues n'appellent jamais Axios ni une URL backend directement : elles
passent systematiquement par `src/services/*`, comme demande.

### Installation

```bash
cd frontend_user
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## Frontend admin (frontend_admin)

Interface separee (tableau de bord, gestion des utilisateurs, des
signalements et des collaborations), reservee aux comptes `ADMINISTRATEUR`.

```bash
cd frontend_admin
cp .env.example .env
npm install
npm run dev            # http://localhost:5174
```

## Choix techniques

- Frontend : Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS,
  Axios, icones via `lucide-vue-next`.
- Backend : Node.js, Express, MySQL (mysql2, requetes preparees), JWT, bcrypt,
  Socket.IO (temps reel), Multer (upload des photos de signalement).
- Base de donnees : MySQL, schema derive du diagramme de classe (Utilisateur /
  Contributeur / Collaborateur / Administrateur, Signalement,
  TypeSignalement, Photo, Coordonnees, Commune, Ville, Province, Pays,
  DemandeCollaborateur, Collaboration).

## Points a clarifier

- Le PDF de **charte graphique** (couleurs/typographie exactes) n'a pas ete
  recu ; la palette et la police utilisees dans `tailwind.config.js` restent
  provisoires, dans l'esprit "ecologie".
- Le logo "globe + deux mains" est fourni en SVG maison
  (`src/components/LogoEcoKin.vue`) en attendant l'asset final.