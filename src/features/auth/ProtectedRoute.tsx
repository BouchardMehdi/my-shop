import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context'

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { session, booted, error } = useAuth()
  const location = useLocation()
  if (!booted) return <p className="fetch-message" role="status">Vérification de votre session…</p>
  if (error) return <p className="fetch-message error-message" role="alert">{error}</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  return children
}
