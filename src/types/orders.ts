import type { CartLine } from './ecommerce'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled'

export interface Order {
  id: string
  customerEmail: string
  items: CartLine[]
  total: number
  status: OrderStatus
  createdAt: string
}

export function labelStatus(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente de paiement'
    case 'paid':
      return 'Payée'
    case 'shipped':
      return 'Expédiée'
    case 'cancelled':
      return 'Annulée'
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

export type OrderEvent =
  | { type: 'place' }
  | { type: 'pay'; paymentRef: string }
  | { type: 'ship'; carrier: string }
  | { type: 'cancel'; reason: string }

export function applyEvent(order: Order, status: OrderStatus, event: OrderEvent): OrderStatus {
  switch (event.type) {
    case 'place':
      return 'pending'
    case 'pay':
      if (status !== 'pending') return status
      console.info(`Paiement ${event.paymentRef} enregistré pour ${order.id}`)
      return 'paid'
    case 'ship':
      if (status !== 'paid') return status
      console.info(`Expédition via ${event.carrier}`)
      return 'shipped'
    case 'cancel':
      if (status === 'shipped' || status === 'cancelled') return status
      console.info(`Annulation : ${event.reason}`)
      return 'cancelled'
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}

export function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

export type OrderSummary = Pick<Order, 'id' | 'customerEmail' | 'total'>
export type UpdateOrderInput = Partial<Omit<Order, 'id' | 'createdAt'>>
export type OrdersByStatus = Record<OrderStatus, Order[]>

export const carriers = {
  colissimo: 'Colissimo',
  chrono: 'Chronopost',
} satisfies Record<string, string>

export function groupOrdersByStatus(orders: Order[]): OrdersByStatus {
  const grouped: OrdersByStatus = { pending: [], paid: [], shipped: [], cancelled: [] }
  for (const order of orders) grouped[order.status].push(order)
  return grouped
}