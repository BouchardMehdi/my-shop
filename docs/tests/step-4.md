# Étape 4 - Couverture : mesurer et choisir la suite

Mesure du 17 novembre 2026, Europe/Paris, sur le code applicatif du commit
`355a79b`, avec la configuration de couverture de cette étape. Aucun code
applicatif ni nouveau test n'est ajouté pour augmenter le score.

## Commandes

```powershell
npm.cmd ci
npm.cmd run test:coverage
```

Ouvrir ensuite `coverage/index.html` dans le navigateur. Le rapport permet
de descendre du dossier au fichier, puis de voir le code et les branches
non couverts. Cette génération n'utilise pas Supabase : les mêmes 25 tests
Vitest que les étapes précédentes sont exécutés.

## Configuration

`@vitest/coverage-v8` et Vitest utilisent la même version 5.1.0.
Les reporters sont text, html, lcov et json-summary. Le script `test:coverage`
exécute `vitest run --coverage` ; `npm test` reste la suite sans collecte.

Le périmètre comprend tous les fichiers `src/**/*.{ts,tsx}`, même sans test.
Sont exclus `src/**/*.test.{ts,tsx}`, `src/**/*.d.ts`, `src/test/**` et
`src/main.tsx`. Les fonctions métier, les gardes, le client Supabase, le
checkout et les écrans admin restent dans le calcul. Aucun seuil minimum
n'est imposé et aucune zone non testée n'est cachée pour relever le score.

## Résultat global

Node 22.19.0, Vitest 5.1.0, fournisseur `@vitest/coverage-v8` 5.1.0.
Les 25 tests passent ; 37 fichiers
applicatifs sont représentés dans le rapport.

| Indicateur | Pourcentage | Couvert / total |
| --- | ---: | ---: |
| Lignes | 23,71 % | 106 / 447 |
| Instructions | 23,56 % | 131 / 556 |
| Branches | 21,27 % | 90 / 423 |
| Fonctions | 26,31 % | 45 / 171 |

Les valeurs proviennent de `coverage/coverage-summary.json`. Une synthèse
datée et sans chemin absolu de machine est conservée dans
`docs/tests/coverage-2026-11-17.json`. Le README porte la même date et les
mêmes valeurs. Les rapports volumineux restent ignorés dans `coverage/`.

## Interpréter et décider

Le total du panier et le filtrage atteignent 100 % des lignes. ProductCard
atteint 100 % des lignes mais 88,88 % des branches : son badge facultatif
n'a pas toutes ses variantes testées. Le store atteint 96,55 % des lignes.

De nombreux autres fichiers restent à 0 %, notamment AuthProvider,
AdminRoute, les mutations de catalogue et celles de commandes. Le résultat
global reflète les zones que la petite suite du TP ne protège pas encore.
Les scénarios Playwright et les tests SQL ne contribuent pas à cette collecte
Vitest, même s'ils vérifient d'autres comportements du projet.

**Priorité proposée pour la discussion en binôme : `usePlaceOrder`, dans
`src/features/orders/mutations.ts`, 0/16 lignes couvertes.** Le prochain
scénario doit utiliser le vrai hook, un panier connu et une RPC simulée en
erreur : la mutation doit échouer avec le message attendu, conserver les
articles et ne pas exécuter les effets de succès. Ce choix protège les
données de commande et le panier ; il ne vise pas seulement un pourcentage.

À expliquer au point de contrôle : plusieurs fichiers partagent le minimum
de 0 %. Ce fichier est retenu pour le risque métier. Une ligne exécutée par
un test ne garantit pas qu'une assertion vérifie son comportement.

## Vérifications réalisées

- `npm.cmd run test:coverage` : 25 tests réussis et génération des rapports
  HTML, terminal, LCOV et JSON.
- Rapport HTML ouvert dans Chromium : quatre scores globaux vérifiés,
  navigation vers les mutations de commandes et code non couvert consultés.
- `npm.cmd run test:e2e` : parcours catalogue vers panier toujours réussi.
- `npm.cmd run lint` et `npm.cmd run build` : succès.

Les branches de référence et la configuration de la base ne sont pas modifiées.
Le bonus Storybook et la pipeline GitHub Actions ne font pas partie de ces
quatre commits obligatoires.
