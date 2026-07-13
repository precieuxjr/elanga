# frontend_admin — Espace administrateur ELANGA

Tableau de bord de gestion pour les administrateurs : validation/refus des
signalements, vue detaillee des citoyens et de leur activite, statistiques
globales (par statut, par commune, par type d'incident).

## Installation

```bash
cd frontend_admin
cp .env.example .env
npm install
npm run dev        # http://localhost:5174
```

Le port est volontairement different de `frontend_user` (5173) pour pouvoir
lancer les deux applications en meme temps pendant le developpement.

## Creer un compte administrateur

Rendez-vous sur `/inscription` (lien "Creer un compte administrateur" depuis
la page de connexion). Le formulaire exige un **code d'invitation**, defini
cote backend dans `.env` :

```
ADMIN_SIGNUP_CODE=change_this_invite_code
```

Sans ce code, l'inscription est refusee (403) : c'est ce qui empeche que
n'importe qui tombant sur l'URL puisse se creer un acces administrateur.
Changez cette valeur dans `backend/.env` et ne la communiquez qu'aux
personnes qui doivent avoir un compte admin.

Une fois le compte cree, vous etes automatiquement connecte et redirige vers
le tableau de bord.

Alternative en ligne de commande (toujours disponible) :
`backend/scripts/creerAdmin.js`, voir le README du backend.

## Structure

```
frontend_admin/src/
├── services/       TOUTES les routes vers le backend sont ici
│   ├── api.js          instance Axios + intercepteur JWT
│   ├── authService.js
│   └── adminService.js  utilisateurs, signalements, statistiques
├── store/auth.js   Pinia (session admin, verifie le role)
├── router/index.js  garde de navigation
├── views/
│   ├── LoginView.vue
│   ├── RegisterView.vue        inscription admin (code d'invitation requis)
│   ├── DashboardView.vue     statistiques + graphiques
│   ├── UsersView.vue          liste des citoyens
│   ├── UserDetailView.vue     detail d'un citoyen + son historique
│   └── ReportsView.vue        valider / refuser les signalements
└── components/
    ├── Sidebar.vue, Topbar.vue, StatCard.vue
    ├── DonutChart.vue, BarChart.vue   (aucune librairie de graphiques, tout en SVG/CSS)
    └── LogoElanga.vue
```

## Fonctionnalites couvertes

- **Tableau de bord** : signalements totaux / en attente / valides / invalides,
  citoyens inscrits, repartition par statut (anneaux), repartition par
  commune (barres), activite recente.
- **Utilisateurs** : liste des citoyens avec leur nombre de signalements et
  leur dernier signalement ; clic sur une ligne pour voir le detail complet
  (profil + historique) — c'est l'onglet "utilisateurs actifs" demande.
- **Signalements** : filtre par statut, apercu photo, bouton Valider / Refuser
  qui appelle `/api/admin/signalements/:id/valider|invalider` — la
  notification temps reel et la mise a jour de la carte citoyenne se
  declenchent automatiquement cote backend (Socket.IO deja branche).
