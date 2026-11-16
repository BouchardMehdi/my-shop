import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '../../lib/supabase'
import { useAuth } from './context'

export function useProfile() {
  const { session, booted } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['profiles', 'user', userId],
    enabled: booted && !!userId,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      if (!userId) throw new Error('Connexion requise.')
      const { data, error } = await getSupabase().from('profiles').select('*')
        .eq('id', userId).abortSignal(signal).maybeSingle()
      if (error) throw new Error(error.message)
      if (data && data.role !== 'admin' && data.role !== 'user') throw new Error('Rôle de profil invalide.')
      return data
    },
  })
}
