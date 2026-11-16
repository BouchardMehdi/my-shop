import { useRef, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import DataTable, { type Column } from '../components/DataTable'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { useProducts } from '../features/products/queries'
import { useDeleteProduct, useSaveProduct } from '../features/products/mutations'
import type { CreateProductInput, Product } from '../types/ecommerce'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export default function AdminCatalogPage() {
  const products = useProducts()
  const save = useSaveProduct()
  const deletion = useDeleteProduct()
  const [editor, setEditor] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [message, setMessage] = useState('')
  const newButton = useRef<HTMLButtonElement>(null)
  const deleting = useRef(false)
  const busy = save.isPending || deletion.isPending
  const initial = products.data?.find(product => product.id === editor)

  function openEditor(id: string) {
    save.reset(); setMessage(''); setEditor(id)
  }
  function closeEditor() {
    setEditor(undefined); save.reset(); newButton.current?.focus()
  }
  async function saveProduct(input: CreateProductInput) {
    await save.mutateAsync({ id: editor === 'new' ? undefined : editor, input })
    setMessage(editor === 'new' ? 'Produit créé.' : 'Produit mis à jour.')
    setEditor(undefined); newButton.current?.focus()
  }
  async function removeProduct() {
    if (!deleteTarget || deleting.current) return
    deleting.current = true
    try {
      await deletion.mutateAsync(deleteTarget.id)
      if (editor === deleteTarget.id) setEditor(undefined)
      setDeleteTarget(null); setMessage('Produit supprimé.')
      requestAnimationFrame(() => newButton.current?.focus())
    } catch {
      // Keep the dialog open and expose the database error.
    } finally { deleting.current = false }
  }

  const columns: Column<Product>[] = [
    { id: 'name', label: 'Produit', render: product => <><strong>{product.name}</strong><small>{product.slug}</small></> },
    { id: 'category', label: 'Catégorie', render: product => product.category || '—' },
    { id: 'price', label: 'Prix', className: 'numeric-cell', render: product => euro.format(product.price) },
    { id: 'stock', label: 'Disponibilité', render: product => product.inStock ? 'En stock' : 'Épuisé' },
    { id: 'actions', label: 'Actions', render: product => <div className="admin-actions">
      <button className="add-button" disabled={busy} aria-label={`Modifier ${product.name}`} onClick={() => openEditor(product.id)}>Modifier</button>
      <button className="add-button danger-button" disabled={busy} aria-label={`Supprimer ${product.name}`} onClick={() => { deletion.reset(); setDeleteTarget(product); setMessage('') }}>Supprimer</button>
    </div> },
  ]

  return <AdminLayout title="Gérer le catalogue">
    <div className="admin-toolbar">
      <p>{products.data?.length ?? '…'} produit(s) · {products.data?.filter(product => product.inStock).length ?? '…'} en stock</p>
      <button ref={newButton} className="add-button" disabled={busy} onClick={() => openEditor('new')}>Nouveau produit</button>
    </div>
    {message && <p className="admin-feedback" role="status">{message}</p>}
    {editor && (editor === 'new' || initial ? <ProductForm key={editor} initial={initial} pending={save.isPending} error={save.error?.message} onSave={saveProduct} onCancel={closeEditor} /> :
      <p role="alert">Ce produit n’est plus disponible. <button className="add-button" onClick={closeEditor}>Fermer le formulaire</button></p>)}
    {products.isPending ? <p className="fetch-message" role="status">Chargement du catalogue…</p> : products.isError ? <p className="error-message" role="alert">Impossible de charger le catalogue : {products.error.message}</p> :
      <DataTable caption="Catalogue des produits" rows={products.data} columns={columns} rowId={product => product.id} emptyMessage="Aucun produit. Créez votre premier produit." />}
    {deleteTarget && <ConfirmDialog title="Supprimer ce produit ?" pending={deletion.isPending} error={deletion.error?.message}
      onCancel={() => { setDeleteTarget(null); deletion.reset() }} onConfirm={() => void removeProduct()}>
      <p>Le produit « {deleteTarget.name} » sera retiré définitivement du catalogue.</p>
    </ConfirmDialog>}
  </AdminLayout>
}
