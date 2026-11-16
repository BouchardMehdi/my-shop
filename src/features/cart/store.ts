import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart } from '../../types/ecommerce'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// localStorage is editable and may contain an old or corrupted basket.
function readCart(value: unknown): Cart {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const cart: Cart = {}
  for (const [id, line] of Object.entries(value).slice(0, 100)) {
    if (!uuid.test(id) || !line || typeof line !== 'object') continue
    if (line.productId !== id || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) continue
    cart[id] = { productId: id, quantity: line.quantity }
  }
  return cart
}

type CartStore = {
  cart: Cart
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  consumeCart: (purchased: Cart) => void
}

export const useCart = create<CartStore>()(persist(set => ({
  cart: {},
  addToCart: productId => set(state => {
    if (!uuid.test(productId)) return state
    const quantity = state.cart[productId]?.quantity ?? 0
    if (quantity >= 99 || (!quantity && Object.keys(state.cart).length >= 100)) return state
    return { cart: { ...state.cart, [productId]: { productId, quantity: quantity + 1 } } }
  }),
  removeFromCart: productId => set(state => {
    const cart = { ...state.cart }
    delete cart[productId]
    return { cart }
  }),
  clearCart: () => set({ cart: {} }),
  // Keep any extra items added while the request was in flight.
  consumeCart: purchased => set(state => {
    const cart = { ...state.cart }
    for (const line of Object.values(purchased)) {
      const quantity = (cart[line.productId]?.quantity ?? 0) - line.quantity
      if (quantity > 0) cart[line.productId] = { productId: line.productId, quantity }
      else delete cart[line.productId]
    }
    return { cart }
  }),
}), {
  name: 'my-shop-cart',
  partialize: state => ({ cart: state.cart }),
  merge: (persisted, current) => ({ ...current, cart: readCart(
    persisted && typeof persisted === 'object' && 'cart' in persisted ? persisted.cart : undefined,
  ) }),
}))

export const selectItemCount = (state: CartStore) => Object.values(state.cart).reduce((sum, line) => sum + line.quantity, 0)
