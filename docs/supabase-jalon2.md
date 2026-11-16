# Jalon 2 - Authentification et routes protégées

## Ce qui change

React Router remplace la navigation par useState :

| URL | Accès |
| --- | --- |
| `/` | Boutique publique |
| `/login` | Connexion e-mail / mot de passe |
| `/signup` | Inscription |
| `/account` | Session requise, message de bienvenue |
| `/orders` | Session requise, commandes toujours verrouillées par la RLS du jalon 1 |
| Autres URL | Page introuvable |

Les pages sont chargées à la demande. Le panier reste dans App pour survivre
à la navigation ; son déplacement dans Zustand appartient au jalon 3.
Les noms de pages, le focus du contenu et les liens actifs suivent l'URL.

AuthProvider utilise un Context alimenté par getSession et onAuthStateChange.
Il se désabonne au démontage et attend la première lecture avant de rendre
une route protégée : pas de redirection prématurée au rafraîchissement.
Un événement de session plus récent prime sur le résultat d'une lecture
initiale encore en vol. Le SDK Supabase gère la persistance et le renouvellement
de session ; aucun mot de passe n'est conservé par notre code.

ProtectedRoute redirige un visiteur vers `/login` et conserve le chemin
demandé dans l'état de navigation. Connexion et inscription le récupèrent,
y compris lors du passage entre les deux formulaires. La destination est
limitée à un chemin local ; les URL externes sont refusées.

Le header présente l'adresse e-mail et Déconnexion quand une session existe.
Les erreurs des formulaires et de la déconnexion sont visibles. Les requêtes
de commandes sont conditionnées par la session et leur clé inclut l'UUID
utilisateur. Le cache des commandes est supprimé lorsque l'identité change,
y compris à la déconnexion. Le catalogue public reste en cache.

## Réglages Supabase pour le test manuel

Le contrôle du projet distant a confirmé : fournisseur Email activé,
confirmation par e-mail requise. Aucun réglage distant n'a été changé.

Deux possibilités pour les tests :

- **Configuration actuelle** : utiliser une adresse dont vous pouvez lire
  les mails, confirmer l'inscription, puis se connecter. Dans Authentication
  → URL Configuration, définir le Site URL correspondant à votre serveur
  (`http://localhost:5173`) et autoriser le retour
  `http://localhost:5173/account`. Si le serveur utilise un autre port ou
  `127.0.0.1`, autoriser exactement l'origine utilisée. Le formulaire transmet
  cette URL de retour au SDK.
- **Option simplifiée du TP** : désactiver Confirm email dans les réglages
  du fournisseur Email. L'inscription crée alors directement une session.
  Ce choix est réservé à votre environnement pédagogique.

La configuration Auth est gérée par Supabase et ne nécessite aucune nouvelle
migration SQL dans ce jalon. Les migrations, les données et la RLS du jalon 1
restent inchangées. Le local fourni par config.toml accepte déjà les inscriptions
sans confirmation.

## Vérification pas à pas

1. `npm.cmd run dev`, puis ouvrir l'adresse exacte affichée par Vite.
2. Sans session, ouvrir `/account` directement : redirection vers `/login`,
   sans affichage du compte. `/orders` doit se comporter de la même manière.
3. Cliquer Créer un compte, renseigner un e-mail et un mot de passe d'au moins
   six caractères. La validation serveur peut imposer des exigences plus fortes.
4. Si la confirmation est activée, le message demande de consulter la boîte
   mail ; aucune session n'est annoncée avant confirmation. Sinon, le compte
   s'ouvre directement. L'adresse doit apparaître dans le header.
5. Ouvrir `/account` et rafraîchir avec F5 : la session reste présente, sans
   formulaire de connexion clignotant. Le mot de passe n'est jamais affiché.
6. Ouvrir une deuxième page `/account` dans un autre onglet, puis se
   déconnecter dans le premier : les deux onglets perdent l'accès protégé.
7. Ouvrir `/orders` déconnecté ; essayer un mauvais mot de passe : l'erreur
   doit être visible. Corriger le mot de passe : retour à `/orders`.
8. La liste de commandes est vide à ce stade : les policies utilisateur
   viendront au jalon 3. Ce n'est pas une erreur de connexion.
9. Revenir à la Boutique, ajouter un produit et naviguer entre les pages :
   le panier reste présent pendant la navigation (pas encore après F5).
10. Vérifier Tab, Entrée, les labels des champs, le focus visible et la
    présentation mobile. Une URL inexistante doit afficher Page introuvable.

Un hébergeur du frontend devra renvoyer index.html pour les routes SPA.
Les serveurs Vite dev et preview prennent déjà en charge les accès directs.

## Point de contrôle

La session vit dans un Context car elle est partagée et change peu souvent.
Elle ne doit pas être mise dans l'URL : l'URL décrit la navigation, pas les
identifiants de connexion. Zustand servira au panier, distinct de la session
gérée par le SDK Auth. Enfin, ProtectedRoute améliore la navigation mais ne
remplace jamais les permissions et policies RLS de la base.

Le README et `.env.local` ne sont pas modifiés par ce jalon.

## Vérifications effectuées

- `npm.cmd run lint` et `npm.cmd run build` : succès.
- Parcours Chrome automatisé contre Supabase local : inscription, accès protégé,
  retour à la page demandée, erreur de mot de passe, session après F5 sans
  affichage du formulaire, déconnexion propagée entre deux onglets et purge
  du cache des commandes. Aucun compte de test créé sur le projet distant.
- Inscription sans session : réponse simulée pour vérifier le message de
  confirmation et l'effacement du mot de passe. L'envoi réel et le clic sur
  le mail distant restent à vérifier manuellement avec votre adresse.
- Page introuvable et affichage mobile à 390 px vérifiés, sans débordement
  horizontal ni erreur JavaScript dans le parcours.

Vite signale un fichier initial de 507,37 kB minifié (146,99 kB gzip), avec
le SDK Auth et le routeur. Les pages restent dans des chunks séparés.
Ce jalon ne comprend pas de nouvelle mesure Lighthouse.
