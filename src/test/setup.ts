import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { useCart } from '../features/cart/store'

beforeEach(() => {
  useCart.getState().clearCart()
  localStorage.clear()
})

afterEach(cleanup)
