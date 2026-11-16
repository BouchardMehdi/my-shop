import { Link } from 'react-router-dom'
import { useProducts } from '../features/products/queries'
import { selectItemCount, useCart } from '../features/cart/store'

export default function CartPanel() {
  const cart = useCart(state => state.cart)
  const itemCount = useCart(selectItemCount)
  const addToCart = useCart(state => state.addToCart)
  const removeFromCart = useCart(state => state.removeFromCart)
  const clearCart = useCart(state => state.clearCart)
  const { data: products = [] } = useProducts()
  const name = (id: string) => products.find(product => product.id === id)?.name ?? 'Produit indisponible'

  return <aside className="cart-panel" aria-labelledby="cart-title">
    <div className="cart-panel-heading">
      <div><p className="eyebrow">Votre sélection</p><h2 id="cart-title">Le panier <span className="heading-count">{String(itemCount).padStart(2, '0')}</span></h2></div>
      <span className="basket-icon" aria-hidden="true">↗</span>
    </div>
    {itemCount === 0 ? <div className="empty-cart">
      <span className="empty-cart-mark" aria-hidden="true">＋</span>
      <p>Votre panier est encore vide.</p><span>Les belles trouvailles sont juste à côté.</span>
    </div> : <div className="cart-lines">
      {Object.values(cart).map(line => <div className="cart-line" key={line.productId}>
        <div className="cart-line-thumb" aria-hidden="true">m.</div>
        <div className="cart-line-info"><strong>{name(line.productId)}</strong><span>Quantité {line.quantity}</span></div>
        <div className="quantity-control" aria-label={`Quantité ${line.quantity}`}>
          <button aria-label={`Retirer ${name(line.productId)} du panier`} onClick={() => removeFromCart(line.productId)}>×</button>
          <span>{line.quantity}</span>
          <button disabled={line.quantity >= 99} aria-label={`Ajouter un article ${name(line.productId)}`} onClick={() => addToCart(line.productId)}>+</button>
        </div>
      </div>)}
      <button className="clear-cart" onClick={clearCart}>Vider le panier</button>
      <Link className="checkout-link" to="/checkout">Passer commande</Link>
    </div>}
    <div className="cart-footnote"><span className="footnote-check">✓</span> Livraison offerte dès 80 €</div>
  </aside>
}
