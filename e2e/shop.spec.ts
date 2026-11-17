import { expect, test } from '@playwright/test'

test('un visiteur parcourt le catalogue et conserve son panier après rechargement', async ({ page }) => {
  await test.step('ouvrir le catalogue public avec un panier neuf', async () => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /À découvrir/ })).toBeVisible()
    await expect(page.getByText('Votre panier est encore vide.', { exact: true })).toBeVisible()
  })

  const cart = page.getByRole('complementary', { name: /^Le panier/ })
  // Use an available product from the real catalogue, without a fixed UUID or price.
  const card = page.getByRole('article').filter({
    has: page.getByRole('button', { name: /^Ajouter .+ au panier$/, disabled: false }),
  }).first()
  await expect(card).toBeVisible()
  const productName = await card.getByRole('heading', { level: 3 }).innerText()

  await test.step('ajouter le produit et vérifier la sélection visible', async () => {
    await card.getByRole('button', { name: `Ajouter ${productName} au panier`, exact: true }).click()
    await expect(page.getByRole('link', { name: 'Panier, 1 article(s)', exact: true })).toBeVisible()
    await expect(cart.getByText(productName, { exact: true })).toBeVisible()
    await expect(cart.getByText('Quantité 1', { exact: true })).toBeVisible()
  })

  await test.step('augmenter la quantité du même produit', async () => {
    await cart.getByRole('button', { name: `Ajouter un article ${productName}`, exact: true }).click()
    await expect(page.getByRole('link', { name: 'Panier, 2 article(s)', exact: true })).toBeVisible()
    await expect(cart.getByText('Quantité 2', { exact: true })).toBeVisible()
  })

  await test.step('retrouver les articles après F5', async () => {
    await page.reload()
    await expect(page.getByRole('link', { name: 'Panier, 2 article(s)', exact: true })).toBeVisible()
    await expect(cart.getByText(productName, { exact: true })).toBeVisible()
    await expect(cart.getByText('Quantité 2', { exact: true })).toBeVisible()
  })
})
