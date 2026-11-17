import { describe, expect, it } from 'vitest'
import type { Product } from '../../types/ecommerce'
import { filterProducts } from './search'

const products: Product[] = [
  { id: 'lamp', slug: 'lampe-aria', name: 'Lampe Aria', price: 10, category: 'Lumière', description: '', image: '/lampe.webp', inStock: true },
  { id: 'table', slug: 'table-nord', name: 'Table Nord', price: 20, category: 'Mobilier', description: '', image: '/table.webp', inStock: false },
]

describe('filterProducts', () => {
  it('ignore la casse et les espaces autour de la recherche', () => {
    const search = '  LAMP  '

    const result = filterProducts(products, search)

    expect(result.map(product => product.name)).toEqual(['Lampe Aria'])
  })

  it('conserve tout le catalogue pour une recherche vide', () => {
    const result = filterProducts(products, '')

    expect(result.map(product => product.name)).toEqual(['Lampe Aria', 'Table Nord'])
  })

  it('retourne une liste vide quand aucun nom ne correspond', () => {
    const result = filterProducts(products, 'chaise')

    expect(result).toEqual([])
  })
})
