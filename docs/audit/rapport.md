# Audit final - Maison Moderne

Date : 2026-11-16, Europe/Paris. Branche : `docs/audit-restitution`.
État initial : `054aed252099ef4decd68ad1ca847e438871f91d`. État final audité : `34415ae807b6c0aafe044c545043a9faa4920845`.
Les sources de l'application et le README n'ont pas été modifiés pour cet audit.

## Résultats à retenir

- Mobile simulé : Performance **73 → 80**, Accessibilité **95 → 100**.
- Ordinateur simulé : Performance **99 → 97**, Accessibilité **95 → 100**.
- FCP mobile : **1,567 s → 0,763 s**, soit -51,3 %.
- Le catalogue évite les deux rendus inutiles testés : **1 → 0** par interaction.
- Le CSS passe de **15,72 kB à 11,83 kB** sur l'ensemble du travail.
- Le poids transféré augmente : **486,88 kB → 1 769,88 kB** (263,5 %). Les images constituent la priorité restante.
- EcoIndex local estimé, Boutique : **86,28 / A → 80,04 / A**. La lettre reste A mais le score se dégrade ; ce n'est pas une mesure délivrée par ecoindex.fr.

## Protocole et limites

Sept états cumulés ont été exportés avec git archive puis compilés avec
Vite 8.3.2 et le même node_modules. Les source maps sont activées en mode
hidden uniquement pour l'analyse du bundle et ne sont pas téléchargées
pendant les mesures. Aucun patch ne change la vue initiale de l'application.

- Lighthouse 13.6.0, Node v22.19.0, Chrome headless 157 sur Windows.
- **21 navigations mobiles** : trois passages par état, entrelacés pour limiter l'effet de l'ordre des essais.
- **6 navigations ordinateur** : trois avant et trois après. Le profil est vérifié dans chaque fichier JSON.
- Chaque passage démarre un navigateur neuf, sans extension, cache froid.
- Mobile : 412 × 823, DPR 1,75, RTT simulé 150 ms, 1 638,4 kbit/s, CPU ×4.
- Ordinateur : configuration desktop officielle Lighthouse ; ses valeurs exactes sont dans les JSON desktop.
- Valeurs centrales : médiane calculée séparément pour chaque métrique, avec les trois passages conservés. Pas de sélection du meilleur score.
- Les rapports HTML mobiles représentent un passage proche de la médiane de score ; le numéro exact figure dans results.json (reportHtmlPass). Le rapport ordinateur représente le passage 1, pas nécessairement la médiane.
- Les images et polices anciennes étaient externes : leur serveur et le réseau réel ajoutent une variabilité. Les nouveaux fichiers sont servis localement.
- Les résultats localhost ne décrivent pas les performances d'un hébergeur en production.

Le **93 annoncé dans le test manuel de l'utilisateur** n'est pas réutilisé
comme résultat de cette série : ses réglages exacts et son rapport ne sont
pas disponibles. Il ne faut pas le comparer directement au profil mobile ici.
Sur le mobile final, les scores sont 60–80, et le LCP varie de
2,866 s à 8,269 s.

## 1. Boutique - quatre scores et métriques de navigation

| Mesure | Avant | Après |
| --- | --- | --- |
| Performance /100 | 73 | 80 |
| Plage des scores Performance | 72–74 | 60–80 |
| Accessibilité /100 | 95 | 100 |
| Bonnes pratiques /100 | 96 | 96 |
| SEO /100 | 92 | 92 |
| FCP | 1,567 s | 0,763 s |
| LCP | 3,905 s | 2,887 s |
| TBT | 0 ms | 0 ms |
| CLS | 0,279 | 0,306 |
| Speed Index | 1,567 s | 0,908 s |
| Poids transféré Lighthouse | 486,88 kB | 1 769,88 kB |
| Nombre de requêtes Lighthouse | 14 | 14 |
| JavaScript principal brut | 229,08 kB | 223,95 kB |
| CSS compilé brut | 15,72 kB | 11,83 kB |

Valeurs en kB décimaux (1 kB = 1 000 octets). Le poids Lighthouse est le
transfert réseau observé, qui peut être compressé ; les tailles du build
sont brutes. Les deux valeurs ne doivent pas être confondues.

### Comparaison ordinateur séparée

| Mesure | Avant | Après |
| --- | --- | --- |
| performance | 99 | 97 |
| accessibility | 95 | 100 |
| best-practices | 96 | 96 |
| seo | 92 | 92 |
| FCP | 0,460 s | 0,216 s |
| LCP | 0,865 s | 1,134 s |
| TBT | 0 ms | 0 ms |
| CLS | 0,057 | 0,057 |

