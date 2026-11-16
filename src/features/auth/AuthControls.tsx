import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase } from '../../lib/supabase'
import { useAuth } from './context'

export default function AuthControls() {
  const { session, booted, error: bootError } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function signOut() {
    setError(null)
    setPending(true)
    try {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw error
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Déconnexion impossible.')
    } finally { setPending(false) }
  }

  return <div className="auth-controls">
    {!booted ? <span role="status">Session…</span> : session ? <>
      <Link to="/account" className="account-link" title={session.user.email}>{session.user.email ?? 'Mon compte'}</Link>
      <button className="add-button" type="button" disabled={pending} onClick={() => void signOut()}>{pending ? 'Déconnexion…' : 'Déconnexion'}</button>
    </> : <Link to="/login" className="account-link">Connexion</Link>}
    {(error || bootError) && <p className="error-message" role="alert">{error || bootError}</p>}
  </div>
}
