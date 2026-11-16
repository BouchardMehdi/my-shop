import { useOrders } from '../features/orders/queries'
import type { OrderStatus } from '../types/orders'
import { groupOrdersByStatus, labelStatus } from '../types/orders'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

export function OrderList() {
  const result = useOrders()

  switch (result.status) {
    case 'pending':
      return <p className="fetch-message" role="status">Chargement des commandes…</p>
    case 'success': {
      if (result.data.length === 0) return <p className="fetch-message">Aucune commande à afficher.</p>
      const byStatus = groupOrdersByStatus(result.data)
      return (
        <div className="orders-content">
          <div className="order-summary-strip">
            {orderStatuses.map((status) => (
              <div className="summary-cell" key={status}>
                <span>{labelStatus(status)}</span>
                <strong>{byStatus[status].length.toString().padStart(2, '0')}</strong>
              </div>
            ))}
          </div>
          <div className="order-list">
            {result.data.map((order) => (
              <article className="order-row" key={order.id}>
                <div className="order-number">
                  <span>Commande</span>
                  <strong>#{order.id}</strong>
                </div>
                <div className="order-customer">
                  <span>Client</span>
                  <strong>{order.customerEmail}</strong>
                </div>
                <div className="order-date">
                  <span>Date</span>
                  <strong>{date.format(new Date(order.createdAt))}</strong>
                </div>
                <div className="order-total">
                  <span>Total</span>
                  <strong>{euro.format(order.total)}</strong>
                </div>
                <span className={`order-status status-${order.status}`}>{labelStatus(order.status)}</span>
                <ul className="order-items" aria-label={`Articles de la commande ${order.id}`}>
                  {order.items.map(item => <li key={item.productId}>{item.productName || 'Produit'} × {item.quantity} — {euro.format(item.unitPrice * item.quantity)}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )
    }
    case 'error':
      return <p className="fetch-message error-message" role="alert">Impossible de charger les commandes : {result.error.message}</p>
    default: {
      const exhaustive: never = result
      return exhaustive
    }
  }
}
