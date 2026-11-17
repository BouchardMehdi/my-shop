# Étape 2 - Tests de composants avec React Testing Library

Vérifications du 17 novembre 2026 : 11 tests de composants ajoutés aux 14
tests unitaires de l'étape 1, soit 25 tests dans 6 fichiers.

## Fonctionnalités préparées pour les tests

- ProductCard est extrait de ProductList. Le nom, le prix, le texte alternatif,
  le stock, l'action d'ajout et la priorité de chargement des images sont conservés.
- ProductSearch présente un champ labellisé, Rechercher et Effacer la recherche.
  Entrée ou Rechercher valide le brouillon dans le paramètre `search` de l'URL.
  La saisie seule ne change pas encore le catalogue.
- Effacer retire le paramètre ; les autres paramètres sont conservés. La
  navigation utilise replace pour éviter une entrée d'historique par validation.
- Une navigation par lien ou le retour dans l'historique resynchronise le
  champ avec le filtre URL. La saisie locale est un brouillon de formulaire ;
  le filtre appliqué et partageable reste dans l'URL.

Un contrôle Chrome a révélé une perte occasionnelle de caractères quand le
champ contrôlé dépendait directement de navigations à chaque frappe. La
validation explicite sépare la saisie immédiate de la navigation. Après ce
correctif, 20 saisies rapides successives ont conservé leur valeur complète.

## Environnement des tests

`src/test/utils.tsx` fournit `renderWithProviders` :

- Un nouveau QueryClient par rendu, sans retry et avec gcTime nul pour ces
  tests. Une erreur simulée est ainsi immédiate et les caches ne sont pas partagés.
- Un MemoryRouter démarrant à l'URL demandée.
- Un AuthContext contrôlé, anonyme et initialisé par défaut. Le composant
  AuthPage est réel ; la restauration de session par AuthProvider ne fait
  pas partie de ces tests de formulaire.

Le setup commun nettoie le DOM et réinitialise le store et localStorage
entre les tests. Les composants, les hooks de requête et Zustand restent
réels. Seul le module client Supabase est remplacé pour les tests des pages :
la lecture du catalogue suit la chaîne select/order/order/abortSignal, et
la connexion utilise signInWithPassword. Les fixtures sont écrites à la main.
Aucun appel réseau Supabase n'est effectué par les tests Vitest.

Les requêtes RTL ciblent les rôles, noms accessibles, labels et textes. Aucun
sélecteur CSS ou data-testid n'est utilisé. userEvent réalise les interactions ;
findBy attend les résultats asynchrones sans temporisation arbitraire.

## Les 11 tests ajoutés

| Fichier | Nombre | Comportements |
| --- | --- | --- |
| `src/components/ProductCard.test.tsx` | 2 | Affichage et ajout réel au store ; ajout interdit pour un produit épuisé. |
| `src/pages/ShopPage.test.tsx` | 6 | Filtre initial par URL, validation de la saisie avec préservation des autres paramètres, effacement, lien et retour, aucun résultat, erreur du catalogue sans retry. |
| `src/pages/AuthPage.test.tsx` | 3 | Erreur serveur visible, e-mail manquant et mot de passe manquant bloquant l'appel. |

Chaque nouveau test a été vu rouge dans une copie temporaire des sources :
action d'ajout neutralisée, bouton épuisé activé, filtre initial ignoré,
paramètres URL perdus, paramètre vide conservé, message sans résultat altéré,
alertes de catalogue/connexion retirées, required retiré de chaque champ,
resynchronisation du brouillon désactivée. Les échecs provenaient des
assertions ou des éléments accessibles attendus, pas d'une erreur d'import.
Après restauration, la copie complète passe à 25/25. Aucune erreur volontaire
n'a été introduite dans le code de travail servi par Vite.

## Commandes de vérification

```powershell
npm.cmd test
npm.cmd test -- src/components/ProductCard.test.tsx src/pages/ShopPage.test.tsx src/pages/AuthPage.test.tsx
npm.cmd run test:watch
npm.cmd run lint
npm.cmd run build
```

La suite complète, le lint et le build passent. Le build vérifie aussi les
types TypeScript des composants, des tests et des utilitaires.

## Essai manuel

1. `npm.cmd run dev`, puis ouvrir l'URL affichée par Vite.
2. Saisir `lamp` dans Rechercher un produit ; appuyer sur Entrée ou Rechercher.
   Le paramètre `search` apparaît dans l'URL, les cartes et leur compteur filtrent.
3. Recharger : le champ et le filtre sont conservés. Essayer un texte sans
   correspondance, puis Effacer la recherche : le catalogue réapparaît.
4. Ajouter un produit en stock et vérifier le panier. Le bouton d'un produit
   épuisé reste désactivé.
5. Sur `/login`, essayer un e-mail vide puis un mot de passe vide : aucun envoi.
   Des identifiants incorrects doivent afficher l'erreur retournée par Supabase.

Un contrôle Chrome du build a validé la recherche, les autres paramètres URL,
F5, l'ajout au panier et sa persistance, l'état sans résultat, l'effacement et
la validation d'un formulaire vide. L'affichage à 390 px a été inspecté sans
débordement ni erreur JavaScript. Aucun POST ni autre écriture distante n'a
été effectué pendant ce contrôle : le catalogue a été lu uniquement.

Ce contrôle navigateur ponctuel ne constitue pas la suite Playwright du
troisième commit. La couverture et son score README restent pour l'étape 4.
Le README, les branches de référence et Supabase ne sont pas modifiés ici.
