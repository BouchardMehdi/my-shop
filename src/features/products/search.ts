import type { Product } from '../../types/ecommerce'

export function filterProducts(products: readonly Product[], search: string): Product[] {
  const needle = search.trim().toLocaleLowerCase('fr')
  return products.filter(product => product.name.toLocaleLowerCase('fr').includes(needle))
}
