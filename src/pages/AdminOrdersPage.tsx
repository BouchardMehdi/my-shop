import AdminLayout from '../components/AdminLayout'
import DataTable, { type Column } from '../components/DataTable'
import { useOrders } from '../features/orders/queries'
import { labelStatus, type Order } from '../types/orders'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const columns: Column<Order>[] = [
  { id: 'id', label: 'Commande', render: order => <><strong>#{order.id}</strong><small>{date.format(new Date(order.createdAt))}</small></> },
  { id: 'customer', label: 'Client', render: order => order.customerEmail || 'Compte supprimé' },
  { id: 'items', label: 'Articles', render: order => <ul className="admin-order-items">{order.items.map(item => <li key={item.productId}>{item.productName || 'Produit'} × {item.quantity} — {euro.format(item.unitPrice * item.quantity)}</li>)}</ul> },
  { id: 'total', label: 'Total', className: 'numeric-cell', render: order => euro.format(order.total) },
  { id: 'status', label: 'Statut', render: order => <span className={`order-status status-${order.status}`}>{labelStatus(order.status)}</span> },
]

export default function AdminOrdersPage() {
  const orders = useOrders('admin')
  return <AdminLayout title="Toutes les commandes">
    {orders.isPending ? <p className="fetch-message" role="status">Chargement des commandes…</p> : orders.isError ? <p className="error-message" role="alert">Impossible de charger les commandes : {orders.error.message}</p> : <>
      <p className="admin-toolbar">{orders.data.length} commande(s) · Total des articles : {euro.format(orders.data.reduce((sum, order) => sum + Math.round(order.total * 100), 0) / 100)}</p>
      <DataTable caption="Commandes de tous les utilisateurs" rows={orders.data} columns={columns} rowId={order => order.id} emptyMessage="Aucune commande à afficher." />
    </>}
  </AdminLayout>
}
