import { OrderList } from '../components/OrderList'

export default function OrdersPage() {
  return (
    <section className="orders-page">
      <div className="orders-intro">
        <p className="eyebrow"><span className="eyebrow-dot" /> Votre espace</p>
        <h1>Les commandes <em>en cours.</em></h1>
        <p>Suivez les dernières nouvelles de vos pièces préférées.</p>
      </div>
      <OrderList />
    </section>
  )
}
