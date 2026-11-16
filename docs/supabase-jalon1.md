# Jalon 1 - Données Supabase et React Query

## Installation

Les variables restent dans `.env.local`, ignoré par Git. `.env.example` fournit
les noms à renseigner : `VITE_SUPABASE_URL` et
`VITE_SUPABASE_PUBLISHABLE_KEY`. La clé publique est destinée au navigateur ;
aucune clé secrète/service_role ni mot de passe SQL ne doit utiliser un préfixe VITE.

```powershell
npm.cmd ci
npm.cmd run dev
```

Le README n'a pas été modifié. Les anciens JSON sont conservés dans `fixtures/`
comme référence pédagogique et ne sont plus servis dans `public/` ni lus par
l'application. Les images locales du catalogue sont conservées.

## Base versionnée

- `20261116000100_create_shop.sql` crée les tables `products`, `orders` et
  `order_items`, leurs clés étrangères, contraintes, index, privilèges et RLS.
- `20261116000200_import_products.sql` importe les six produits initiaux.
  Les UUID sont générés par PostgreSQL ; les anciens identifiants deviennent
  les slugs. Les commandes fictives ne sont pas importées.
- Le catalogue est public en lecture. Les tables de commandes ont un droit
  SELECT mais **aucune policy de lecture**, donc ne renvoient aucune ligne
  aux rôles clients à ce jalon. Toutes les écritures clientes sont refusées.
- Les policies utilisateur, les droits d'écriture et l'authentification seront
  ajoutés par de nouvelles migrations aux jalons suivants. Ne pas modifier
  les migrations déjà appliquées.
- Les produits sont inclus dans une migration, pas dans `seed.sql` : ils
  sont donc aussi importés par le déploiement GitHub des migrations.

## Commandes CLI (version 3)

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref VOTRE_REFERENCE_PROJET
npx.cmd supabase start
npx.cmd supabase db push
npx.cmd supabase db push --remote --dry-run --skip-vault
npx.cmd supabase db push --remote --skip-vault
```

Avec cette CLI, `db push` seul cible le local ; `--remote` cible le projet lié.
Le projet distant possède déjà les deux migrations après ce jalon. Un second
dry-run indique qu'il n'y a rien à appliquer. L'intégration GitHub retrouvera
ces versions dans l'historique et ne doit pas réimporter les produits.
Coordonnez les déploiements en binôme ; ne créez pas les tables manuellement.

Docker Desktop doit être lancé pour le développement local. Les dossiers
`.temp` et `.branches` sont ignorés. Les réglages d'authentification distante
n'ont pas été changés par ce jalon.

## Lecture dans React

- `src/lib/supabase.ts` crée un client typé unique, à la première requête.
  Une configuration manquante est remontée comme erreur de requête visible.
- `src/lib/queryClient.ts` définit un cache partagé, avec fraîcheur de 60 s
  et une nouvelle tentative en cas d'échec. Les commandes ont une fraîcheur
  de 15 s.
- `src/features/products/queries.ts` fournit `useProducts()` et
  `useProduct(id)`. La clé de détail inclut l'identifiant et la requête est
  désactivée tant que celui-ci manque. Les noms SQL sont convertis vers le
  modèle métier (`image_url` → `image`, `in_stock` → `inStock`).
- `ShopPage` et `ProductList` partagent `['products']` : pas de seconde copie
  dans un state local. Le panier retrouve les noms à partir des UUID réels.
- `src/features/orders/queries.ts` lit les commandes et leurs lignes. La RLS
  explique la liste vide actuelle ; aucun filtre de confidentialité côté
  frontend ne remplace une policy. Les clés seront segmentées par utilisateur
  et le cache privé nettoyé lors de l'ajout du contexte d'authentification.
- `useFetch` est supprimé. Chargement, erreurs et liste vide sont gérés.
  Les routes de connexion, le détail produit à l'écran et le paiement ne sont
  pas ajoutés ici ; le hook de détail est prêt pour le routage à venir.

## Vérification de la base

Les types `src/lib/database.types.ts` ont été générés depuis le schéma local
réel avec `npx.cmd supabase gen types --schema public`. Les régénérer après
une évolution du schéma plutôt que les réécrire manuellement.

`supabase/checks/jalon1.sql` se lance avec psql sur la base locale en tant
que postgres. Il crée des fixtures dans une transaction, teste la lecture
publique, la confidentialité, les écritures interdites, le prix positif et
la quantité strictement positive, puis annule toutes les fixtures (ROLLBACK).

```powershell
Get-Content -Raw supabase/checks/jalon1.sql | docker exec -i supabase_db_my-shop psql -U postgres -d postgres
npm.cmd run build
npm.cmd run lint
```

Les tests SQL locaux ont passé. La Data API distante, avec la clé publique,
renvoie six produits et aucune commande ni ligne de commande. Les fichiers
d'images correspondent aux chemins importés. Ces contrôles ne remplacent
pas les tests à deux utilisateurs prévus aux jalons 3 et 4.

Le test navigateur sur le build de production et le projet distant a aussi
validé : six cartes, un seul GET produits malgré les deux abonnements au
cache, retour depuis Commandes sans nouveau GET pendant staleTime, noms
lisibles dans le panier malgré les UUID, maintien du panier entre les vues,
absence d'appels aux JSON, absence de débordement mobile et erreur de requête
affichée avec role=alert. Les prérequêtes CORS OPTIONS ne sont pas comptées
comme des lectures du catalogue. Aucun problème de dépendance de production
n'a été signalé par `npm audit --omit=dev` au moment de ce jalon.

Question du point de contrôle : la clé publique identifie l'application,
mais ce sont les privilèges et les policies RLS qui déterminent les lectures
et écritures permises. À ce stade, un client ne peut ni lire les commandes
privées ni modifier le catalogue.