Le score ordinateur initial est déjà très élevé. On ne peut pas présenter
le résultat global comme un gain universel de vitesse : les effets varient
selon le profil, la métrique et les ressources chargées.

## 2. Remesure après chaque étape

| Étape cumulative | Commit | Perf mobile | Plage | FCP | LCP | TBT | CLS | Transfert |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| avant | `054aed2` | 73 | 72–74 | 1,567 s | 3,905 s | 0 ms | 0,279 | 486,88 kB |
| code-splitting | `0a047c0` | 82 | 72–87 | 1,562 s | 3,948 s | 0 ms | 0,000 | 487,64 kB |
| rerenders | `af50578` | 72 | 72–76 | 1,554 s | 3,928 s | 0 ms | 0,306 | 487,67 kB |
| images | `a47dbac` | 79 | 74–80 | 1,564 s | 2,932 s | 0 ms | 0,306 | 1 771,29 kB |
| polices | `3665842` | 84 | 74–84 | 0,765 s | 2,013 s | 0 ms | 0,306 | 1 770,74 kB |
| accessibilite | `0a97aa3` | 84 | 84–84 | 0,762 s | 1,969 s | 0 ms | 0,306 | 1 771,04 kB |
| final | `34415ae` | 80 | 60–80 | 0,763 s | 2,887 s | 0 ms | 0,306 | 1 769,88 kB |

L'étape Images utilise le **commit de fusion a47dbac**, qui conserve les
optimisations React déjà intégrées. Un commit de la branche images seule
aurait supprimé ces changements de la comparaison et faussé l'interprétation.
Un changement de score entre deux étapes n'est pas une preuve suffisante de
causalité, en particulier lorsque le CLS ou le LCP varie fortement.

## 3. Commandes et contrôle des deux vues

L'application possède deux vues gérées par useState, sans URL distincte ni
React Router. L'accueil et les produits sont réunis dans la Boutique.
La structure à quatre routes décrite dans le support de cours n'est pas présente.

Commandes a été ouverte par son bouton, puis auditée en **mode snapshot**.
Ce mode contrôle l'état affiché mais ne fournit pas de FCP/LCP ni de score
Performance de navigation. Nous laissons ces valeurs **N/A**, sans fabriquer
une deuxième URL ou changer l'application pour obtenir un score.

| État | Vue | Performance snapshot | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- | --- |
| avant | boutique | N/A | 95 | 100 | 83 |
| avant | commandes | N/A | 95 | 100 | 80 |
| final | boutique | N/A | 100 | 100 | 83 |
| final | commandes | N/A | 100 | 100 | 80 |

Les scores snapshot ne sont comparables qu'entre snapshots : le jeu de
contrôles est différent de celui d'une navigation, ce qui explique notamment
les scores Bonnes pratiques et SEO différents.
Les quatre scores de navigation sur deux URL distinctes demandés par le
support ne sont donc pas entièrement disponibles avec cette architecture.

### Contrôles d'accessibilité

| Contrôle axe-core | Avant | Après |
| --- | --- | --- |
| Boutique : éléments en violation détectée | 21 | 0 |
| Commandes : éléments en violation détectée | 26 | 0 |
| Boutique : éléments à revoir manuellement (incomplete) | 12 | 11 |
| Commandes : éléments à revoir manuellement (incomplete) | 1 | 0 |

Tags testés : WCAG 2 A/AA, 2.1 AA et 2.2 AA. Les détails et sélecteurs sont
dans les fichiers axe-*.json. Les contrastes sur certains fonds d'image
restent à examiner visuellement : **100 Lighthouse ne certifie pas une
accessibilité complète**. La navigation clavier a été automatisée, mais
aucune session réelle avec NVDA ou VoiceOver n'a été réalisée.

Le test fonctionnel final confirme : lien d'évitement accessible par Tab
et Entrée ; titre et focus mis à jour lors du changement de vue ; aria-current ;
région de statut du panier ; panier conservé ; ajout, augmentation, retrait
et vidage ; six images chargées ; quatre commandes ; aucun débordement à
390 px ; aucune erreur JavaScript capturée. Le drapeau role=status est
vérifié, pas la qualité d'une annonce réellement écoutée avec un lecteur d'écran.

## 4. Fiche des corrections et gains constatés

