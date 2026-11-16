import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useProfile } from './queries'

function AdminAccess({ children }: PropsWithChildren) {
  const profile = useProfile()
  if (profile.isPending) return <p className="fetch-message" role="status">Vérification des droits…</p>
  if (profile.isError) return <div className="auth-page">
    <p className="error-message" role="alert">Impossible de vérifier votre profil : {profile.error.message}</p>
    <button className="add-button" onClick={() => void profile.refetch()}>Réessayer</button>
  </div>
  if (profile.data?.role !== 'admin') return <section className="auth-page">
    <h1>Accès refusé</h1>
    <p>Cet espace est réservé aux administrateurs.</p>
    <Link to="/account">Retour à mon compte</Link>
  </section>
  return children
}

export default function AdminRoute({ children }: PropsWithChildren) {
  return <ProtectedRoute><AdminAccess>{children}</AdminAccess></ProtectedRoute>
}
