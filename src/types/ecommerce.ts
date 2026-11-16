export interface Product {
  id: string
  slug: string
  name: string
  category: string
  description: string
  image: string
  price: number
  inStock: boolean
  badge?: string
}

export type CartLine = { productId: string; quantity: number }

export type CartAction =
  | { type: 'addToCart'; productId: string; quantity: number }
  | { type: 'removeFromCart'; productId: string }
  | { type: 'clearCart' }
  | { type: 'applyDiscount'; percent: number }

export type ProductPreview = Pick<Product, 'id' | 'name' | 'price'>
export type CreateProductInput = Omit<Product, 'id'>
export type UpdateProductInput = Partial<CreateProductInput>
export type Cart = Record<string, CartLine>

export type FetchResult<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export function describe(line: CartLine | null): string {
  if (line === null) return 'Panier vide'
  return `${line.quantity} article(s)`
}

export function applyAction(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'addToCart': {
      const existing = cart[action.productId]
      return {
        ...cart,
        [action.productId]: {
          productId: action.productId,
          quantity: (existing?.quantity ?? 0) + action.quantity,
        },
      }
    }
    case 'removeFromCart': {
      const next = { ...cart }
      delete next[action.productId]
      return next
    }
    case 'clearCart':
      return {}
    case 'applyDiscount':
      return cart
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export function firstItem<T>(items: T[]): T | undefined {
  return items[0]
}

export function getProductField<T, K extends keyof T>(products: T[], key: K): T[K][] {
  return products.map((product) => product[key])
}
