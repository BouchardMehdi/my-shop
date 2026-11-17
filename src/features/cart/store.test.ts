import { describe, expect, it } from 'vitest'
import { selectItemCount, useCart } from './store'

const first = '10000000-0000-4000-8000-000000000001'
const second = '20000000-0000-4000-8000-000000000002'

describe('panier Zustand', () => {
  it('cumule la quantité sans dupliquer un produit déjà présent', () => {
    useCart.getState().addToCart(first)

    useCart.getState().addToCart(first)

    expect(Object.values(useCart.getState().cart)).toEqual([{ productId: first, quantity: 2 }])
    expect(selectItemCount(useCart.getState())).toBe(2)
  })

  it('écarte une quantité zéro lors de la restauration', async () => {
    localStorage.setItem('my-shop-cart', JSON.stringify({ version: 0, state: { cart: {
      [first]: { productId: first, quantity: 0 },
      [second]: { productId: second, quantity: 2 },
    } } }))

    await useCart.persist.rehydrate()

    expect(useCart.getState().cart).toEqual({ [second]: { productId: second, quantity: 2 } })
  })

  it('retire seulement le produit demandé', () => {
    useCart.getState().addToCart(first)
    useCart.getState().addToCart(second)

    useCart.getState().removeFromCart(first)

    expect(useCart.getState().cart).toEqual({ [second]: { productId: second, quantity: 1 } })
  })

  it('bloque la quantité à 99 exemplaires par produit', () => {
    useCart.setState({ cart: { [first]: { productId: first, quantity: 99 } } })

    useCart.getState().addToCart(first)

    expect(useCart.getState().cart[first]?.quantity).toBe(99)
  })

  it('conserve les ajouts effectués pendant une commande', () => {
    useCart.getState().addToCart(first)
    const purchased = useCart.getState().cart
    useCart.getState().addToCart(first)
    useCart.getState().addToCart(second)

    useCart.getState().consumeCart(purchased)

    expect(useCart.getState().cart).toEqual({
      [first]: { productId: first, quantity: 1 },
      [second]: { productId: second, quantity: 1 },
    })
  })

  it('restaure le panier sauvegardé sans écraser ses actions', async () => {
    useCart.getState().addToCart(first)
    useCart.getState().addToCart(first)
    const saved = localStorage.getItem('my-shop-cart')
    expect(saved).not.toBeNull()
    useCart.getState().clearCart()
    localStorage.setItem('my-shop-cart', saved!)

    await useCart.persist.rehydrate()

    expect(useCart.getState().cart).toEqual({ [first]: { productId: first, quantity: 2 } })
    expect(typeof useCart.getState().addToCart).toBe('function')
  })

  it('vide le panier et sa sauvegarde', () => {
    useCart.getState().addToCart(first)

    useCart.getState().clearCart()

    expect(useCart.getState().cart).toEqual({})
    expect(JSON.parse(localStorage.getItem('my-shop-cart')!).state.cart).toEqual({})
  })
})
