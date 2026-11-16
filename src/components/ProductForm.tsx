import { useRef, useState, type FormEvent } from 'react'
import type { CreateProductInput, Product } from '../types/ecommerce'

type Props = {
  initial?: Product
  pending: boolean
  error?: string
  onSave: (input: CreateProductInput) => Promise<void>
  onCancel: () => void
}

export default function ProductForm({ initial, pending, error, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [image, setImage] = useState(initial?.image ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [badge, setBadge] = useState(initial?.badge ?? '')
  const [inStock, setInStock] = useState(initial?.inStock ?? true)
  const [validation, setValidation] = useState<string | null>(null)
  const submitting = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitting.current) return
    setValidation(null)
    const amount = Number(price)
    if (!name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      setValidation('Renseignez un nom et un slug composé de lettres minuscules, chiffres et tirets.'); return
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(amount) || amount < 0 || amount > 9_999_999_999.99) {
      setValidation('Renseignez un prix positif ou nul, avec au maximum deux décimales.'); return
    }
    const imagePath = image.trim()
    if (!/^\/(?!\/)/.test(imagePath) && !/^https:\/\/[^\s]+$/.test(imagePath)) {
      setValidation('L’image doit être un chemin local commençant par / ou une URL HTTPS.'); return
    }
    submitting.current = true
    try {
      await onSave({ name: name.trim(), slug: slug.trim(), price: amount, image: imagePath,
        description: description.trim(), category: category.trim(), badge: badge.trim(), inStock })
    } catch {
      // The mutation's server error remains visible without resetting the draft.
    } finally { submitting.current = false }
  }

  return <section className="product-editor" aria-labelledby="editor-title">
    <h2 id="editor-title">{initial ? `Modifier ${initial.name}` : 'Nouveau produit'}</h2>
    <form className="product-form" aria-busy={pending} onSubmit={event => void submit(event)}>
      <fieldset disabled={pending}>
        <legend className="sr-only">Informations du produit</legend>
        <label htmlFor="product-name">Nom</label>
        <input id="product-name" name="name" autoFocus required maxLength={160} value={name} onChange={event => setName(event.target.value)} />
        <label htmlFor="product-slug">Slug (identifiant lisible unique)</label>
        <input id="product-slug" name="slug" required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="lampe-aria" value={slug} onChange={event => setSlug(event.target.value)} />
        <label htmlFor="product-price">Prix en euros</label>
        <input id="product-price" name="price" type="number" required min="0" max="9999999999.99" step="0.01" value={price} onChange={event => setPrice(event.target.value)} />
        <label htmlFor="product-image">Image (chemin local ou URL HTTPS)</label>
        <input id="product-image" name="image" required maxLength={2048} placeholder="/images/lampe-aria.webp" value={image} onChange={event => setImage(event.target.value)} />
        <label htmlFor="product-category">Catégorie</label>
        <input id="product-category" name="category" maxLength={100} value={category} onChange={event => setCategory(event.target.value)} />
        <label htmlFor="product-description">Description</label>
        <textarea id="product-description" name="description" maxLength={5000} rows={4} value={description} onChange={event => setDescription(event.target.value)} />
        <label htmlFor="product-badge">Badge (facultatif)</label>
        <input id="product-badge" name="badge" maxLength={80} value={badge} onChange={event => setBadge(event.target.value)} />
        <label className="checkbox-label"><input name="inStock" type="checkbox" checked={inStock} onChange={event => setInStock(event.target.checked)} /> En stock</label>
      </fieldset>
      {(validation || error) && <p className="error-message" role="alert">{validation || error}</p>}
      <div className="admin-actions">
        <button className="add-button" type="submit" disabled={pending}>{pending ? 'Enregistrement…' : initial ? 'Enregistrer les modifications' : 'Créer le produit'}</button>
        <button className="add-button" type="button" disabled={pending} onClick={onCancel}>Annuler</button>
      </div>
    </form>
  </section>
}
