# Sinolog

Site e-commerce "proxy-purchasing" inspiré de 1688 / Taobao / Pinduoduo :
les visiteurs parcourent et achètent des produits sourcés depuis la Chine
(catalogue CJ Dropshipping) directement sur le site (personne d'autre ne
vend), paient par Mobile Money (Airtel Money, Orange Money, Mvola), et
c'est l'administrateur (`fongchaneric1@gmail.com`) qui effectue l'achat
réel auprès du fournisseur puis organise l'expédition.

Stack : **Vue 3 + Vite + Tailwind CSS** (frontend), **Node.js / Vercel
Serverless Functions** (`api/`), **Firebase** (Authentication + Realtime
Database), déployé sur **Vercel**, code hébergé sur **GitHub**.

## Fonctionnalités

- Recherche & liste de produits issus de l'API **CJ Dropshipping**
  (`developers.cjdropshipping.com`), avec image, titre, prix, boutique et
  Product ID.
- Page produit avec galerie d'images et sélecteur de variantes, façon 1688.
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
  search.js          GET /api/search?keyword=...  -> proxy CJ Dropshipping /product/list (recherche)
  product.js         GET /api/product?itemId=...   -> proxy CJ Dropshipping /product/query (détail)
  orders/update-status.js  POST, admin uniquement -> change le statut d'une commande
  _lib/               firebase-admin, authentification + appel CJ Dropshipping, normalisation des réponses, cache de secours
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
| `CJ_API_KEY`, `CJ_API_EMAIL`, `CJ_API_BASE_URL` | Identifiants CJ Dropshipping — **jamais exposés au navigateur**, utilisés uniquement dans `api/_lib/cjAuth.js` (connexion) et `api/_lib/cjdropshipping.js` (appels produits) |
| `ADMIN_EMAIL` | E-mail admin côté serveur (défaut `fongchaneric1@gmail.com`) |

⚠️ **Important** : `CJ_API_KEY` et les identifiants du compte de service
Firebase (`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`) sont des
secrets. Ne jamais les committer dans le dépôt — ils ne doivent exister
que dans les variables d'environnement Vercel / `.env.local` (déjà
ignoré par git).

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

## Remarque sur le format de réponse CJ Dropshipping

L'accès réseau à `developers.cjdropshipping.com` n'était pas disponible
dans l'environnement de développement utilisé pour créer ce projet : les
chemins (`/authentication/getAccessToken`, `/product/list`,
`/product/query`) et le flux d'authentification (connexion par e-mail +
clé API pour obtenir un `accessToken`, valable ~15 jours, à renouveler via
`refreshToken`) suivent la documentation officielle de CJ telle
qu'elle a pu être mémorisée, mais n'ont pas pu être testés en direct. Le
mapping des champs de réponse (`api/_lib/normalize.js`) reste donc
défensif (plusieurs noms de champs candidats par valeur). Utiliser
`api/search?keyword=...&raw=1` ou `api/product?itemId=...&raw=1` pour
inspecter la réponse brute réelle après déploiement : si le format
diffère, il suffit d'ajouter les bons noms de champs dans les listes
`candidates` de ce fichier, ou de corriger les chemins dans
`api/_lib/cjAuth.js` / `api/_lib/cjdropshipping.js` — aucune autre partie
du code n'a besoin de changer.

Les prix CJ sont en USD ; ils sont convertis vers un équivalent CNY dans
`api/_lib/normalize.js` (taux fixe `CJ_USD_TO_CNY`) pour rester compatibles
avec `src/utils/currency.js`, qui affiche un prix de base en Yuan.

Les mots-clés de la grille "tendances" de l'accueil (`api/trending.js`)
sont désormais en anglais (CJ recherche par nom de produit anglais),
contrairement aux mots-clés chinois utilisés avec le fournisseur
précédent.

## Taux de conversion CNY → Ariary

Le montant en Ariary affiché sur le site (`src/utils/currency.js`) est
**indicatif** (taux fixe configurable), pour donner une idée du prix
avant commande. Le montant exact à payer (produit + frais de transport
international + frais de service) est communiqué par l'admin après
validation de la commande.
