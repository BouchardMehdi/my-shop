import { useFetch } from '../types/ecommerce'
import type { Order, OrderStatus } from '../types/orders'
import { groupOrdersByStatus, labelStatus } from '../types/orders'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

export function OrderList() {
  const result = useFetch<Order[]>('/data/orders.json')

  switch (result.status) {
    case 'idle':
      return <p className="fetch-message" role="status">Préparation de vos commandes…</p>
    case 'loading':
      return <p className="fetch-message" role="status">Chargement des commandes…</p>
    case 'success': {
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
            {result.data.map((order, index) => (
              <article className="order-row" key={order.id} style={{ animationDelay: `${index * 70}ms` }}>
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
              </article>
            ))}
          </div>
        </div>
      )
    }
    case 'error':
      return <p className="fetch-message error-message" role="alert">Impossible de charger les commandes : {result.message}</p>
    default: {
      const exhaustive: never = result
      return exhaustive
    }
  }
}
