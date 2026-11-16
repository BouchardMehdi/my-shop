import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build, createServer, preview } from 'vite'
import react from '@vitejs/plugin-react'

// Tools live outside the project so its dependencies and lockfile stay unchanged.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const toolsDir = process.env.AUDIT_TOOLS_DIR ?? path.join(tmpdir(), 'my-shop-audit-tools')
const toolRequire = createRequire(path.join(toolsDir, 'package.json'))
const { default: lighthouse, snapshot } = await import(pathToFileURL(toolRequire.resolve('lighthouse')))
const { default: puppeteer } = await import(pathToFileURL(toolRequire.resolve('puppeteer-core')))
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const out = path.join(root, 'docs/audit')
const staging = await mkdtemp(path.join(tmpdir(), 'my-shop-audit-'))
const runs = Number(process.env.AUDIT_RUNS ?? 3)
assert(Number.isInteger(runs) && runs >= 1)
await mkdir(out, { recursive: true })

const versions = [
  { name: 'avant', ref: '054aed2' },
  { name: 'code-splitting', ref: '0a047c0' },
  { name: 'rerenders', ref: 'af50578' },
  { name: 'images', ref: 'a47dbac' },
  { name: 'polices', ref: '3665842' },
  { name: 'accessibilite', ref: '0a97aa3' },
  { name: 'final', ref: '34415ae' },
]
const manifest = { date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date()), node: process.version, runs, page: 'Boutique', versions: [] }
const launch = () => puppeteer.launch({
  executablePath: chrome,
  headless: true,
  pipe: true,
  args: ['--no-sandbox', '--disable-extensions', '--disable-gpu', '--no-first-run'],
})
const servers = []
const saveManifest = () => writeFile(path.join(out, 'results.json'), JSON.stringify({
  ...manifest, versions: versions.map(({ dir: _temporaryPath, ...version }) => version),
}, null, 2) + '\n')
const median = values => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

