# Jalon 3 - Commander et consulter ses commandes

## Fonctionnement

- Le panier est partagé par Zustand, avec des abonnements ciblés. App ne porte
  plus de reducer ni de props de panier. Le catalogue conserve une action stable.
- `persist` conserve seulement les UUID et quantités dans `my-shop-cart`.
  Les noms, prix et disponibilités restent dans React Query. Les données
  invalides de localStorage sont écartées à la restauration. La quantité est
  limitée à 99 par produit, pour un maximum de 100 produits distincts.
- Le panier est celui du navigateur, disponible avant connexion et conservé
  à la déconnexion. Il ne contient aucune session ni donnée personnelle.
  Il survit à F5 et aux changements de route ; la synchronisation des paniers
  entre plusieurs onglets ou appareils n'est pas implémentée.
- « Passer commande » et le lien Panier ouvrent `/checkout`, route protégée.
  Après connexion, le visiteur revient au récapitulatif demandé.
- Une mutation React Query appelle `place_order`. Le bouton est désactivé
  pendant la requête et un verrou immédiat empêche les doubles soumissions.
  Aucune nouvelle tentative automatique n'est faite pour une écriture.
- En cas d'erreur, le message du serveur est affiché et le panier est conservé.
  En cas de succès, les quantités achetées sont retirées (les ajouts effectués
  pendant la requête restent), les commandes de l'utilisateur sont invalidées,
  puis `/account` affiche la confirmation et la liste mise à jour.
- `/account` et `/orders` partagent OrderList et le cache segmenté par utilisateur.
  La lecture ne filtre pas `user_id` côté frontend : la base garantit l'isolation.
  Les commandes affichent leur date, statut, articles, quantités et total.

Il s'agit d'une commande de démonstration enregistrée avec le statut `pending` :
aucun paiement, débit bancaire ou décrément de stock n'est effectué.
Le total affiché est celui des articles, sans calcul de frais de livraison.

## Migration et sécurité

`20261116000300_checkout_and_own_orders.sql` ajoute :

- Les policies de lecture et d'insertion personnelles sur `orders` et
  `order_items`. Le propriétaire d'une commande est comparé à `auth.uid()` ;
  les lignes héritent de l'accès à leur commande. Aucune policy d'UPDATE ou
  de DELETE pour les clients n'est ajoutée.
- Les instantanés `unit_price` et `product_name` dans les lignes de commande,
  pour conserver l'historique lors d'une modification future du catalogue.
- La fonction SQL `place_order(p_items jsonb)`, variante atomique du TP :
  commande et lignes sont validées dans une seule transaction. Une ligne
  invalide ou épuisée annule toutes les écritures de cet appel.

La fonction utilise `security definer` avec `search_path` vide et des tables
qualifiées. Son accès est explicitement limité à `authenticated`. Elle exige
une identité Auth, déduit le propriétaire et son e-mail de cette identité,
lit les prix dans le catalogue, fixe le statut initial et calcule le total.
Le client ne transmet que des UUID produit et des quantités : il ne choisit
ni propriétaire, ni total, ni statut. Les produits sont verrouillés en lecture
le temps de la transaction pour garder des prix cohérents.

Les INSERT directs sur les tables restent révoqués : le chemin d'écriture
public est cette RPC contrôlée. Les policies d'insertion constituent une
barrière supplémentaire si ces privilèges évoluent. Cette restriction évite
qu'un appel REST direct puisse injecter un prix ou un statut arbitraire.
Les types TypeScript ont été régénérés depuis la base locale migrée.

## Déploiement de la migration

La migration a été appliquée au local et au projet distant `my-shop`.
Le dry-run après déploiement a confirmé qu'aucune migration n'est en attente.

Ne pas modifier les migrations des jalons précédents ni créer les colonnes
à la main. Vérifier la cible indiquée par la CLI :

```powershell
npx.cmd supabase db push
npx.cmd supabase db push --remote --dry-run --skip-vault
npx.cmd supabase db push --remote --skip-vault
```

La première commande cible le local. Les deux suivantes ciblent le projet
Supabase lié. Après déploiement, le dry-run distant doit indiquer qu'aucune
migration n'est en attente. L'historique permet à l'intégration GitHub de
reconnaître la migration déjà appliquée.

