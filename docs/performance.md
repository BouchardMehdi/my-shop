# Mesures de performance

## Axe 3 : code-splitting

Les vues Boutique et Commandes sont extraites dans `src/pages/` et importées
avec `React.lazy`. `Suspense` affiche un message pendant leur chargement.
Le panier reste dans `App` pour conserver son contenu entre les vues.
Les composants réutilisables gardent leurs imports statiques dans les pages.

Mesures du build de production (`npm run build`), en kB décimaux arrondis :

| JavaScript | Avant | Après |
| --- | ---: | ---: |
| Fichier principal `index-*.js` | 229,08 | 223,38 |
| Fichier principal gzip | 71,22 | 70,00 |
| Page Boutique | inclus | 5,07 |
| Page Boutique gzip | inclus | 1,59 |
| Page Commandes | inclus | 2,56 |
| Page Commandes gzip | inclus | 0,95 |
| Total nécessaire à la Boutique (principal + page) | 229,08 | 228,45 |
| Total nécessaire à la Boutique gzip | 71,22 | 71,59 |

Le fichier principal diminue d'environ 2,5 %. Le code des commandes est chargé
à leur première ouverture. Sur ce petit projet, le total gzip nécessaire à
la Boutique augmente légèrement avec le découpage : la baisse du fichier
principal ne prouve donc pas un gain de vitesse d'affichage.

### Mesures navigateur à compléter

FCP et LCP n'ont pas été mesurés : aucun gain Lighthouse n'est revendiqué.
Comparer le commit parent et ce commit avec les mêmes réglages Lighthouse,
sur le build de production servi par `npm run preview`, cache froid.
Répéter les mesures et comparer les médianes.

Dans Network, vérifier que `OrdersPage-*.js` est absent au chargement de la
Boutique et demandé lors du premier clic sur Commandes. Vérifier également
qu'un produit ajouté au panier reste présent après un aller-retour entre
Boutique et Commandes.
