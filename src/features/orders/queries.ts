import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '../../lib/supabase'
import type { Order, OrderStatus } from '../../types/orders'
import { useAuth } from '../auth/context'

function parseStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending': case 'paid': case 'shipped': case 'cancelled': return status
    default: throw new Error('Statut de commande inconnu.')
  }
}

export function useOrders() {
  const { session, booted } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['orders', 'user', userId],
    enabled: booted && !!userId,
    staleTime: 15_000,
    queryFn: async ({ signal }): Promise<Order[]> => {
      const { data, error } = await getSupabase().from('orders')
        .select('*, order_items(product_id, quantity)')
        .order('created_at', { ascending: false }).abortSignal(signal)
      if (error) throw new Error(error.message)
      return data.map(row => ({
        id: row.id, customerEmail: row.customer_email ?? '',
        total: row.total, status: parseStatus(row.status), createdAt: row.created_at,
        items: row.order_items.map(item => ({ productId: item.product_id, quantity: item.quantity })),
      }))
    },
  })
}