| Axe | Constat | Correction | Preuve / gain ou absence de gain |
| --- | --- | --- | --- |
| Code-splitting | Un seul fichier JS embarquait les deux vues | React.lazy et Suspense | JS principal : 229,08 kB → 223,39 kB ; 1 → 3 fichiers JS. Commandes absent du réseau initial, demandé à son ouverture. |
| Re-renders | Le catalogue se recalculait lors des changements du panier | useReducer, useCallback et memo ciblé | Ajout et augmentation de quantité : 1 → 0 rendu validé de ProductList ; résultat toujours présent dans la version finale. TBT médian déjà à 0 ms : aucun gain TBT revendiqué. |
| Images | Images distantes, sans attributs de chargement | WebP locaux, width/height, eager/lazy, decoding async | Les six images sont présentes et décodées ; 1 eager et 5 lazy. Régression du transfert : 487,67 kB → 1 771,29 kB. La conversion seule ne constitue pas un gain de poids. |
| Polices | Feuille CSS Google Fonts et connexions externes | Deux WOFF2 locaux, swap, preload de Fraunces | FCP médian : 1,564 s → 0,765 s. Deux fichiers de police conservés, preload non dupliqué ; le fichier variable était déjà partagé entre les graisses avant. |
| Contrastes | Textes gris et logo insuffisamment contrastés | --muted et --coral assombris | Occurrences signalées par axe : Boutique 21 → 0, Commandes 26 → 0. Accessibilité Lighthouse : 95 → 100. |
| Évitement au clavier | Pas de raccourci pour sauter l’en-tête | Lien Aller au contenu principal | Absent → présent ; Tab puis Entrée place bien le focus sur main. |
| Changement de vue | Titre inchangé, focus sur le bouton de navigation | Titre dynamique, focus main, aria-current | Les trois contrôles passent de faux à vrai dans functional-avant/final.json. |
| Annonces du panier | Aucune région dédiée aux mises à jour | role=status et aria-atomic | Région absente → présente ; compteur, ajout, retrait et vidage vérifiés. La lecture effective avec NVDA reste à confirmer. |
| CSS superflu | Styles du starter et déclarations inutilisées | Suppression du CSS hors interface | CSS brut : 16,23 kB → 11,83 kB (-27,1 %). |
| Animations automatiques | Apparitions des blocs, zoom des images et délais par commande | Suppression des animations et des délais | Aucune animation d’apparition restante ; suppression du zoom au survol. Les transitions utiles des boutons restent présentes. |

Cette liste contient plus de cinq corrections, dont au moins trois en
accessibilité ou éco-conception. Les gains défavorables et nuls sont conservés.
Les types et les scripts de build doivent rester valides après l'intégration
du commit de documentation ; aucune modification applicative ne fait partie
de cet audit.

## 5. EcoIndex - estimation locale documentée

| Scénario | État | DOM | Requêtes | Poids EcoIndex | Score estimé | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Boutique | avant | 149 | 14 | 487,34 kB | 86,28 | A |
| Boutique | final | 152 | 14 | 1 770,60 kB | 80,04 | A |
| Parcours Commandes | avant | 105 | 15 | 488,61 kB | 87,45 | A |
| Parcours Commandes | final | 108 | 9 | 184,81 kB | 89,62 | A |

Chaque scénario a été exécuté trois fois à 1920 × 1080, cache désactivé :
chargement, attente de 3 secondes, défilement en bas, attente de 3 secondes.
Pour Commandes, le scénario comprend l'ouverture de la Boutique puis le clic
sur Commandes dès que la navigation est disponible ; il ne représente pas
un chargement direct de Commandes. Les ressources de la Boutique peuvent
donc être partiellement téléchargées avant ce clic.

Le poids retenu est la somme des encodedDataLength des requêtes HTTP terminées,
plus la taille du document HTML selon la méthode publiée. Les deux composantes
sont conservées séparément dans les JSON. Le DOM compte les éléments, sans
les descendants internes des SVG. Les échecs HTTP, dont le favicon 404,
restent visibles dans les enregistrements. Les tailles sont passées en Kio
(octets / 1024) au calcul ; ce poids diffère de celui de Lighthouse.

L'algorithme utilisé est le paquet du collectif **ecoindex 2.0.1**, référence
**ecoindex_reference 1.0.2**. C'est une **estimation locale**, pas un rapport
émis par le service ecoindex.fr ou son extension. La collecte Puppeteer et
le parcours Commandes peuvent produire un résultat différent du service.
Les résultats ne sont pas des émissions carbone mesurées et aucune valeur
CO2 ou eau n'est revendiquée.