try {
  for (const [index, version] of versions.entries()) {
    version.sha = execFileSync('git', ['rev-parse', version.ref], { cwd: root, encoding: 'utf8' }).trim()
    version.dir = path.join(staging, version.name)
    await mkdir(version.dir)
    const zip = path.join(staging, version.name + '.zip')
    execFileSync('git', ['archive', '--format=zip', `--output=${zip}`, version.sha], { cwd: root })
    execFileSync('python', ['-m', 'zipfile', '-e', zip, version.dir])
    await symlink(path.join(root, 'node_modules'), path.join(version.dir, 'node_modules'), 'junction')
    await build({ root: version.dir, configFile: false, plugins: [react()], build: { sourcemap: 'hidden' } })
    const assetsDir = path.join(version.dir, 'dist/assets')
    version.bundles = []
    for (const file of await readdir(assetsDir)) {
      if (!/\.(js|css)$/.test(file)) continue
      const data = await readFile(path.join(assetsDir, file))
      version.bundles.push({ file, bytes: data.length, gzipBytes: gzipSync(data).length })
    }
    const server = await preview({ root: version.dir, configFile: false, preview: { host: '127.0.0.1', port: 4200 + index, strictPort: true } })
    servers.push(server.httpServer)
    version.url = `http://127.0.0.1:${4200 + index}/`
    version.samples = []
    // The standalone HTML treemap is generated in the snapshot, with relative paths.
    const sme = path.join(toolsDir, 'node_modules/source-map-explorer/bin/cli.js')
    try {
      const graph = execFileSync(process.execPath, [sme, 'dist/assets/*.js', '--no-border-checks', '--html'], { cwd: version.dir, encoding: 'utf8' })
      const normalize = text => text.replace(/(?:\.\.\/)+OneDrive\/[^"\n]*?\/node_modules\//g, 'node_modules/').replaceAll('../../src/', 'src/').replace(/^[ \t]+(?=\r?$)/gm, '').trimEnd() + '\n'
      await writeFile(path.join(out, `bundle-${version.name}.html`), normalize(graph))
      const json = execFileSync(process.execPath, [sme, 'dist/assets/*.js', '--no-border-checks', '--json'], { cwd: version.dir, encoding: 'utf8' })
      await writeFile(path.join(out, `bundle-${version.name}.json`), normalize(json))
    } catch (error) {
      version.bundleAnalysisError = String(error.stderr ?? error.message)
    }
  }

  for (let pass = 1; pass <= runs; pass++) {
    for (const version of versions) {
      const browser = await launch()
      try {
        const page = await browser.newPage()
        const result = await lighthouse(version.url, {
          logLevel: 'error', output: 'html', locale: 'fr',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        }, undefined, page)
        const lhr = result.lhr
        assert(!lhr.runtimeError, JSON.stringify(lhr.runtimeError))
        const metric = id => lhr.audits[id].numericValue
        const sample = {
          pass, fetchTime: lhr.fetchTime, lighthouseVersion: lhr.lighthouseVersion,
          browser: lhr.environment.hostUserAgent,
          settings: lhr.configSettings,
          scores: Object.fromEntries(Object.entries(lhr.categories).map(([id, value]) => [id, value.score * 100])),
          fcpMs: metric('first-contentful-paint'), lcpMs: metric('largest-contentful-paint'),
          tbtMs: metric('total-blocking-time'), cls: metric('cumulative-layout-shift'),
          speedIndexMs: metric('speed-index'), transferredBytes: metric('total-byte-weight'),
          requests: lhr.audits['network-requests'].details.items,
          warnings: lhr.runWarnings,
        }
        version.samples.push(sample)
        await writeFile(path.join(out, `lighthouse-${version.name}-${pass}.json`), JSON.stringify(sample, null, 2) + '\n')
        await writeFile(path.join(staging, `${version.name}-${pass}.html`), result.report.replace(/^[ \t]+(?=\r?$)/gm, ''))
        await saveManifest()
        console.log(JSON.stringify({ version: version.name, pass, scores: sample.scores, fcpMs: sample.fcpMs, lcpMs: sample.lcpMs, tbtMs: sample.tbtMs, warnings: sample.warnings }))
      } finally { await browser.close() }
    }
  }

  for (const version of versions) {
    const centralScore = median(version.samples.map(sample => sample.scores.performance))
    const centralLcp = median(version.samples.map(sample => sample.lcpMs))
    const selected = [...version.samples].sort((a, b) => Math.abs(a.scores.performance - centralScore) - Math.abs(b.scores.performance - centralScore) || Math.abs(a.lcpMs - centralLcp) - Math.abs(b.lcpMs - centralLcp))[0]
    version.reportHtmlPass = selected.pass
    await writeFile(path.join(out, `lighthouse-${version.name}.html`), await readFile(path.join(staging, `${version.name}-${selected.pass}.html`)))
  }

  // Confirm the production network boundary, and the existing cart behavior.
  const browser = await launch()
  try {
    const page = await browser.newPage()
    const requests = []
    page.on('request', request => requests.push(request.url()))
    await page.goto(versions.at(-1).url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.product-card')
    const beforeOrders = requests.filter(url => /OrdersPage-.*\.js/.test(url))
    assert.equal(beforeOrders.length, 0)
    await page.click('.add-button:not(:disabled)')
    await page.waitForFunction(() => document.querySelector('.cart-count').textContent === '1')
    await page.click('.main-nav button:nth-child(2)')
    await page.waitForSelector('.order-row')
    const orders = await page.$$eval('.order-row', rows => rows.length)
    assert(requests.some(url => /OrdersPage-.*\.js/.test(url)))
    await page.click('.main-nav button:first-child')
    await page.waitForSelector('.cart-line')
    assert.equal(await page.$eval('.cart-count', el => el.textContent), '1')
    manifest.functional = { products: await page.$$eval('.product-card', rows => rows.length), orders, ordersChunkDeferred: true, cartPersistsAcrossViews: true }
  } finally { await browser.close() }

  // Reproduce the React render count with development fibers on both commits.
  manifest.react = []
  for (const version of [versions[1], versions[2], versions.at(-1)]) {
    const dev = await createServer({ root: version.dir, configFile: false, plugins: [react()], server: { host: '127.0.0.1', port: 5190, strictPort: true } })
    await dev.listen()
    const browser = await launch()
    try {
      const page = await browser.newPage()
      await page.evaluateOnNewDocument(() => {
        window.__catalogCommits = 0
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
          supportsFiber: true, renderers: new Map(),
          inject(renderer) { this.renderers.set(1, renderer); return 1 },
          onCommitFiberRoot(_id, root) {
            const visit = fiber => {
              if (!fiber) return
              if (fiber.type?.name === 'ProductList' && (fiber.flags & 1)) window.__catalogCommits++
              visit(fiber.child); visit(fiber.sibling)
            }
            visit(root.current)
          },
          onCommitFiberUnmount() {},
        }
      })
      await page.goto('http://127.0.0.1:5190/', { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('.product-card')
      const initial = await page.evaluate(() => window.__catalogCommits)
      await page.click('.add-button:not(:disabled)')
      await page.waitForFunction(() => document.querySelector('.cart-count').textContent === '1')
      const added = await page.evaluate(() => window.__catalogCommits)
      await page.click('.quantity-control button:last-child')
      await page.waitForFunction(() => document.querySelector('.cart-count').textContent === '2')
      const incremented = await page.evaluate(() => window.__catalogCommits)
      manifest.react.push({ version: version.name, catalogCommitsOnAdd: added - initial, catalogCommitsOnIncrement: incremented - added })
    } finally { await browser.close(); await dev.close() }
  }

  // Snapshot audits measure the rendered views, not a fictitious Commands URL.
  // They cannot supply navigation FCP/LCP or a navigation Performance score.
  manifest.snapshots = []
  const axeSource = await readFile(toolRequire.resolve('axe-core/axe.min.js'), 'utf8')
  for (const version of [versions[0], versions.at(-1)]) {
    const browser = await launch()
    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 1000 })
      await page.goto(version.url, { waitUntil: 'networkidle0' })
      await page.addScriptTag({ content: axeSource })
      for (const view of ['boutique', 'commandes']) {
        if (view === 'commandes') {
          await page.click('.main-nav button:nth-child(2)')
          await page.waitForSelector('.order-row')
        }
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))
        })
        const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }))
        const axeResult = {
          version: version.name, view, toolVersion: axe.testEngine.version,
          violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })),
          incomplete: axe.incomplete.map(v => ({ id: v.id, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })),
        }
        await writeFile(path.join(out, `axe-${version.name}-${view}.json`), JSON.stringify(axeResult, null, 2) + '\n')
        await page.screenshot({ path: path.join(out, `${version.name}-${view}.png`), fullPage: true })
        const result = await snapshot(page, { flags: { logLevel: 'error', locale: 'fr', output: 'html', onlyCategories: ['accessibility', 'best-practices', 'seo'], formFactor: 'desktop', screenEmulation: { disabled: true } } })
        const sample = { version: version.name, view, mode: 'snapshot', scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([id, category]) => [id, category.score === null ? null : category.score * 100])), warnings: result.lhr.runWarnings }
        manifest.snapshots.push(sample)
        await writeFile(path.join(out, `snapshot-${version.name}-${view}.html`), result.report.replace(/^[ \t]+(?=\r?$)/gm, ''))
        await writeFile(path.join(out, `snapshot-${version.name}-${view}.json`), JSON.stringify(sample, null, 2) + '\n')
        console.log(JSON.stringify({ snapshot: sample }))
      }
    } finally { await browser.close() }
  }
  const { runChecks } = await import('./audit-checks.mjs')
  manifest.checks = await runChecks({ versions, launch, out, toolsDir, runs })
  await saveManifest()
  console.log('Audit complete: docs/audit/results.json')
} finally {
  for (const server of servers) await new Promise(resolve => server.close(resolve))
}
