import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import type { Product } from '../../types/ecommerce'

function toProduct(row: Database['public']['Tables']['products']['Row']): Product {
  return {
    id: row.id, slug: row.slug, name: row.name, price: row.price,
    image: row.image_url, description: row.description, category: row.category,
    inStock: row.in_stock, ...(row.badge ? { badge: row.badge } : {}),
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async ({ signal }) => {
      const { data, error } = await getSupabase().from('products')
        .select('*').order('display_order').order('slug').abortSignal(signal)
      if (error) throw new Error(error.message)
      return data.map(toProduct)
    },
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', { id }],
    enabled: !!id,
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('Identifiant produit manquant.')
      const { data, error } = await getSupabase().from('products')
        .select('*').eq('id', id).abortSignal(signal).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toProduct(data) : null
    },
  })
}
