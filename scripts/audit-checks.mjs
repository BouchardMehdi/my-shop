import assert from 'node:assert/strict'
import { stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function runChecks({ versions, launch, out, toolsDir, runs }) {
  const requireTool = createRequire(path.join(toolsDir, 'package.json'))
  const { computeEcoIndex, getEcoIndexGrade } = await import(pathToFileURL(requireTool.resolve('ecoindex')))
  const { default: lighthouse } = await import(pathToFileURL(requireTool.resolve('lighthouse')))
  const { default: desktopConfig } = await import(pathToFileURL(path.join(toolsDir, 'node_modules/lighthouse/core/config/desktop-config.js')))
  const result = { desktop: [], ecoindex: [], functional: [] }
  const writeJson = (file, data) => writeFile(path.join(out, file), JSON.stringify(data, null, 2) + '\n')

  // A separate desktop comparison: do not mix these scores with the mobile series.
  for (let pass = 1; pass <= runs; pass++) {
    for (const version of [versions[0], versions.at(-1)]) {
      const browser = await launch()
      try {
        const page = await browser.newPage()
        const audited = await lighthouse(version.url, { logLevel: 'error', output: 'html', locale: 'fr', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, desktopConfig, page)
        const lhr = audited.lhr
        assert(!lhr.runtimeError, JSON.stringify(lhr.runtimeError))
        assert.equal(lhr.configSettings.formFactor, 'desktop')
        const sample = {
          version: version.name, pass, profile: 'desktop', fetchTime: lhr.fetchTime,
          settings: lhr.configSettings, warnings: lhr.runWarnings,
          scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, c]) => [key, c.score === null ? null : c.score * 100])),
          fcpMs: lhr.audits['first-contentful-paint'].numericValue,
          lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
          tbtMs: lhr.audits['total-blocking-time'].numericValue,
          cls: lhr.audits['cumulative-layout-shift'].numericValue,
          transferredBytes: lhr.audits['total-byte-weight'].numericValue,
        }
        result.desktop.push(sample)
        await writeJson(`desktop-${version.name}-${pass}.json`, sample)
        if (pass === 1) await writeFile(path.join(out, `desktop-${version.name}.html`), audited.report.replace(/^[ \t]+(?=\r?$)/gm, ''))
        console.log(JSON.stringify({ desktop: sample.version, pass, scores: sample.scores }))
      } finally { await browser.close() }
    }
  }

  // Local estimate, not a result issued by ecoindex.fr. Use the published scroll
  // scenario (1920x1080, cold cache, 3 seconds, scroll to bottom, 3 seconds).
  for (let pass = 1; pass <= runs; pass++) {
    for (const version of [versions[0], versions.at(-1)]) {
      for (const view of ['boutique', 'commandes']) {
        const browser = await launch()
        try {
          const page = await browser.newPage()
          await page.setViewport({ width: 1920, height: 1080 })
          await page.setCacheEnabled(false)
          const cdp = await page.createCDPSession()
          await cdp.send('Network.enable')
          const responses = new Map()
          const finished = []
          cdp.on('Network.responseReceived', event => responses.set(event.requestId, { url: event.response.url, status: event.response.status, type: event.type }))
          cdp.on('Network.loadingFinished', event => finished.push({ requestId: event.requestId, bytes: event.encodedDataLength }))
          const response = await page.goto(version.url, { waitUntil: 'load' })
          assert.equal(response.status(), 200)
          const htmlBytes = Buffer.byteLength(await response.text())
          if (view === 'commandes') {
            await page.waitForSelector('.main-nav button:nth-child(2)')
            await page.click('.main-nav button:nth-child(2)')
            await page.waitForSelector('.order-row')
          } else { await page.waitForSelector('.product-card') }
          await new Promise(resolve => setTimeout(resolve, 3000))
          await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
          await new Promise(resolve => setTimeout(resolve, 3000))
          const dom = await page.evaluate(() => [...document.querySelectorAll('*')].filter(element => !element.closest('svg') || element.tagName.toLowerCase() === 'svg').length)
          const records = finished.map(event => ({ ...event, ...responses.get(event.requestId) })).filter(record => /^https?:/.test(record.url ?? ''))
          const networkBytes = records.reduce((total, record) => total + record.bytes, 0)
          // Match the public methodology's explicit HTML addition; retain both
          // values so readers can see exactly what was included in this estimate.
          const bytes = networkBytes + htmlBytes
          const score = computeEcoIndex(dom, records.length, bytes / 1024)
          const sample = { version: version.name, pass, view, dom, requests: records.length, networkBytes, htmlBytesAdded: htmlBytes, bytes, score, grade: getEcoIndexGrade(score), tool: 'ecoindex@2.0.1', reference: 'ecoindex_reference@1.0.2', estimate: true, records }
          result.ecoindex.push(sample)
          await writeJson(`ecoindex-${version.name}-${view}-${pass}.json`, sample)
          console.log(JSON.stringify({ ecoindex: version.name, view, pass, grade: sample.grade, score, bytes, requests: records.length }))
        } finally { await browser.close() }
      }
    }
  }

  for (const version of [versions[0], versions.at(-1)]) {
    const browser = await launch()
    try {
      const page = await browser.newPage()
      const errors = []
      const requests = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => requests.push(request.url()))
      await page.setViewport({ width: 1440, height: 1000 })
      await page.goto(version.url, { waitUntil: 'networkidle0' })
      const initialTitle = await page.title()
      const hasSkipLink = !!(await page.$('.skip-link'))
      let skipLinkWorks = false
      if (hasSkipLink) {
        await page.keyboard.press('Tab')
        assert(await page.evaluate(() => document.activeElement.classList.contains('skip-link')))
        await page.keyboard.press('Enter')
        skipLinkWorks = await page.evaluate(() => document.activeElement.id === 'home')
      }
      const images = await page.$$eval('.product-image', elements => elements.map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, renderedWidth: image.width, renderedHeight: image.height, loading: image.loading, decoding: image.decoding })))
      const ordersChunkAbsentAtStart = !requests.some(url => /OrdersPage-.*\.js/.test(url))
      await page.click('.add-button:not(:disabled)')
      await page.waitForFunction(() => document.querySelector('.cart-count').textContent === '1')
      const hasCartLiveRegion = !!(await page.$('.sr-only[role="status"]'))
      await page.click('.main-nav button:nth-child(2)')
      await page.waitForSelector('.order-row')
      const titleChanges = (await page.title()) !== initialTitle
      const focusFollowsView = await page.evaluate(() => document.activeElement.tagName === 'MAIN')
      const activeViewMarked = !!(await page.$('.main-nav [aria-current="page"]'))
      const orders = await page.$$eval('.order-row', elements => elements.length)
      await page.click('.main-nav button:first-child')
      await page.waitForSelector('.cart-line')
      const cartPersists = (await page.$eval('.cart-count', el => el.textContent)) === '1'
      await page.click('.quantity-control button:last-child')
      await page.waitForFunction(() => document.querySelector('.cart-count').textContent === '2')
      await page.click('.quantity-control button:first-child')
      await page.waitForSelector('.empty-cart')
      await page.click('.add-button:not(:disabled)')
      await page.waitForSelector('.clear-cart')
      await page.click('.clear-cart')
      await page.waitForSelector('.empty-cart')
      await page.setViewport({ width: 390, height: 844 })
      const mobileNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
      const sample = { version: version.name, hasSkipLink, skipLinkWorks, titleChanges, focusFollowsView, activeViewMarked, hasCartLiveRegion, images, orders, ordersChunkAbsentAtStart, ordersChunkRequestedOnNavigation: requests.some(url => /OrdersPage-.*\.js/.test(url)), cartPersists, incrementRemoveClear: true, mobileNoOverflow, errors }
      if (version.name === 'final') {
        assert(skipLinkWorks && titleChanges && focusFollowsView && activeViewMarked && hasCartLiveRegion && cartPersists && mobileNoOverflow)
        assert.equal(errors.length, 0)
        assert(images.every(image => image.loaded))
        assert.equal(orders, 4)
        const metadata = await Promise.all(images.map(async image => {
          const file = path.basename(new URL(image.src, version.url).pathname)
          const info = await stat(path.join(version.dir ?? process.cwd(), 'public', file))
          return { file, bytes: info.size, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
        }))
        await writeJson('images.json', metadata.sort((a, b) => a.file.localeCompare(b.file)))
      }
      result.functional.push(sample)
      await writeJson(`functional-${version.name}.json`, sample)
    } finally { await browser.close() }
  }
  await writeJson('checks.json', result)
  return result
}
