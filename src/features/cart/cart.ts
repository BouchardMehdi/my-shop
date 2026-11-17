import type { Product } from '../../types/ecommerce'

type PricedLine = { quantity: number; product?: Pick<Product, 'price'> }

// Work in cents, as in checkout, to avoid accumulating decimal rounding errors.
// Missing products contribute zero; checkout separately blocks their purchase.
export function computeCartTotal(lines: readonly PricedLine[]): number {
  return lines.reduce((sum, line) => sum + Math.round((line.product?.price ?? 0) * 100) * line.quantity, 0) / 100
}
