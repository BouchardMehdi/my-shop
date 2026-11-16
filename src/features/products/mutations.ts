import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '../../lib/supabase'
import type { CreateProductInput } from '../../types/ecommerce'

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: async ({ id, input }: { id?: string; input: CreateProductInput }) => {
      const row = {
        slug: input.slug, name: input.name, price: input.price, image_url: input.image,
        description: input.description, category: input.category, in_stock: input.inStock,
        badge: input.badge || null,
      }
      const query = id ? getSupabase().from('products').update(row).eq('id', id) : getSupabase().from('products').insert(row)
      const { data, error } = await query.select('id').single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('products').delete().eq('id', id).select('id').single()
      if (error?.code === '23503') throw new Error('Ce produit figure dans une commande. Marquez-le « Épuisé » pour le retirer de la vente tout en conservant l’historique.')
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