## Test manuel

1. Lancer `npm.cmd run dev`, puis ouvrir l'URL exacte affichée par Vite.
2. Ajouter deux exemplaires d'un produit et un exemplaire d'un autre : le
   compteur doit indiquer 3. Faire F5 : mêmes articles et quantités.
3. Déconnecté, cliquer « Passer commande » : redirection vers `/login`.
   Se connecter avec le compte de test existant : retour sur `/checkout`.
4. Vérifier les deux lignes, les quantités et le total. Cliquer « Confirmer
   la commande » : bouton en attente, puis redirection vers `/account`.
5. La confirmation et une nouvelle commande doivent apparaître, avec trois
   articles au total. Le panier doit être vide. F5 conserve la commande et
   le panier vide. Le lien Commandes affiche la même liste.
6. Dans Supabase Table Editor, vérifier la nouvelle ligne `orders`, son
   `user_id` et son total ; ses deux lignes `order_items` contiennent les
   quantités et prix unitaires. Le dashboard administrateur voit toutes les
   données : il ne représente pas la vue d'un utilisateur client.
7. Ouvrir une fenêtre privée, se connecter avec un second compte confirmé,
   puis ouvrir `/account` : aucune commande du premier compte ne doit être
   présente. Commander avec ce compte : chacun ne voit que sa propre liste.
8. Tester un panier vide, retirer un produit, vider le panier, naviguer au
   clavier et afficher les pages à la largeur d'un téléphone.

Pour simuler une erreur depuis DevTools → Network, bloquer l'URL
`*/rest/v1/rpc/place_order*`, puis confirmer : l'erreur doit être visible et
le panier conservé. Débloquer l'URL avant la suite. Une réponse réseau perdue
après l'enregistrement peut laisser le résultat incertain : consulter les
commandes avant de réessayer. La déduplication des nouvelles tentatives par
une clé d'idempotence serveur n'est pas implémentée.

## Vérifications effectuées

```powershell
npm.cmd run test:cart
npm.cmd run lint
npm.cmd run build
Get-Content -Raw -Encoding utf8 supabase/checks/jalon3.sql | docker exec -i supabase_db_my-shop psql -v ON_ERROR_STOP=1 -U postgres -d postgres
```

`test:cart` utilise Node 22.18+ et teste le store réel : persistance, rejet des
données altérées, limite de quantité et conservation des ajouts pendant un
checkout. Aucun outil de test supplémentaire n'est requis.

Le test SQL a passé en local : utilisateurs A/B, accès anonyme refusé,
isolation des commandes et de leurs lignes même avec un UUID connu, total,
prix historiques, quantités invalides, produit absent/épuisé et rollback
intégral. Les INSERT policies sont aussi testées avec un GRANT temporaire
dans la transaction. Tous les utilisateurs, produits, commandes et GRANT
de ces tests sont annulés par ROLLBACK.

Un parcours Chrome automatisé contre Supabase local a validé le panier après
F5, le retour après connexion, l'erreur conservant le panier, le double envoi
limité à un seul appel RPC, la commande réussie et ses totaux, la purge du
panier, `/account`, l'isolation A/B via l'API et l'interface, et le refus d'une
commande forgée. Aucun filtre `user_id` n'est envoyé par la lecture frontend.
Les vues compte et checkout ont été inspectées à 390 px, sans débordement
horizontal ; aucune erreur JavaScript n'est apparue dans le parcours.
Les comptes et commandes de test locaux ont ensuite été supprimés.

Après déploiement distant, un contrôle avec la clé publique a confirmé les
six produits, l'absence d'accès anonyme aux commandes et aux articles, la
connexion du compte de test existant et la lecture imbriquée des commandes.
La RPC distante refuse un panier vide avant toute écriture. Ce contrôle
n'a créé aucune commande sur le projet distant.

Point de contrôle : modifier le frontend ou deviner l'UUID d'une commande
ne donne pas accès à celle d'un autre utilisateur. Montrer les policies puis
le test A/B de la base ; ProtectedRoute ne constitue pas cette sécurité.

Le README, les variables locales et les réglages Auth restent inchangés.
