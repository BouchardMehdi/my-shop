import { describe, expect, it } from 'vitest'
import { computeCartTotal } from './cart'

describe('computeCartTotal', () => {
  it('additionne les prix multipliés par les quantités', () => {
    // Arrange: expected values are written by hand, independently of the function.
    const lines = [{ product: { price: 10 }, quantity: 2 }, { product: { price: 5 }, quantity: 1 }]

    // Act
    const total = computeCartTotal(lines)

    // Assert
    expect(total).toBe(25)
  })

  it('retourne zéro pour un panier vide', () => {
    expect(computeCartTotal([])).toBe(0)
  })

  it('additionne les centimes sans erreur de virgule flottante', () => {
    const lines = [{ product: { price: 0.1 }, quantity: 1 }, { product: { price: 0.2 }, quantity: 1 }]

    const total = computeCartTotal(lines)

    expect(total).toBe(0.3)
  })

  it('ne facture pas un produit absent du catalogue', () => {
    const lines = [{ quantity: 3 }, { product: { price: 5 }, quantity: 2 }]

    const total = computeCartTotal(lines)

    expect(total).toBe(10)
  })
})
