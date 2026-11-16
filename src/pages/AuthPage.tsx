import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { useAuth } from '../features/auth/context'
import { authDestination } from '../features/auth/redirect'

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { session, booted } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const signup = mode === 'signup'
  const destination = authDestination(location.state)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError(null); setMessage(null); setPending(true)
    try {
      const auth = getSupabase().auth
      if (signup) {
        const { data, error } = await auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        })
        if (error) throw error
        setPassword('')
        if (data.session) navigate(destination, { replace: true })
        else setMessage('Consultez votre boîte mail pour confirmer votre inscription, puis connectez-vous.')
      } else {
        const { error } = await auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        setPassword('')
        navigate(destination, { replace: true })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentification impossible.')
    } finally { setPending(false) }
  }

  if (!booted) return <p className="fetch-message" role="status">Vérification de votre session…</p>
  if (session) return <Navigate to={destination} replace />
  return <section className="auth-page" aria-labelledby="auth-title">
    <p className="eyebrow">Votre espace personnel</p>
    <h1 id="auth-title">{signup ? 'Créer un compte' : 'Connexion'}</h1>
    <form className="auth-form" onSubmit={event => void submit(event)} aria-busy={pending}>
      <label htmlFor="auth-email">Adresse e-mail</label>
      <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={pending} />
      <label htmlFor="auth-password">Mot de passe{signup ? ' (6 caractères minimum)' : ''}</label>
      <input id="auth-password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 6 : undefined} value={password} onChange={event => setPassword(event.target.value)} disabled={pending} />
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="add-button" disabled={pending} type="submit">{pending ? 'Veuillez patienter…' : signup ? "S’inscrire" : 'Se connecter'}</button>
    </form>
    <p className="auth-switch">{signup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
      <Link to={signup ? '/login' : '/signup'} state={location.state}>{signup ? 'Se connecter' : 'Créer un compte'}</Link>
    </p>
  </section>
}
