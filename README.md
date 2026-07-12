# ELANGA — Plateforme numerique ecologique de Kinshasa

> Anciennement nomme "EcoKin" en interne ; la marque et le nom de la
> plateforme sont desormais **ELANGA** (voir `frontend_user/index.html`,
> `NavBar.vue`, `HomeView.vue`).

## Structure du projet

```
ecokin/
├── backend/            API Node.js + Express + MySQL (architecture MVC)
├── frontend_user/       Interface citoyenne (Vue 3 + Vite + Pinia + Tailwind)
└── frontend_admin/      Reserve pour l'interface admin (phase suivante)
```

Comme convenu, cette premiere livraison se concentre sur **le citoyen** :
inscription et tableau de bord limite a ses propres donnees. `frontend_admin`
n'est que scaffolde pour l'instant.

## Backend (MVC)

```
backend/
├── config/db.js              pool MySQL (mysql2), requetes preparees
├── models/                   acces aux donnees (utilisateurModel, signalementModel)
├── controllers/               logique metier (authController, userController)
├── middleware/authMiddleware.js  verification du JWT
├── routes/                   TOUTES les routes sont ici (authRoutes, userRoutes)
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
| POST    | /api/admin/signalements/:id/valider    | Valide un signalement (role ADMINISTRATEUR uniquement) |
| POST    | /api/admin/signalements/:id/invalider  | Invalide un signalement (role ADMINISTRATEUR uniquement) |
| GET     | /api/reference/communes            | Liste des communes (dropdown formulaire)   |
| GET     | /api/reference/types-signalement    | Liste des types d'incident (dropdown formulaire) |
| GET     | /api/public/statistiques            | Statistiques globales agregees (page d'accueil, aucune auth requise) |

`POST /api/users/me/signalements` accepte desormais du `multipart/form-data` :
champs texte (`type_signalement_id`, `commune_id`, `description`, `latitude`,
`longitude`) + un fichier `photo` (traite par `multer`, stocke dans
`backend/uploads/signalements/` et servi via `/uploads/...`).

Toutes les requetes SQL utilisent des requetes preparees (`?`) pour eviter
les injections SQL. Les mots de passe sont hashes avec bcrypt.

> Il n'y a pas encore d'interface d'inscription admin (hors perimetre de
> cette phase). Pour tester la validation, passez manuellement un compte en
> administrateur : `UPDATE utilisateurs SET role = 'ADMINISTRATEUR' WHERE email = '...';`
> puis appelez les routes `/api/admin/...` avec le JWT obtenu via `/api/auth/login`.

## Temps reel (Socket.IO)

Le socket est authentifie par JWT au handshake (`socket.handshake.auth.token`).
Chaque client rejoint automatiquement une room privee `user_<id>`.

| Evenement                  | Portee                         | Declencheur                                  |
|-----------------------------|----------------------------------|-----------------------------------------------|
| `signalement:statut_change` | Prive (room `user_<id>`)         | Un admin valide/invalide un signalement du citoyen concerne |
| `carte:nouveau_marqueur`     | Diffuse a tous les clients connectes | Un signalement passe a VALIDE -> nouveau marqueur synchronise sur toutes les cartes |
| `carte:marqueur_retire`      | Diffuse a tous les clients connectes | Un signalement passe a INVALIDE -> le marqueur est retire partout |

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
│   └── userService.js
├── store/auth.js  Pinia (session, token)
├── router/index.js  garde de navigation (routes protegees)
├── views/         HomeView, NewsView, RegisterView, LoginView, DashboardView, MapView, SignalerView
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

## Choix techniques

- Frontend : Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS,
  Axios, icones via `lucide-vue-next`.
- Backend : Node.js, Express, MySQL (mysql2, requetes preparees), JWT, bcrypt,
  Socket.IO (temps reel, pret a l'emploi).
- Base de donnees : MySQL (remplace PostgreSQL, comme demande), schema derive
  du diagramme de classe fourni (Utilisateur/Contributeur/Administrateur,
  Signalement, TypeSignalement, Photo, Coordonnees, Commune, Ville, Province,
  Pays).

## Points a clarifier avec vous

- Le PDF de **charte graphique** (couleurs/typographie exactes) n'a pas ete
  recu dans cette conversation, seul le diagramme de classe l'a ete. La
  palette et la police (Poppins) utilisees dans `tailwind.config.js` sont
  provisoires, dans l'esprit "ecologie" — a remplacer des reception du PDF.
- Le logo "globe + deux mains" est fourni en SVG maison
  (`src/components/LogoEcoKin.vue`) en attendant l'asset final.
- Les captures d'architecture (photo React) n'ont pas non plus ete recues ;
  l'architecture ci-dessus suit vos consignes textuelles (MVC + dossier
  `routes` centralise + dossier `services` cote frontend).