Sources et attribution : [méthode EcoIndex.fr](https://www.ecoindex.fr/comment-ca-marche/)
et [calculateur du collectif cnumr](https://github.com/cnumr/ecoindex_js).
La méthode et ses résultats sont à usage non commercial, sous les conditions
de la licence CC-BY-NC-ND indiquées par ces projets.

## 6. Points restant à traiter après l'audit

### Priorité 1 - Poids et dimensions des images

| Fichier | Dimensions réelles | Poids brut |
| --- | --- | --- |
| bougie.webp | 900 × 1350 | 426,82 kB |
| canape.webp | 900 × 600 | 284,21 kB |
| lampe.webp | 900 × 1350 | 93,26 kB |
| sejour.webp | 900 × 675 | 434,69 kB |
| sejour2.webp | 900 × 475 | 327,76 kB |
| tasse.webp | 600 × 400 | 19,10 kB |

Total : **1 585,83 kB**.
Cinq fichiers mesurent 900 px de large ; les attributs HTML du catalogue
sont pourtant fixés à 600 × 400 pour tous. Le conteneur CSS réserve une
place, mais ces attributs ne décrivent pas toujours le ratio réel des fichiers.
Vérifier aussi la correspondance des photos aux produits : certaines scènes
de salon illustrent des objets particuliers.

Le rapport mobile final estime environ **1 411 Kio d'images économisables**.
Il s'agit d'une estimation Lighthouse, pas d'une économie déjà réalisée.
Une vraie compression, des dimensions adaptées et des variantes responsives
restent à examiner avant d'affirmer que l'axe Images réduit le poids.

### Priorité 2 - Stabilité du contenu pendant le chargement

Le CLS médian final est **0,306**. Le rapport représentatif
identifie surtout le panneau panier et le pied de page parmi les éléments
déplacés. Le catalogue arrive de façon asynchrone et change la hauteur du
contenu ; cela mérite un diagnostic complémentaire de l'espace réservé et
des états de chargement. Les polices peuvent aussi changer la disposition,
mais leur responsabilité exacte n'est pas démontrée par cette mesure.

### Priorité 3 - Découverte du LCP et détails restants

La première image est bien eager ; Lighthouse note toutefois sa découverte
après JavaScript/JSON et l'absence d'indication fetchpriority=high. Un éventuel
préchargement doit être justifié par une nouvelle mesure, pas ajouté à toutes
les images. Une requête /favicon.ico échoue avec 404 dans les deux versions.
Les contrôles SEO et l'absence de véritables routes restent à revoir selon
le périmètre demandé par le professeur. Le contrôle SEO signale notamment
un robots.txt non valide : aucun fichier robots.txt n'est présent et le
serveur de prévisualisation renvoie le document HTML de l'application.

## 7. Preuves et reproduction

- [Données consolidées](results.json), [tests complémentaires](checks.json).
- Navigation mobile représentative : [avant](lighthouse-avant.html), [après](lighthouse-final.html).
- Navigation ordinateur, passage 1 : [avant](desktop-avant.html), [après](desktop-final.html).
- Commandes snapshot : [avant](snapshot-avant-commandes.html), [après](snapshot-final-commandes.html).
- Graphiques source-map-explorer : [avant](bundle-avant.html), [après](bundle-final.html).
- Les exports bundle-*.json identifient les poids par source. Le runtime React DOM
  reste la plus grosse part du JavaScript ; le découpage ne peut éliminer ce
  runtime requis par la Boutique. L'option --no-border-checks a été utilisée
  pour lire les source maps produites par Rolldown.
- Captures des deux vues avant/après : fichiers avant-*.png et final-*.png.

Installer les outils hors du projet, puis lancer depuis la racine (PowerShell) :

```powershell
npm.cmd install --prefix "$env:TEMP/my-shop-audit-tools" --ignore-scripts --no-audit --no-fund lighthouse@13.6.0 puppeteer-core@25.17.0 source-map-explorer@2.5.3 ecoindex@2.0.1
node scripts/audit-performance.mjs
node scripts/write-audit.mjs
```

CHROME_PATH et AUDIT_TOOLS_DIR permettent de changer les chemins locaux.
AUDIT_RUNS vaut 3 pour cette série ; la génération de cette fiche exige les
trois passages. Les résultats d'un nouveau passage peuvent différer.
Le fichier images.json contient les dimensions intrinsèques relevées dans
les fichiers WebP audités. Le script ne modifie ni les sources, ni le README,
ni package.json, ni package-lock.json. La fiche du cours n'ayant pas été
fournie, ce document en reprend les rubriques utiles et explicite les écarts.

## Texte de restitution utilisable dans Gamma

« Notre premier affichage mobile passe de 1,567 s à
0,763 s, et les corrections de contraste font passer
l'accessibilité de 95 à 100. Le catalogue ne se re-rend plus lors des deux
interactions panier testées, mais les nouvelles images augmentent le poids
total à 1 769,88 kB : leur compression reste notre
principale piste d'amélioration. »

La diapo elle-même n'est pas créée ici : elle sera préparée sur Gamma.
