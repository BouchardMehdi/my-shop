# Jalon 4 - Administration du catalogue et des commandes

## Périmètre

- `/admin` présente le catalogue, ses compteurs et les actions créer,
  modifier et supprimer. Les pages admin sont chargées à la demande.
- `/admin/orders` affiche toutes les commandes avec client, articles,
  quantités, prix historiques, total, date et statut.
- Le lien Administration apparaît uniquement pour un profil administrateur.
  AdminRoute attend la session puis le profil ; un utilisateur standard
  reçoit une page Accès refusé, même en saisissant directement l'URL.
- DataTable est le composant générique partagé entre produits et commandes.
  Ses en-têtes, légendes et conteneurs défilants sont accessibles au clavier.
- ProductForm est partagé entre création et édition. Il valide les champs,
  garde la saisie en cas d'erreur et affiche les erreurs du serveur.
- ConfirmDialog utilise une fenêtre modale native, une confirmation explicite,
  Annuler, Échap et un retour du focus au déclencheur. La suppression attendue
  bloque une seconde confirmation. Après suppression, le focus va au bouton
  Nouveau produit.
- Chaque écriture est une mutation React Query sans nouvelle tentative
  automatique, avec invalidation de `['products']`. Le catalogue public et
  son compteur reflètent aussi les créations et suppressions.

Un produit déjà présent dans une commande ne peut pas être supprimé à cause
de sa clé étrangère : le message propose de le marquer Épuisé. Son historique
et les commandes restent conservés. Le statut des commandes reste en lecture
seule ; aucun paiement ni changement de statut n'est ajouté à ce jalon.

## Migration et rôle

`20261116000400_admin_profiles_and_catalog.sql` crée :

- `profiles`, avec UUID Auth, e-mail et rôle contraint à `user` ou `admin`.
  Les comptes existants reçoivent un profil utilisateur lors de la migration.
- La RLS de lecture du seul profil personnel. Aucune écriture de profil n'est
  autorisée aux clients, y compris aux administrateurs : ils ne peuvent pas
  s'auto-promouvoir ni attribuer un rôle à un autre utilisateur.
- Le trigger `sync_auth_profile` : une inscription reçoit toujours `user`,
  indépendamment des métadonnées Auth envoyées par le navigateur. Une mise
  à jour de l'e-mail synchronise le profil sans réinitialiser le rôle.
- Les droits et policies INSERT, UPDATE et DELETE sur les produits pour
  les seuls profils admin. Le SELECT public du catalogue reste disponible.
- Les policies autorisant un administrateur à lire toutes les commandes
  et leurs lignes. Les utilisateurs standards gardent leur isolation RLS.

Le rôle vient de la table, pas d'un booléen dans localStorage ni des
métadonnées modifiables de l'utilisateur. La base applique immédiatement
une révocation, même si le frontend possède encore un profil en cache.
La fonction du trigger est `security definer`, avec search_path vide,
tables qualifiées et exécution publique révoquée.

