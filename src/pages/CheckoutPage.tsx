import { useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../features/cart/store'
import { useProducts } from '../features/products/queries'
import { usePlaceOrder } from '../features/orders/mutations'
import { computeCartTotal } from '../features/cart/cart'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export default function CheckoutPage() {
  const cart = useCart(state => state.cart)
  const products = useProducts()
  const order = usePlaceOrder()
  const navigate = useNavigate()
  const submitting = useRef(false)
  const lines = Object.values(cart)
  const selection = lines.map(line => ({ ...line, product: products.data?.find(product => product.id === line.productId) }))
  const unavailable = selection.some(line => !line.product?.inStock)
  const total = computeCartTotal(selection)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || order.isPending || !lines.length || unavailable) return
    submitting.current = true
    try {
      const id = await order.mutateAsync(cart)
      navigate('/account', { replace: true, state: { placedOrderId: id } })
    } catch {
      // React Query exposes the server error below and keeps the basket intact.
    } finally { submitting.current = false }
  }

  return <section className="checkout-page">
    <p className="eyebrow">Votre sélection</p>
    <h1>Passer commande</h1>
    {lines.length === 0 ? <p>Votre panier est vide. <Link to="/">Découvrir la boutique</Link></p> : <>
      {products.isPending ? <p role="status">Chargement du récapitulatif…</p> : products.isError ?
        <p className="error-message" role="alert">Impossible de charger les produits : {products.error.message}</p> : <form onSubmit={event => void submit(event)} aria-busy={order.isPending}>
          <ul className="checkout-lines">
            {selection.map(line => <li key={line.productId}>
              <span><strong>{line.product?.name ?? 'Produit indisponible'}</strong> × {line.quantity}
                {!line.product?.inStock && <span className="error-message"> — Indisponible</span>}</span>
              <span>{line.product ? euro.format(Math.round(line.product.price * 100) * line.quantity / 100) : '—'}</span>
            </li>)}
          </ul>
          <p className="checkout-total">Total des articles <strong>{euro.format(total)}</strong></p>
          <p>Commande de démonstration : aucun paiement ni débit bancaire.</p>
          {unavailable && <p className="error-message" role="alert">Retirez les produits indisponibles de votre panier pour continuer.</p>}
          {order.isError && <p className="error-message" role="alert">Commande non confirmée : {order.error.message} Votre panier est conservé. En cas de coupure réseau, consultez vos commandes avant de réessayer.</p>}
          <button className="add-button checkout-submit" type="submit" disabled={order.isPending || unavailable}>
            {order.isPending ? 'Enregistrement…' : 'Confirmer la commande'}
          </button>
        </form>}
      <p><Link to="/">Modifier le panier</Link></p>
    </>}
  </section>
}
