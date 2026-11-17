# Étape 1 - Vitest : panier et recherche

Vérifications du 17 novembre 2026. Cette étape prépare les tests de composants
sans encore écrire les suites RTL, Playwright ou la configuration de couverture.

## Mise en place

- `npm test` lance Vitest une fois ; `npm run test:watch` relance à la sauvegarde.
- `vitest.config.ts` partage les plugins Vite, utilise jsdom et charge
  `src/test/setup.ts`. Seuls les tests `src/**/*.test.ts` et `.test.tsx` sont
  collectés : les futurs scénarios Playwright resteront séparés dans `e2e/`.
- Le setup installe les matchers jest-dom et nettoie le DOM avec RTL. Les
  imports Vitest sont explicites, sans variables globales de test implicites.
- Le store et localStorage sont remis à zéro avant chaque test du panier.
  Les tests unitaires n'appellent pas Supabase.

## Code utilisé dans l'application

`src/features/cart/cart.ts` extrait `computeCartTotal` du checkout. Le calcul
reste en centimes ; un produit manquant contribue zéro au récapitulatif, et
le checkout continue à bloquer sa commande séparément.

`src/features/products/search.ts` fournit `filterProducts` : recherche dans le
nom, insensible à la casse, avec suppression des espaces aux extrémités.
ProductList et le compteur utilisent cette même règle avec `?search=...`.
Exemple : `/?search=lamp`. Le champ de recherche sera ajouté à l'étape RTL ;
sans paramètre, le catalogue conserve son affichage habituel.

## Les 14 tests unitaires

| Fichier | Nombre | Comportements protégés |
| --- | --- | --- |
| `src/features/cart/cart.test.ts` | 4 | Prix × quantités, panier vide, calcul en centimes et produit absent. |
| `src/features/products/search.test.ts` | 3 | Casse et espaces, recherche vide et absence de correspondance. |
| `src/features/cart/store.test.ts` | 7 | Ajout répété, quantité zéro restaurée, retrait ciblé, limite 99, ajouts pendant une commande, restauration et vidage. |

Les valeurs attendues et fixtures sont écrites à la main. Les tests de total
montrent les trois blocs Arrange, Act et Assert ; les tests du store exercent
les actions réelles, sans remplacer le store par une maquette.

## Preuve rouge puis vert

Une copie temporaire des sources et des tests a servi à introduire une erreur
à la fois. Aucun défaut volontaire n'a été introduit dans le dossier de travail
servi par Vite. Chaque test ciblé a échoué sur une assertion, puis les sources
de cette copie ont été restaurées. La suite restaurée passe à 14/14.

| Test ciblé | Erreur introduite dans la copie | Résultat |
| --- | --- | --- |
| Prix multipliés par quantités | Remplacer la multiplication par une addition. | Rouge |
| Panier vide | Initialiser le cumul à un centime au lieu de zéro. | Rouge |
| Calcul en centimes | Oublier la conversion du prix en centimes. | Rouge |
| Produit absent | Utiliser un prix de remplacement de 1 € au lieu de zéro. | Rouge |
| Casse et espaces | Supprimer la normalisation de la recherche. | Rouge |
| Recherche vide | Renvoyer une liste vide pour une recherche vide. | Rouge |
| Aucun résultat | Ignorer le texte recherché et conserver tous les produits. | Rouge |
| Ajout répété | Remettre la quantité à 1 à chaque ajout. | Rouge |
| Quantité zéro restaurée | Accepter zéro lors de la restauration. | Rouge |
| Retrait ciblé | Ne plus supprimer la ligne demandée. | Rouge |
| Limite 99 | Autoriser l'ajout d'un centième exemplaire. | Rouge |
| Ajouts pendant une commande | Additionner les quantités achetées au lieu de les retirer. | Rouge |
| Restauration | Persister un panier vide au lieu des articles. | Rouge |
| Vidage | Conserver les lignes au lieu de vider le panier. | Rouge |

Pour refaire une démonstration du premier cas, remplacer temporairement
`* line.quantity` par `+ line.quantity` dans le calcul, puis lancer :

```powershell
npx.cmd vitest run src/features/cart/cart.test.ts -t "additionne les prix"
```

Le test doit échouer avec un total différent de 25. Annuler ensuite cette
modification et relancer : le test doit repasser au vert. Ne pas commiter
la modification volontairement incorrecte.

## Contrôles réalisés

- `npm.cmd test` : 3 fichiers, 14 tests réussis.
- Rituel rouge/vert : 14 échecs d'assertion ciblés, puis 14 tests réussis.
- `npm.cmd run lint` et `npm.cmd run build` : succès.
- Contrôle Chrome du build : recherche par URL, normalisation, compteur,
  état sans résultat et catalogue sans filtre validés, sans erreur JavaScript.
  Ce contrôle effectue uniquement des lectures du catalogue ; aucune commande
  ni donnée distante n'a été créée ou modifiée.

Les branches de référence `version/performance` et `version/supabase`, le
README et la configuration Supabase ne sont pas modifiés par cette étape.
