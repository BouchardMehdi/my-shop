import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { useCart } from '../cart/store'
import { getSupabase } from '../../lib/supabase'
import type { Cart } from '../../types/ecommerce'

export function usePlaceOrder() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id

  return useMutation({
    retry: false,
    mutationFn: async (cart: Cart) => {
      const supabase = getSupabase()
      const { data: auth, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      if (!userId || auth.session?.user.id !== userId) throw new Error('Reconnectez-vous avant de passer commande.')
      const { data, error } = await supabase.rpc('place_order', {
        p_items: Object.values(cart).map(line => ({ product_id: line.productId, quantity: line.quantity })),
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: async (_id, purchased) => {
      useCart.getState().consumeCart(purchased)
      // Do not recreate a private cache after a logout during the request.
      const { data } = await getSupabase().auth.getSession()
      if (data.session?.user.id === userId) {
        await queryClient.invalidateQueries({ queryKey: ['orders', 'user', userId] })
      }
    },
  })
}
