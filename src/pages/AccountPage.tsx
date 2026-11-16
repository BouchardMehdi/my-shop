import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/context'

export default function AccountPage() {
  const { session } = useAuth()
  return <section className="auth-page">
    <p className="eyebrow">Votre espace personnel</p>
    <h1>Mon compte</h1>
    <p>Bonjour {session?.user.email}.</p>
    <Link className="account-link" to="/orders">Consulter mes commandes</Link>
  </section>
}
