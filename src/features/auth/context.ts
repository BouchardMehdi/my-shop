import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthValue = { session: Session | null; booted: boolean; error: string | null }
export const AuthContext = createContext<AuthValue | undefined>(undefined)
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider manquant.')
  return value
}
