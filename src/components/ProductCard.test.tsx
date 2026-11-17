import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ProductCard from './ProductCard'
import { useCart } from '../features/cart/store'
import { renderWithProviders } from '../test/utils'
import type { Product } from '../types/ecommerce'

const product: Product = { id: '10000000-0000-4000-8000-000000000001', slug: 'lampe-aria', name: 'Lampe Aria', price: 42, image: '/lampe.webp', description: 'Une lampe de bureau.', category: 'Lumière', inStock: true }

describe('ProductCard', () => {
  it('affiche le produit et ajoute un exemplaire au panier', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductCard product={product} onAdd={useCart.getState().addToCart} />)
    expect(screen.getByRole('heading', { name: 'Lampe Aria' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Lampe Aria' })).toHaveAttribute('src', '/lampe.webp')
    expect(screen.getByText(/42,00\s*€/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ajouter Lampe Aria au panier' }))

    expect(useCart.getState().cart).toEqual({ [product.id]: { productId: product.id, quantity: 1 } })
  })

  it('empêche l’ajout d’un produit épuisé', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductCard product={{ ...product, inStock: false }} onAdd={useCart.getState().addToCart} />)
    const button = screen.getByRole('button', { name: 'Ajouter Lampe Aria au panier' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Épuisé')).toBeInTheDocument()

    await user.click(button)

    expect(useCart.getState().cart).toEqual({})
  })
})
