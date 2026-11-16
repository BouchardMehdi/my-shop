import { useEffect, useState, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '../../lib/supabase'
import { AuthContext, type AuthValue } from './context'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthValue>({ session: null, booted: false, error: null })
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    let receivedEvent = false
    let userId: string | null = null
    let unsubscribe: (() => void) | undefined
    const update: (session: AuthValue['session']) => void = session => {
      if (!active) return
      const nextUserId = session?.user.id ?? null
      if (nextUserId !== userId) queryClient.removeQueries({ queryKey: ['orders'] })
      userId = nextUserId
      setAuth({ session, booted: true, error: null })
    }
    try {
      const supabase = getSupabase()
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        receivedEvent = true
        update(session)
      })
      unsubscribe = () => data.subscription.unsubscribe()
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active || receivedEvent) return
        if (error) throw error
        update(data.session)
      }).catch((error: unknown) => {
        if (active && !receivedEvent) setAuth({ session: null, booted: true, error: error instanceof Error ? error.message : 'Session indisponible.' })
      })
    } catch (error) {
      // Defer a configuration failure so the effect only subscribes synchronously.
      void Promise.resolve().then(() => {
        if (active) setAuth({ session: null, booted: true, error: error instanceof Error ? error.message : 'Session indisponible.' })
      })
    }
    return () => { active = false; unsubscribe?.() }
  }, [queryClient])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
