import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'docs/audit')
const load = async name => JSON.parse(await readFile(path.join(out, name), 'utf8'))
const r = await load('results.json')
const images = await load('images.json')
assert.equal(r.versions.length, 7)
assert(r.versions.every(v => v.samples.length === 3))
assert.equal(r.checks.desktop.length, 6)
assert(r.checks.desktop.every(s => s.settings.formFactor === 'desktop'))
assert.equal(r.checks.ecoindex.length, 12)
const median = values => {
  const a = [...values].sort((x, y) => x - y)
  const i = Math.floor(a.length / 2)
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2
}
const n = (x, digits = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const kb = x => `${n(x / 1000, 2)} kB`
const seconds = x => `${n(x / 1000, 3)} s`
const m = (v, key) => median(v.samples.map(s => s[key]))
const score = (v, key) => median(v.samples.map(s => s.scores[key]))
const before = r.versions[0]
const final = r.versions.at(-1)
const table = (headings, rows) => `| ${headings.join(' | ')} |\n| ${headings.map(() => '---').join(' | ')} |\n${rows.map(row => '| ' + row.join(' | ') + ' |').join('\n')}`
const desktop = name => r.checks.desktop.filter(s => s.version === name)
const d = (name, key) => median(desktop(name).map(s => s[key]))
const ds = (name, key) => median(desktop(name).map(s => s.scores[key]))
const range = v => `${Math.min(...v.samples.map(s => s.scores.performance))}–${Math.max(...v.samples.map(s => s.scores.performance))}`
const bundle = (v, extension, principal = false) => v.bundles.filter(b => b.file.endsWith(extension) && (!principal || b.file.startsWith('index-'))).reduce((sum, b) => sum + b.bytes, 0)
const percent = (oldValue, newValue) => `${n((newValue - oldValue) / oldValue * 100, 1)} %`
const axe = {}
for (const version of ['avant', 'final']) {
  for (const view of ['boutique', 'commandes']) axe[`${version}-${view}`] = await load(`axe-${version}-${view}.json`)
}
const violatedNodes = key => axe[key].violations.reduce((sum, violation) => sum + violation.nodes.length, 0)
const incompleteNodes = key => axe[key].incomplete.reduce((sum, violation) => sum + violation.nodes.length, 0)
const eco = (version, view, key) => median(r.checks.ecoindex.filter(s => s.version === version && s.view === view).map(s => s[key]))
const finalFunction = r.checks.functional.find(s => s.version === 'final')
assert(finalFunction.skipLinkWorks && finalFunction.cartPersists && finalFunction.mobileNoOverflow)

const mobileRows = [
  ['Performance /100', score(before, 'performance'), score(final, 'performance')],
  ['Plage des scores Performance', range(before), range(final)],
  ['Accessibilité /100', score(before, 'accessibility'), score(final, 'accessibility')],
  ['Bonnes pratiques /100', score(before, 'best-practices'), score(final, 'best-practices')],
  ['SEO /100', score(before, 'seo'), score(final, 'seo')],
  ['FCP', seconds(m(before, 'fcpMs')), seconds(m(final, 'fcpMs'))],
  ['LCP', seconds(m(before, 'lcpMs')), seconds(m(final, 'lcpMs'))],
  ['TBT', `${n(m(before, 'tbtMs'))} ms`, `${n(m(final, 'tbtMs'))} ms`],
  ['CLS', n(m(before, 'cls'), 3), n(m(final, 'cls'), 3)],
  ['Speed Index', seconds(m(before, 'speedIndexMs')), seconds(m(final, 'speedIndexMs'))],
  ['Poids transféré Lighthouse', kb(m(before, 'transferredBytes')), kb(m(final, 'transferredBytes'))],
  ['Nombre de requêtes Lighthouse', median(before.samples.map(s => s.requests.length)), median(final.samples.map(s => s.requests.length))],
  ['JavaScript principal brut', kb(bundle(before, '.js', true)), kb(bundle(final, '.js', true))],
  ['CSS compilé brut', kb(bundle(before, '.css')), kb(bundle(final, '.css'))],
]
const stages = r.versions.map(v => [v.name, `\`${v.sha.slice(0, 7)}\``, score(v, 'performance'), range(v), seconds(m(v, 'fcpMs')), seconds(m(v, 'lcpMs')), `${n(m(v, 'tbtMs'))} ms`, n(m(v, 'cls'), 3), kb(m(v, 'transferredBytes'))])
const ecoRows = []
for (const view of ['boutique', 'commandes']) {
  for (const version of ['avant', 'final']) {
    const s = r.checks.ecoindex.find(s => s.version === version && s.view === view)
    ecoRows.push([view === 'boutique' ? 'Boutique' : 'Parcours Commandes', version, eco(version, view, 'dom'), eco(version, view, 'requests'), kb(eco(version, view, 'bytes')), n(eco(version, view, 'score'), 2), s.grade])
  }
}
const proofRows = [
  ['Code-splitting', 'Un seul fichier JS embarquait les deux vues', 'React.lazy et Suspense', `JS principal : ${kb(bundle(before, '.js', true))} → ${kb(bundle(r.versions[1], '.js', true))} ; 1 → 3 fichiers JS. Commandes absent du réseau initial, demandé à son ouverture.`],
  ['Re-renders', 'Le catalogue se recalculait lors des changements du panier', 'useReducer, useCallback et memo ciblé', 'Ajout et augmentation de quantité : 1 → 0 rendu validé de ProductList ; résultat toujours présent dans la version finale. TBT médian déjà à 0 ms : aucun gain TBT revendiqué.'],
  ['Images', 'Images distantes, sans attributs de chargement', 'WebP locaux, width/height, eager/lazy, decoding async', `Les six images sont présentes et décodées ; 1 eager et 5 lazy. Régression du transfert : ${kb(m(r.versions[2], 'transferredBytes'))} → ${kb(m(r.versions[3], 'transferredBytes'))}. La conversion seule ne constitue pas un gain de poids.`],
  ['Polices', 'Feuille CSS Google Fonts et connexions externes', 'Deux WOFF2 locaux, swap, preload de Fraunces', `FCP médian : ${seconds(m(r.versions[3], 'fcpMs'))} → ${seconds(m(r.versions[4], 'fcpMs'))}. Deux fichiers de police conservés, preload non dupliqué ; le fichier variable était déjà partagé entre les graisses avant.`],
  ['Contrastes', 'Textes gris et logo insuffisamment contrastés', '--muted et --coral assombris', `Occurrences signalées par axe : Boutique ${violatedNodes('avant-boutique')} → ${violatedNodes('final-boutique')}, Commandes ${violatedNodes('avant-commandes')} → ${violatedNodes('final-commandes')}. Accessibilité Lighthouse : 95 → 100.`],
  ['Évitement au clavier', 'Pas de raccourci pour sauter l’en-tête', 'Lien Aller au contenu principal', 'Absent → présent ; Tab puis Entrée place bien le focus sur main.'],
  ['Changement de vue', 'Titre inchangé, focus sur le bouton de navigation', 'Titre dynamique, focus main, aria-current', 'Les trois contrôles passent de faux à vrai dans functional-avant/final.json.'],
  ['Annonces du panier', 'Aucune région dédiée aux mises à jour', 'role=status et aria-atomic', 'Région absente → présente ; compteur, ajout, retrait et vidage vérifiés. La lecture effective avec NVDA reste à confirmer.'],
  ['CSS superflu', 'Styles du starter et déclarations inutilisées', 'Suppression du CSS hors interface', `CSS brut : ${kb(bundle(r.versions[5], '.css'))} → ${kb(bundle(final, '.css'))} (${percent(bundle(r.versions[5], '.css'), bundle(final, '.css'))}).`],
  ['Animations automatiques', 'Apparitions des blocs, zoom des images et délais par commande', 'Suppression des animations et des délais', 'Aucune animation d’apparition restante ; suppression du zoom au survol. Les transitions utiles des boutons restent présentes.'],
]
const snapshots = r.snapshots.map(s => [s.version, s.view, 'N/A', s.scores.accessibility, s.scores['best-practices'], s.scores.seo])
const report = `# Audit final - Maison Moderne

Date : ${r.date}, Europe/Paris. Branche : \`docs/audit-restitution\`.
État initial : \`${before.sha}\`. État final audité : \`${final.sha}\`.
Les sources de l'application et le README n'ont pas été modifiés pour cet audit.

## Résultats à retenir

- Mobile simulé : Performance **${score(before, 'performance')} → ${score(final, 'performance')}**, Accessibilité **95 → 100**.
- Ordinateur simulé : Performance **${ds('avant', 'performance')} → ${ds('final', 'performance')}**, Accessibilité **95 → 100**.
- FCP mobile : **${seconds(m(before, 'fcpMs'))} → ${seconds(m(final, 'fcpMs'))}**, soit ${percent(m(before, 'fcpMs'), m(final, 'fcpMs'))}.
- Le catalogue évite les deux rendus inutiles testés : **1 → 0** par interaction.
- Le CSS passe de **${kb(bundle(before, '.css'))} à ${kb(bundle(final, '.css'))}** sur l'ensemble du travail.
- Le poids transféré augmente : **${kb(m(before, 'transferredBytes'))} → ${kb(m(final, 'transferredBytes'))}** (${percent(m(before, 'transferredBytes'), m(final, 'transferredBytes'))}). Les images constituent la priorité restante.
- EcoIndex local estimé, Boutique : **${n(eco('avant', 'boutique', 'score'), 2)} / A → ${n(eco('final', 'boutique', 'score'), 2)} / A**. La lettre reste A mais le score se dégrade ; ce n'est pas une mesure délivrée par ecoindex.fr.

## Protocole et limites

Sept états cumulés ont été exportés avec git archive puis compilés avec
Vite 8.3.2 et le même node_modules. Les source maps sont activées en mode
hidden uniquement pour l'analyse du bundle et ne sont pas téléchargées
pendant les mesures. Aucun patch ne change la vue initiale de l'application.

- Lighthouse ${before.samples[0].lighthouseVersion}, Node ${r.node}, Chrome headless 157 sur Windows.
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
Sur le mobile final, les scores sont ${range(final)}, et le LCP varie de
${seconds(Math.min(...final.samples.map(s => s.lcpMs)))} à ${seconds(Math.max(...final.samples.map(s => s.lcpMs)))}.

## 1. Boutique - quatre scores et métriques de navigation

${table(['Mesure', 'Avant', 'Après'], mobileRows)}

Valeurs en kB décimaux (1 kB = 1 000 octets). Le poids Lighthouse est le
transfert réseau observé, qui peut être compressé ; les tailles du build
sont brutes. Les deux valeurs ne doivent pas être confondues.

### Comparaison ordinateur séparée

${table(['Mesure', 'Avant', 'Après'], [
  ...['performance', 'accessibility', 'best-practices', 'seo'].map(key => [key, ds('avant', key), ds('final', key)]),
  ['FCP', seconds(d('avant', 'fcpMs')), seconds(d('final', 'fcpMs'))],
  ['LCP', seconds(d('avant', 'lcpMs')), seconds(d('final', 'lcpMs'))],
  ['TBT', `${n(d('avant', 'tbtMs'))} ms`, `${n(d('final', 'tbtMs'))} ms`],
  ['CLS', n(d('avant', 'cls'), 3), n(d('final', 'cls'), 3)],
])}

Le score ordinateur initial est déjà très élevé. On ne peut pas présenter
le résultat global comme un gain universel de vitesse : les effets varient
selon le profil, la métrique et les ressources chargées.

## 2. Remesure après chaque étape

${table(['Étape cumulative', 'Commit', 'Perf mobile', 'Plage', 'FCP', 'LCP', 'TBT', 'CLS', 'Transfert'], stages)}

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

${table(['État', 'Vue', 'Performance snapshot', 'Accessibilité', 'Bonnes pratiques', 'SEO'], snapshots)}

Les scores snapshot ne sont comparables qu'entre snapshots : le jeu de
contrôles est différent de celui d'une navigation, ce qui explique notamment
les scores Bonnes pratiques et SEO différents.
Les quatre scores de navigation sur deux URL distinctes demandés par le
support ne sont donc pas entièrement disponibles avec cette architecture.

### Contrôles d'accessibilité

${table(['Contrôle axe-core', 'Avant', 'Après'], [
  ['Boutique : éléments en violation détectée', violatedNodes('avant-boutique'), violatedNodes('final-boutique')],
  ['Commandes : éléments en violation détectée', violatedNodes('avant-commandes'), violatedNodes('final-commandes')],
  ['Boutique : éléments à revoir manuellement (incomplete)', incompleteNodes('avant-boutique'), incompleteNodes('final-boutique')],
  ['Commandes : éléments à revoir manuellement (incomplete)', incompleteNodes('avant-commandes'), incompleteNodes('final-commandes')],
])}

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

${table(['Axe', 'Constat', 'Correction', 'Preuve / gain ou absence de gain'], proofRows)}

Cette liste contient plus de cinq corrections, dont au moins trois en
accessibilité ou éco-conception. Les gains défavorables et nuls sont conservés.
Les types et les scripts de build doivent rester valides après l'intégration
du commit de documentation ; aucune modification applicative ne fait partie
de cet audit.

## 5. EcoIndex - estimation locale documentée

${table(['Scénario', 'État', 'DOM', 'Requêtes', 'Poids EcoIndex', 'Score estimé', 'Note'], ecoRows)}

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

${table(['Fichier', 'Dimensions réelles', 'Poids brut'], images.map(image => [image.file, `${image.naturalWidth} × ${image.naturalHeight}`, kb(image.bytes)]))}

Total : **${kb(images.reduce((sum, image) => sum + image.bytes, 0))}**.
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

Le CLS médian final est **${n(m(final, 'cls'), 3)}**. Le rapport représentatif
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

\`\`\`powershell
npm.cmd install --prefix "$env:TEMP/my-shop-audit-tools" --ignore-scripts --no-audit --no-fund lighthouse@13.6.0 puppeteer-core@25.17.0 source-map-explorer@2.5.3 ecoindex@2.0.1
node scripts/audit-performance.mjs
node scripts/write-audit.mjs
\`\`\`

CHROME_PATH et AUDIT_TOOLS_DIR permettent de changer les chemins locaux.
AUDIT_RUNS vaut 3 pour cette série ; la génération de cette fiche exige les
trois passages. Les résultats d'un nouveau passage peuvent différer.
Le fichier images.json contient les dimensions intrinsèques relevées dans
les fichiers WebP audités. Le script ne modifie ni les sources, ni le README,
ni package.json, ni package-lock.json. La fiche du cours n'ayant pas été
fournie, ce document en reprend les rubriques utiles et explicite les écarts.

## Texte de restitution utilisable dans Gamma

« Notre premier affichage mobile passe de ${seconds(m(before, 'fcpMs'))} à
${seconds(m(final, 'fcpMs'))}, et les corrections de contraste font passer
l'accessibilité de 95 à 100. Le catalogue ne se re-rend plus lors des deux
interactions panier testées, mais les nouvelles images augmentent le poids
total à ${kb(m(final, 'transferredBytes'))} : leur compression reste notre
principale piste d'amélioration. »

La diapo elle-même n'est pas créée ici : elle sera préparée sur Gamma.
`
await writeFile(path.join(out, 'rapport.md'), report)

// A readable, offline index for the audit evidence; it is not the slide deck.
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const htmlTable = (heads, rows) => `<table><thead><tr>${heads.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((value, i) => i ? `<td>${escape(value)}</td>` : `<th scope="row">${escape(value)}</th>`).join('')}</tr>`).join('')}</tbody></table>`
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Audit final - Maison Moderne</title><style>body{font:17px/1.55 system-ui,sans-serif;color:#202925;background:#fffefa;margin:0}main{max-width:1150px;margin:auto;padding:40px 24px}h1{font-size:2.4rem;line-height:1.15}h2{margin-top:2.2rem}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #d8ddd5}thead{background:#edf2e9}a{color:#235c42}p{max-width:85ch}.scroll{overflow-x:auto}li{margin:6px 0}a:focus-visible{outline:3px solid #b94f3d;outline-offset:3px}</style></head><body><main>
<h1>Audit final de Maison Moderne</h1><p>${escape(r.date)} · Comparaison ${escape(before.sha.slice(0, 7))} / ${escape(final.sha.slice(0, 7))} · <a href="rapport.md">Fiche d'audit complète</a></p>
<p>Les mesures portent sur les builds de production, avec trois passages par version. Les scores ci-dessous sont des médianes. Le profil mobile simulé et le profil ordinateur restent séparés.</p>
<h2>Boutique : avant / après en mobile</h2><div class="scroll">${htmlTable(['Mesure','Avant','Après'],mobileRows)}</div>
<h2>Ordinateur</h2><p>Performance : <strong>${ds('avant','performance')} → ${ds('final','performance')}</strong>. Accessibilité : <strong>95 → 100</strong>. Le résultat manuel à 93 ne fait pas partie de ce protocole.</p>
<h2>Gains et points à poursuivre</h2><ul><li>Catalogue : 1 → 0 rendu validé par ajout et augmentation de quantité.</li><li>Accessibilité : ${violatedNodes('avant-boutique')} → 0 éléments en violation détectée sur Boutique, ${violatedNodes('avant-commandes')} → 0 sur Commandes. ${incompleteNodes('final-boutique')} éléments restent à revoir manuellement pour leur contraste sur Boutique.</li><li>CSS compilé : ${kb(bundle(before,'.css'))} → ${kb(bundle(final,'.css'))}.</li><li>Poids total transféré en hausse : ${kb(m(before,'transferredBytes'))} → ${kb(m(final,'transferredBytes'))}. Les images totalisent ${kb(images.reduce((sum,image)=>sum+image.bytes,0))}.</li><li>CLS final : ${n(m(final,'cls'),3)} ; un diagnostic complémentaire du chargement du catalogue reste utile.</li></ul>
<h2>EcoIndex estimé localement</h2><div class="scroll">${htmlTable(['Scénario','État','DOM','Requêtes','Poids','Score','Note'],ecoRows)}</div><p>Algorithme ecoindex 2.0.1, mesure Puppeteer documentée dans la fiche. Ce n'est pas un résultat délivré par ecoindex.fr. Le parcours Commandes inclut l'ouverture de la Boutique.</p>
<h2>Rapports consultables</h2><ul><li>Mobile : <a href="lighthouse-avant.html">avant</a> / <a href="lighthouse-final.html">après</a></li><li>Ordinateur, passage 1 : <a href="desktop-avant.html">avant</a> / <a href="desktop-final.html">après</a></li><li>Commandes snapshot : <a href="snapshot-avant-commandes.html">avant</a> / <a href="snapshot-final-commandes.html">après</a>. Pas de score Performance de navigation pour cette vue sans URL propre.</li><li>Bundle : <a href="bundle-avant.html">avant</a> / <a href="bundle-final.html">après</a></li><li><a href="results.json">Données consolidées</a> · <a href="checks.json">Tests complémentaires</a></li></ul>
<p>Le README et les sources de l'application sont inchangés par cet audit. La diapo sera préparée séparément sur Gamma.</p></main></body></html>`
await writeFile(path.join(out, 'index.html'), html)
console.log('Audit report written: docs/audit/rapport.md and docs/audit/index.html')
