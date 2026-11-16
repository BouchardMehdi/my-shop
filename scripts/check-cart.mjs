import assert from 'node:assert/strict'

// Exercise the real store without a browser or a new test dependency.
const values = new Map()
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
}
globalThis.window = { localStorage: globalThis.localStorage }
const { useCart, selectItemCount } = await import('../src/features/cart/store.ts')
const first = '10000000-0000-4000-8000-000000000003'
const second = '20000000-0000-4000-8000-000000000003'

useCart.getState().addToCart(first)
useCart.getState().addToCart(first)
const purchased = useCart.getState().cart
useCart.getState().addToCart(first)
useCart.getState().addToCart(second)
useCart.getState().consumeCart(purchased)
assert.equal(useCart.getState().cart[first].quantity, 1, 'New additions must survive checkout completion')
assert.equal(useCart.getState().cart[second].quantity, 1)
assert.equal(selectItemCount(useCart.getState()), 2)
const saved = JSON.parse(values.get('my-shop-cart'))
assert.deepEqual(Object.keys(saved.state), ['cart'], 'Only basket lines should be persisted')

useCart.getState().clearCart()
values.set('my-shop-cart', JSON.stringify(saved))
await useCart.persist.rehydrate()
assert.equal(selectItemCount(useCart.getState()), 2, 'F5 must restore basket quantities')

for (let n = 0; n < 150; n++) useCart.getState().addToCart(first)
assert.equal(useCart.getState().cart[first].quantity, 99)
useCart.getState().addToCart('__proto__')
assert.equal(Object.keys(useCart.getState().cart).length, 2)

values.set('my-shop-cart', JSON.stringify({ version: 0, state: { cart: {
  [first]: { productId: first, quantity: -1 },
  [second]: { productId: second, quantity: 3, price: 0 },
  invalid: { productId: 'invalid', quantity: 1 },
} } }))
await useCart.persist.rehydrate()
assert.deepEqual(useCart.getState().cart, { [second]: { productId: second, quantity: 3 } }, 'Drop invalid lines and injected prices')
useCart.getState().removeFromCart(second)
assert.equal(selectItemCount(useCart.getState()), 0)
assert.equal(typeof useCart.getState().addToCart, 'function', 'Hydration must preserve actions')
useCart.getState().addToCart(first)
useCart.getState().clearCart()
assert.deepEqual(JSON.parse(values.get('my-shop-cart')).state.cart, {})
console.log('Cart checks passed: persistence, validation, limits and additions during checkout.')
