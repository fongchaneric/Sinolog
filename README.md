# Sinolog

Site e-commerce "proxy-purchasing" inspiré de 1688 / Taobao / Pinduoduo :
les visiteurs parcourent et achètent des produits 1688 directement sur le
site (personne d'autre ne vend), paient par Mobile Money (Airtel Money,
Orange Money, Mvola), et c'est l'administrateur (`fongchaneric1@gmail.com`)
qui effectue l'achat réel auprès du fournisseur sur 1688 puis organise
l'expédition.

Stack : **Vue 3 + Vite + Tailwind CSS** (frontend), **Node.js / Vercel
Serverless Functions** (`api/`), **Firebase** (Authentication + Realtime
Database), déployé sur **Vercel**, code hébergé sur **GitHub**.

## Fonctionnalités

- Recherche & liste de produits issus de l'API JustOneAPI (1688), avec
  image, titre, prix, ventes, note, boutique, lien 1688 et Product ID.
- Page produit avec galerie d'images, sélecteur de variantes
  (couleur/capacité...) et paliers de prix par quantité, façon 1688.
- Panier, checkout avec choix Airtel Money / Orange Money / Mvola, saisie
  de la référence de paiement + numéro d'envoi.
- Suivi de commande (statuts : en attente → confirmé → achat en cours →
  expédié → terminé / refusé) en temps réel (Firebase Realtime Database).
- Authentification par e-mail/mot de passe ou Google (Firebase Auth).
- Compte administrateur dédié : dès que `fongchaneric1@gmail.com` se
  connecte ou s'inscrit, il est automatiquement redirigé vers le tableau de
  bord admin (jamais vers l'interface acheteur) pour valider les paiements
  et faire évoluer le statut des commandes.
- Design responsive (mobile, tablette, ordinateur, TV) inspiré de
  l'interface 1688.

## Arborescence

```
src/                 Application Vue (SPA)
  components/        Header, bottom nav, carte produit, sélecteur de variante...
  views/              Pages acheteur (Home, Search, Product, Cart, Checkout, Orders...)
  views/admin/        Pages admin (Dashboard, Orders, Order detail, Users)
  stores/             Pinia (auth, cart)
  utils/              Appels API, formatage devise, statuts de commande
  firebase.js         Init Firebase côté client
api/                 Fonctions serverless Vercel (Node.js)
  search.js          GET /api/search?keyword=...  -> proxy JustOneAPI (recherche)
  product.js         GET /api/product?itemId=...   -> proxy JustOneAPI (détail)
  orders/update-status.js  POST, admin uniquement -> change le statut d'une commande
  _lib/               firebase-admin, appel JustOneAPI, normalisation des réponses
database.rules.json  Règles de sécurité Firebase Realtime Database
```

## Configuration Firebase

1. Créer un projet Firebase (console.firebase.google.com).
2. **Authentication** → activer les fournisseurs **E-mail/Mot de passe**
   et **Google**.
3. **Realtime Database** → créer une base, puis déployer les règles du
   fichier `database.rules.json` (copier-coller dans l'onglet Règles, ou
   via `firebase deploy --only database` avec la CLI Firebase). Ces règles
   font en sorte que :
   - chaque utilisateur ne peut lire/écrire que son propre panier et ses
     propres commandes ;
   - `fongchaneric1@gmail.com` (l'admin) peut lire/écrire toutes les
     commandes et tous les profils utilisateurs.
4. Récupérer les identifiants :
   - **Web API Key**, **Project ID**, **Database URL** → pour les
     variables `VITE_FIREBASE_*` (frontend) et `FIREBASE_WEB_API_KEY` /
     `FIREBASE_DATABASE_URL` (backend).
   - **Compte de service** (Paramètres du projet → Comptes de service →
     Générer une nouvelle clé privée) → fournit `FIREBASE_CLIENT_EMAIL` et
     `FIREBASE_PRIVATE_KEY` pour le SDK Admin utilisé par les fonctions
     `api/`.

## Variables d'environnement

Copier `.env.example` puis remplir les valeurs (voir ce fichier pour la
liste complète). À définir dans **Vercel → Project Settings →
Environment Variables** pour la production :

| Variable | Usage |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_AUTH_DOMAIN` | Firebase côté client (visible dans le navigateur, normal pour Firebase) |
| `VITE_ADMIN_EMAIL` | E-mail admin utilisé côté client pour la redirection (défaut `fongchaneric1@gmail.com`) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL` | SDK Admin Firebase, utilisé uniquement dans `api/` pour vérifier l'identité de l'admin et modifier les commandes en toute sécurité |
| `JUSTONEAPI_TOKEN` | Token de l'API JustOneAPI (1688) — **jamais exposé au navigateur**, utilisé uniquement dans `api/search.js` et `api/product.js` |
| `ADMIN_EMAIL` | E-mail admin côté serveur (défaut `fongchaneric1@gmail.com`) |

⚠️ **Important** : `JUSTONEAPI_TOKEN` et les identifiants du compte de
service Firebase (`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`) sont
des secrets. Ne jamais les committer dans le dépôt — ils ne doivent
exister que dans les variables d'environnement Vercel / `.env.local`
(déjà ignoré par git).

## Développement local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs Firebase
npm run dev                  # démarre Vite sur http://localhost:5173
```

Pour tester les fonctions `api/` en local, utiliser la CLI Vercel :

```bash
npm i -g vercel
vercel dev
```

## Déploiement (Vercel)

1. Pousser le dépôt sur GitHub (déjà fait).
2. Importer le repo dans Vercel → Vercel détecte automatiquement Vite
   (`vercel.json` fourni).
3. Renseigner toutes les variables d'environnement listées ci-dessus dans
   les réglages du projet Vercel.
4. Déployer. Les fonctions `api/*.js` sont automatiquement publiées comme
   fonctions serverless.

## Remarque sur le format de réponse JustOneAPI

L'accès réseau à `api.justoneapi.com` n'était pas disponible dans
l'environnement de développement utilisé pour créer ce projet : le
mapping des champs de réponse (`api/_lib/normalize.js`) a donc été écrit
de façon défensive, en testant plusieurs noms de champs courants
(`itemId`/`num_iid`/`offerId`, `pic_url`/`image`, etc.) et une recherche
générique du premier tableau de produits dans la réponse JSON. Si le
format réel renvoyé par votre token diffère légèrement, il suffit
d'ajouter les bons noms de champs dans les listes `candidates` de ce
fichier — aucune autre partie du code n'a besoin de changer.

## Taux de conversion CNY → Ariary

Le montant en Ariary affiché sur le site (`src/utils/currency.js`) est
**indicatif** (taux fixe configurable), pour donner une idée du prix
avant commande. Le montant exact à payer (produit + frais de transport
international + frais de service) est communiqué par l'admin après
validation de la commande.
