import { Link } from 'react-router-dom'
import { selectItemCount, useCart } from '../features/cart/store'

export default function CartLink() {
  const itemCount = useCart(selectItemCount)
  return <>
    <Link className="cart-button" to="/checkout" aria-label={`Panier, ${itemCount} article(s)`}>
      <span>Panier</span><span className="cart-count">{itemCount}</span>
    </Link>
    <p className="sr-only" role="status" aria-atomic="true">
      {itemCount === 0 ? 'Votre panier est vide.' : `${itemCount} article${itemCount > 1 ? 's' : ''} dans le panier.`}
    </p>
  </>
}
