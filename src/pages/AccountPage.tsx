import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { OrderList } from '../components/OrderList'

export default function AccountPage() {
  const { session } = useAuth()
  const location = useLocation()
  const placedOrderId = location.state?.placedOrderId
  return <section className="account-page">
    <p className="eyebrow">Votre espace personnel</p>
    <h1>Mon compte</h1>
    <p>Bonjour {session?.user.email}.</p>
    {typeof placedOrderId === 'string' && <p role="status">Votre commande #{placedOrderId} a bien été enregistrée.</p>}
    <h2>Mes commandes</h2>
    <OrderList />
    <Link className="account-link" to="/">Retour à la boutique</Link>
  </section>
}
