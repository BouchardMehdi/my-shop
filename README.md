# Maison Moderne - version performance

Cette branche, **`version/performance`**, rassemble le travail sur les
performances, l'accessibilité et l'éco-conception, avec l'audit final.
Elle correspond à la version du projet **avant l'ajout de Supabase**.

## Quelle branche tester ?

| Branche | Contenu | Démarrage |
| --- | --- | --- |
| [version/performance](https://github.com/BouchardMehdi/my-shop/tree/version/performance) | Optimisations, accessibilité, éco-conception et audit. Catalogue et commandes de démonstration en JSON local. | Node et npm uniquement ; aucun compte ni fichier .env nécessaire. |
| [version/supabase](https://github.com/BouchardMehdi/my-shop/tree/version/supabase) | Les quatre jalons Supabase : données et migrations, authentification, panier et commandes personnelles, administration. | Deux paramètres publics Supabase dans .env.local et comptes de test fournis par le binôme. |

`version/supabase` conserve aussi les optimisations précédentes : les deux
branches représentent des étapes successives du même projet. Pour évaluer
le backend, les comptes ou l'administration, utiliser
[le guide de la version complète](https://github.com/BouchardMehdi/my-shop/blob/version/supabase/README.md).

Cette référence a été préparée le 16 novembre 2026 depuis `b2e60aa`, dernier
état avec l'audit avant le jalon 1 Supabase. Seul le README est adapté pour
la restitution ; les sources et les preuves d'audit sont conservées.

## Installation et démarrage

Prérequis : Git, Node.js **22.18 ou supérieur** et npm. Les vérifications ont
été réalisées avec Node 22.19. Sous Windows PowerShell, utiliser `npm.cmd`
et `npx.cmd` si les scripts PowerShell correspondants sont bloqués.

```bash
git clone --branch version/performance --single-branch https://github.com/BouchardMehdi/my-shop.git my-shop-performance
cd my-shop-performance
npm ci
npm run dev
```

Ouvrir l'URL exacte affichée par Vite, habituellement `http://localhost:5173`.
Le catalogue, les commandes, les images WebP et les polices WOFF2 sont
servis localement. Aucun backend, Docker, connexion à Supabase ou compte
utilisateur n'est nécessaire. Une connexion Internet est nécessaire à
l'installation des dépendances.

Utiliser deux dossiers distincts pour comparer les branches. Dans un clone
existant, arrêter Vite avant de changer de branche, puis refaire `npm ci`
pour utiliser le lockfile de la version choisie.

## Parcours de vérification pour le professeur

1. Ouvrir Boutique : les six cartes produit et leurs images doivent apparaître.
2. Ajouter un produit en stock : compteur et panier se mettent à jour.
   Augmenter sa quantité, retirer la ligne et vider le panier.
3. Ajouter de nouveau un article, ouvrir Commandes par le bouton de navigation,
   puis revenir à Boutique : le panier conserve son contenu entre les vues.
4. La vue Commandes présente quatre commandes fictives provenant du JSON.
   Les vues sont pilotées par l'état React et n'ont pas d'URL distincte.
5. Faire F5 : le panier est réinitialisé dans cette version. Sa persistance
   après rechargement est ajoutée plus tard, au jalon 3 Supabase.
6. Naviguer avec Tab et Entrée : lien d'évitement, focus visible, navigation,
   actions du panier et titre de page doivent suivre le parcours.
7. Vérifier la présentation sur téléphone et la navigation entre les deux vues.

Les routes `/login`, `/account`, `/checkout` et `/admin` appartiennent à
la branche `version/supabase`.

## Travail réalisé

- **Images** : WebP locaux, dimensions HTML, chargement eager/lazy et décodage
  asynchrone. L'audit documente aussi l'augmentation du poids des images :
  leur conversion ne constitue pas à elle seule un gain de transfert.
- **Polices** : WOFF2 locaux, fichiers variables, `font-display: swap` et
  préchargement de la police de titre.
- **Code-splitting** : Boutique et Commandes chargées à la demande avec
  `React.lazy` et `Suspense`.
- **Re-renders** : dispatch stable avec `useReducer`, `useCallback` et
  `memo` ciblé sur le catalogue.
- **Accessibilité** : contrastes, lien d'évitement, gestion du titre et du
  focus, état actif de la navigation et annonces de mise à jour du panier.
- **Éco-conception** : suppression de CSS inutilisé et d'animations automatiques.

Les mesures, gains, régressions et points restant à améliorer sont conservés
dans les rapports. Les scores de cet audit ne décrivent pas la version
Supabase, qui ajoute d'autres dépendances et écrans.

## Build et mesure

```bash
npm run lint
npm run build
npm run preview
```

Ouvrir l'URL indiquée par `preview`, habituellement `http://localhost:4173`,
pour mesurer le **build de production** avec Lighthouse. Garder le même
profil mobile ou ordinateur, les mêmes conditions de cache et un navigateur
sans extensions entre les essais. Les scores varient selon les conditions.

Après le build, `dist/assets` contient plusieurs fichiers JavaScript. Dans
Network, le chunk `OrdersPage-*.js` doit être demandé à la première ouverture
de Commandes et être absent au chargement initial de Boutique.

## Audit et preuves

- [Rapport final, protocole et limites](docs/audit/rapport.md).
- [Index HTML des rapports](docs/audit/index.html).
- [Mesures et explication du code-splitting et des re-renders](docs/performance.md).
- [Données consolidées des mesures](docs/audit/results.json).
- [Contrôles complémentaires](docs/audit/checks.json).

Pour consulter les rapports HTML rendus, ouvrir `docs/audit/index.html`
directement dans le navigateur depuis le dossier cloné. GitHub affiche
le code source de ces fichiers HTML.

## Organisation

- `src/pages/` : vues Boutique et Commandes chargées à la demande.
- `src/components/` : catalogue et listes de commandes.
- `src/types/` : modèles métier et logique typée du panier et des commandes.
- `public/data/` : données JSON de démonstration.
- `public/` et `public/fonts/` : images et polices locales.
- `docs/audit/` : rapports et preuves de la restitution.
