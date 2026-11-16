# Mesures de performance

L'[audit final](audit/rapport.md) complète ce document avec les sept étapes
du projet, les mesures mobile et ordinateur, le contrôle des deux vues et
l'estimation EcoIndex locale. Une [synthèse HTML](audit/index.html) donne
accès aux rapports et aux preuves. Le tableau ci-dessous conserve les
premières mesures du code-splitting et les estimations gzip affichées par Vite.

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

### Mesures navigateur disponibles

FCP, LCP et TBT sont désormais mesurés dans l'audit final sur les builds de
production, cache froid, avec trois passages par étape. Les JSON conservent
les valeurs individuelles et la fiche explique les médianes et leur variabilité.

Le test final confirme que `OrdersPage-*.js` est absent au chargement de la
Boutique et demandé lors du premier clic sur Commandes, et que le panier
reste présent après un aller-retour entre les vues.

## Axe 4 : re-renders React

### Cause identifiée dans le code

Chaque modification du panier re-rend `App` et `ShopPage`. Avant correction,
`sendCartAction` et la prop `onAdd` étaient recréées à chaque rendu. Le
catalogue était donc aussi recalculé, alors que ses produits ne changent pas.

### Corrections

- Le panier reste dans `App` : son état est partagé entre l'en-tête et la
  Boutique et doit survivre aux changements de vue. Le descendre dans la
  page ferait perdre cette persistance lors de son démontage.
- `useReducer(applyAction, {})` remplace le couple `useState` / fonction de
  dispatch. Le dispatch fourni par React conserve une référence stable.
- `useCallback` stabilise `handleAdd`, passé au catalogue.
- `memo` est limité à `ProductList` : les changements du panier ne modifient
  plus sa prop. Son état de chargement interne continue de déclencher ses
  propres rendus. Les composants qui affichent le panier doivent toujours
  se mettre à jour.

### Vérifications effectuées

La compilation TypeScript, le build de production et ESLint passent.
Un test automatisé dans Chrome headless a comparé le code de `0a047c0`
et le code optimisé, servis par Vite en développement. Le hook React DevTools
a compté les commits où la fibre `ProductList` porte le drapeau PerformedWork,
après chargement complet du catalogue. Il s'agit de rendus validés dans des
commits, pas du nombre d'appels de la fonction en StrictMode.

| Interaction | Avant | Après |
| --- | ---: | ---: |
| Ajout d'un article : rendus validés de ProductList | 1 | 0 |
| Augmentation de quantité : rendus validés de ProductList | 1 | 0 |

Les deux versions ont également passé les vérifications fonctionnelles :
six produits affichés, quatre commandes affichées, compteur actualisé,
panier conservé après un aller-retour entre les vues, retrait et vidage du
panier. Aucun gain de TBT ni de durée de rendu n'a été mesuré.

### Complément visuel possible dans le Profiler

Comparer le commit de code-splitting `0a047c0` avec ce commit :

1. Charger la Boutique et attendre l'affichage des produits.
2. Dans React DevTools, activer Highlight updates et enregistrer avec le
   Profiler. Ajouter un article, augmenter sa quantité puis vider le panier.
3. Vérifier que le compteur et le panier changent, et que `ProductList`
   ne se re-rend plus pour ces changements seuls. Écarter le chargement
   initial et les doubles appels de développement dus à StrictMode.
4. Vérifier aussi qu'un aller-retour par Commandes conserve le panier.
   Le remontage du catalogue au retour est normal et reste attendu.
5. Comparer la durée des commits dans le Profiler et la fluidité des mêmes
   interactions. Le TBT Lighthouse est mesuré dans l'audit final : sa médiane
   reste à 0 ms. Aucun gain de durée d'interaction ni de commit Profiler n'est
   revendiqué à partir de cette mesure de chargement.
