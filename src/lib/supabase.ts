import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | undefined

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Configuration Supabase manquante : renseignez les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
  client = createClient<Database>(url, key)
  return client
}