La promotion d'un compte particulier est une opération de cet environnement,
distincte de la migration partagée. Exemple dans SQL Editor, après création
du compte Auth et application de la migration :

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com')
returning id, email, role;
```

Le compte `test@example.com` doit garder son rôle `user` pour le test négatif.
Aucun mot de passe ou clé administrateur n'est stocké dans le code versionné.

## Cache et confidentialité

Le profil utilise `['profiles', 'user', userId]`. Le changement d'identité
ou la déconnexion purge les profils et commandes privés. Les commandes
personnelles et administrateur ont des clés distinctes :
`['orders', 'user', userId]` et `['orders', 'admin', userId]`.

Depuis ce jalon, `/account` filtre les achats personnels sur `user_id` pour
qu'un administrateur y voie seulement ses propres achats. La page admin
fait une lecture sans ce filtre. Le filtre est un choix de présentation :
la confidentialité des utilisateurs standards repose toujours sur la RLS,
vérifiée par des appels API et SQL sans filtre utilisateur.

## Migration locale et distante

La migration a été appliquée au local et au projet distant `my-shop`.
Le dry-run après déploiement a confirmé qu'aucune migration n'est en attente.
Le compte `admin@example.com` a été créé, confirmé et promu par SQL ;
`test@example.com` conserve son rôle utilisateur. Les réglages Auth et les
privilèges d'écriture des profils pour les clients n'ont pas été assouplis.

Les anciennes migrations restent inchangées. Les types TypeScript ont été
régénérés depuis la base locale migrée.

```powershell
npx.cmd supabase db push
npx.cmd supabase db push --remote --dry-run --skip-vault
npx.cmd supabase db push --remote --skip-vault
```

La première commande vise le local. Les suivantes visent le projet lié
`my-shop`. Après déploiement, le dry-run distant doit être à jour.

## Test manuel

1. Lancer `npm.cmd run dev` et ouvrir l'URL affichée par Vite.
2. Déconnecté, ouvrir `/admin` : retour vers `/login`. Se connecter avec le
   compte administrateur attribué ; le lien Administration doit apparaître.
3. Sur `/admin`, créer un produit temporaire : nom Test catalogue, slug
   unique `test-catalogue`, prix `12.50`, image `/lampe.webp`, puis catégorie,
   description et stock. Le tableau et les compteurs doivent se mettre à jour.
4. Revenir à Boutique : le nouveau produit apparaît sans vider le cache à la
   main. Revenir à Administration et modifier son nom, son prix et son stock.
5. Essayer un slug déjà utilisé : une erreur doit apparaître sans perdre la
   saisie. Annuler le formulaire.
6. Supprimer le produit temporaire : Annuler ou Échap le conserve et rend le
   focus au bouton ; confirmer le supprime du tableau et de la boutique.
7. Essayer de supprimer un produit déjà commandé : le refus doit être visible,
   sans supprimer la commande. Annuler, puis utiliser Épuisé si nécessaire.
8. Ouvrir Toutes les commandes : les achats des différents comptes doivent
   être visibles avec leurs articles. `/account` reste la liste personnelle.
9. Dans une fenêtre privée, se connecter avec `test@example.com` : aucun lien
   Administration. Saisir `/admin` puis `/admin/orders` : accès refusé.
10. Avec la session de cet utilisateur standard, un appel Supabase
    `from('products').insert(...)` doit aussi être refusé par la base.
    Le SQL Editor du dashboard utilise un rôle privilégié : il ne constitue
    pas une session utilisateur pour ce test.
11. Tester F5 connecté, le clavier, les formulaires et la fenêtre modale à
    390 px. Les tableaux défilent horizontalement dans leur propre conteneur.

Les mots de passe des comptes de test sont communiqués séparément.

## Vérifications effectuées

```powershell
npm.cmd run test:cart
npm.cmd run lint
npm.cmd run build
Get-Content -Raw -Encoding utf8 supabase/checks/jalon4.sql | docker exec -i supabase_db_my-shop psql -v ON_ERROR_STOP=1 -U postgres -d postgres
Get-Content -Raw -Encoding utf8 supabase/checks/jalon3.sql | docker exec -i supabase_db_my-shop psql -v ON_ERROR_STOP=1 -U postgres -d postgres
```

Les tests locaux ont passé : profil par défaut et ignorance des métadonnées
`role`, synchronisation de l'e-mail, refus d'auto-promotion, lecture privée
des profils, CRUD réservé à l'admin, lecture globale des commandes et lignes,
révocation immédiate, refus anonyme et non-régression du checkout. Chaque test
SQL annule intégralement ses fixtures et promotions avec ROLLBACK.

Le parcours Chrome local a validé les URL interdites pour un non-admin,
l'insertion API forgée refusée, le CRUD admin, l'invalidation du catalogue,
le compteur public dynamique, le brouillon conservé après erreur, Échap et
le retour du focus, la suppression bloquée d'un produit commandé, les
commandes de deux utilisateurs, la page personnelle de l'admin et la purge
du cache privé au changement de compte. Les vues catalogue, formulaire,
commandes et confirmation ont été inspectées à 390 px, sans débordement de
la page ni erreur JavaScript. Les fixtures locales ont été supprimées.

Après déploiement, les contrôles distants avec la clé publique ont confirmé
la connexion et le rôle des deux comptes, les profils privés, le refus
d'un INSERT produit non-admin, puis la création, modification et suppression
d'un produit temporaire épuisé avec la session admin. Le catalogue public
reflétait les modifications. Le produit temporaire a été supprimé ; aucune
commande n'a été créée ou modifiée. La lecture admin des commandes et de
leurs lignes, l'isolation utilisateur et le refus anonyme ont aussi passé.

Point de contrôle : montrer le refus SQL/API d'un INSERT produit pour un
non-admin. AdminRoute règle la navigation ; la policy protège la base.

Le README, les réglages Auth et les variables locales restent inchangés.
