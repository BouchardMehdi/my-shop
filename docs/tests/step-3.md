# Étape 3 - Parcours Playwright catalogue vers panier

Vérifications du 17 novembre 2026. Un test E2E Chromium s'ajoute aux 25 tests
Vitest. Il pilote l'application et son vrai catalogue Supabase ; aucune
réponse réseau n'est simulée dans ce parcours.

## Préparer et lancer

Le fichier `.env.local` doit contenir les deux paramètres publics Supabase,
comme pour le lancement normal de l'application. Le catalogue doit être
disponible et contenir au moins un produit en stock. Aucun compte de test
ni mot de passe n'est nécessaire pour ce parcours visiteur.

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Le téléchargement de Chromium est nécessaire une fois sur la machine, puis
lorsque la version installée de Playwright demande un nouveau navigateur.

Playwright démarre Vite automatiquement sur `http://localhost:5173` et attend
sa disponibilité. En local, il peut réutiliser un serveur déjà ouvert à cette
adresse : vérifier qu'il sert bien cette branche et ce projet. Le port est
strict, afin de ne pas lancer silencieusement Vite sur 5174. En CI, le serveur
n'est pas réutilisé. Aucun workflow GitHub Actions n'est ajouté à cette étape.

## Ce que protège le scénario

`e2e/shop.spec.ts` décrit un seul objectif métier, découpé en étapes lisibles :

1. Ouvrir le catalogue avec un contexte navigateur neuf et un panier vide.
2. Choisir le premier produit en stock, sans imposer un UUID, un nom ou un prix.
3. Ajouter ce produit et vérifier son nom, sa quantité et le compteur du panier.
4. Augmenter sa quantité et vérifier deux exemplaires.
5. Recharger la page et retrouver le même produit et la même quantité.

Les locators utilisent rôles et noms accessibles ; les assertions Playwright
attendent les résultats observables. Aucun sleep, accès direct au store,
sélecteur de classe CSS ou initialisation artificielle de localStorage n'est
nécessaire. Chaque test reçoit son propre contexte navigateur ; le panier
personnel du développeur n'est pas utilisé.

Le scénario ne passe pas commande et ne modifie pas le catalogue. Il ne fait
que lire les produits distants et modifier le panier local de son contexte.
La connexion E2E, présentée en bonus dans le TP, n'est pas ajoutée ici.

## Lire et déboguer un échec

```powershell
npm.cmd run test:e2e:report
npm.cmd run test:e2e:ui
npm.cmd run test:e2e -- --headed
```

- `playwright-report/index.html` contient le rapport HTML.
- `test-results/` contient les captures et traces des échecs.
- Le rapport permet d'ouvrir la trace avec les actions et le DOM au moment
  de l'erreur. On peut aussi utiliser `npx.cmd playwright show-trace CHEMIN/trace.zip`.
- Il n'y a pas de nouvelle tentative automatique : un échec reste visible
  dès la première exécution et sa trace est conservée.

Les rapports sont ignorés par Git. Ils peuvent contenir des captures de
l'application et des échanges réseau ; ils restent des artefacts locaux,
pas des fichiers sources à publier automatiquement.

## Rituel rouge puis vert effectué

Dans une copie temporaire du scénario, le compteur attendu après un ajout
a été remplacé par **99 articles**. Le test a échoué sur cette assertion,
avec un rapport HTML, une capture de la page et un fichier trace.zip.
La trace a été inspectée : elle contient l'attente du lien « Panier, 99
article(s) », son échec et 15 snapshots DOM. Le panier réel contenait un article.

Le scénario restauré a ensuite passé. Cette exécution de contrôle a utilisé
un port isolé 5189 et forcé Playwright à démarrer son propre Vite depuis le
projet, puis à l'arrêter, validant aussi le cas sans serveur préexistant.
La configuration versionnée reste sur 5173. Aucune attente incorrecte n'a
été laissée dans le fichier de travail.

## Résultats

- `npm.cmd run test:e2e` : 1 parcours Chromium réussi.
- Preuve rouge/vert et génération des trois artefacts d'échec : validées.
- Démarrage et arrêt automatiques du serveur sur le port de contrôle : validés.
- `npm.cmd test` : les 25 tests unitaires/composants passent toujours ; Vitest
  ne collecte pas les scénarios du dossier `e2e/`.
- `npm.cmd run lint` et `npm.cmd run build` : succès. La configuration
  Playwright et les scénarios sont inclus dans la vérification TypeScript.

La mesure de couverture et son score dans le README restent pour le
quatrième commit. Le README, les branches de référence et la base Supabase
ne sont pas modifiés à cette étape.
