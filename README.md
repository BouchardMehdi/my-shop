# Maison Moderne - projet M1 Front end avancé

Boutique de démonstration en React, TypeScript et Vite. Deux branches de
référence permettent d'évaluer séparément les étapes du projet.

## Quelle branche tester ?

| Branche | Contenu | Configuration |
| --- | --- | --- |
| [version/performance](https://github.com/BouchardMehdi/my-shop/tree/version/performance) | Images et polices locales, code-splitting, réduction des re-renders, accessibilité, éco-conception et audit final. Version avant Supabase, avec données JSON locales. | Node et npm uniquement ; aucun compte ni fichier .env nécessaire. |
| [version/supabase](https://github.com/BouchardMehdi/my-shop/tree/version/supabase) | Les quatre jalons : données et migrations, authentification, panier et commandes personnelles, administration du catalogue et des commandes. | Node, npm et les deux paramètres publics Supabase dans .env.local. |

`main` contient la version complète et ce guide. `version/supabase` conserve
aussi les optimisations précédentes : les deux références correspondent à
deux étapes successives du même projet. L'audit de performances porte sur
la version avant Supabase, pas sur les nouveaux écrans d'authentification et
d'administration.

Les références ont été préparées le 16 novembre 2026 : sources performance
issues de `b2e60aa`, sources Supabase issues de `18df8bb`. Les commits de
restitution ajoutent uniquement la documentation de démarrage.

## Prérequis et installation

- Node.js **22.18 ou supérieur** et npm ; version utilisée pour les contrôles :
  Node 22.19.
- Git pour cloner le dépôt et choisir une branche.
- Sous Windows PowerShell, utiliser `npm.cmd` et `npx.cmd` si les scripts
  `npm.ps1` ou `npx.ps1` sont bloqués.

Pour tester la version complète dans un dossier dédié :

```bash
git clone --branch version/supabase --single-branch https://github.com/BouchardMehdi/my-shop.git my-shop-supabase
cd my-shop-supabase
npm ci
```

Pour tester les optimisations indépendamment, suivre le
[README de version/performance](https://github.com/BouchardMehdi/my-shop/blob/version/performance/README.md).
Deux dossiers de travail permettent de garder les dépendances de chaque
version séparées. Dans un clone existant, arrêter Vite avant de changer de
branche, puis refaire `npm ci`.

## Configurer et lancer la version Supabase

1. Copier [.env.example](.env.example) vers `.env.local`.
2. Renseigner l'URL et la clé publique Publishable du projet de démonstration,
   transmises par le binôme :

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Démarrer le frontend :

   ```bash
   npm run dev
   ```

4. Ouvrir l'URL exacte affichée par Vite, habituellement `http://localhost:5173`.

`.env.local` reste ignoré par Git ; l'exemple versionné ne contient que des
valeurs de remplacement. Aucune clé secrète/service_role ni mot de passe
de base ne doit être utilisé dans une variable `VITE_`.

Le projet Supabase de démonstration possède déjà les quatre migrations et
les comptes de test. **Docker et la CLI Supabase ne sont pas nécessaires
pour tester le frontend sur ce projet existant.** Une connexion Internet est
nécessaire pour les données et l'authentification. Les images et polices
sont servies par le frontend.

## Parcours de vérification pour le professeur

Les mots de passe et paramètres publics du projet sont transmis séparément
par le binôme ; ils ne sont pas inclus dans le README.

| Compte | Rôle | À vérifier |
| --- | --- | --- |
| `test@example.com` | Utilisateur | Panier persistant, commande et liste personnelle ; accès admin refusé. |
| `admin@example.com` | Administrateur | CRUD du catalogue et lecture des commandes de tous les utilisateurs. |

1. Sur `/`, ajouter plusieurs articles puis faire F5 : le panier reste présent.
2. Déconnecté, ouvrir `/checkout` : redirection vers `/login`. Se connecter avec
   le compte utilisateur et vérifier le retour au récapitulatif.
3. Confirmer : `/account` affiche la commande et le panier se vide. Le détail
   comporte les articles, quantités, prix historiques et total.
4. Avec le compte utilisateur, saisir `/admin` puis `/admin/orders` : accès
   refusé. Les permissions de la base bloquent aussi les écritures directes.
5. Se connecter avec le compte admin : le lien Administration apparaît.
   Sur `/admin`, créer un produit temporaire avec un slug unique et, par
   exemple, l'image `/lampe.webp`. Modifier ce produit, vérifier la boutique,
   puis le supprimer après confirmation. Annuler ou Échap conserve le produit.
6. Sur `/admin/orders`, vérifier les commandes de tous les comptes et leurs
   articles. `/account` reste la liste des achats personnels, même pour l'admin.
7. Essayer la navigation au clavier et le format mobile. Les tableaux admin
   défilent dans leur conteneur sans élargir toute la page.

Une commande de démonstration reste **En attente de paiement** : aucun
paiement ni débit bancaire n'est effectué. Un produit déjà commandé est
protégé contre la suppression ; le marquer Épuisé permet de le retirer de
la vente. Les données du projet distant sont partagées : utiliser un produit
temporaire pour vérifier le CRUD.

Une nouvelle inscription peut demander une confirmation par e-mail selon
les réglages du projet. Les deux comptes de test sont déjà confirmés.

## Les quatre jalons et leur documentation

| Jalon | Réalisation | Guide |
| --- | --- | --- |
| 1 | PostgreSQL Supabase, client typé, React Query et catalogue importé par migrations. | [Données et migrations](docs/supabase-jalon1.md) |
| 2 | Session dans un Context, connexion, inscription, déconnexion et routes protégées. | [Authentification](docs/supabase-jalon2.md) |
| 3 | Panier Zustand persistant, commande atomique et commandes personnelles protégées par RLS. | [Checkout et commandes](docs/supabase-jalon3.md) |
| 4 | Profils, rôle admin, catalogue CRUD, fenêtre de confirmation et commandes globales. | [Administration](docs/supabase-jalon4.md) |

Les migrations versionnées se trouvent dans [supabase/migrations](supabase/migrations).
Les tests SQL locaux de confidentialité et de permissions sont dans
[supabase/checks](supabase/checks). La sécurité repose sur les privilèges et
policies RLS de PostgreSQL, en complément des gardes de navigation React.

Pour reproduire la base sur un autre environnement, appliquer les quatre
migrations dans l'ordre. Avec Docker et la CLI fournie par les dépendances :

```bash
npx supabase start
npx supabase db push
npx supabase status
```

Utiliser ensuite l'URL API et la clé publique de cet environnement dans
`.env.local`. Les comptes Auth et la promotion d'un administrateur sont des
opérations propres à chaque environnement ; consulter le guide du jalon 4.
Ne pas réinitialiser le projet de démonstration partagé pour les tests.

## Vérifications techniques

```bash
npm run test:cart
npm run lint
npm run build
npm run preview
```

`preview` sert le build de production, habituellement sur
`http://localhost:4173`. C'est ce serveur qu'il faut utiliser pour mesurer
les performances du build ; garder les mêmes réglages Lighthouse entre les
comparaisons. Le script `test:cart` concerne la version Supabase.

Pour les résultats, le protocole et les limites du travail d'optimisation,
consulter [l'audit avant Supabase](docs/audit/rapport.md) et son
[index des rapports](docs/audit/index.html) depuis la branche
`version/performance`.
