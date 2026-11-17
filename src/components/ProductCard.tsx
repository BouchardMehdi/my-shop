import type { Product } from '../types/ecommerce'

type Props = { product: Product; onAdd: (productId: string) => void; priority?: boolean }
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export default function ProductCard({ product, onAdd, priority = false }: Props) {
  return <article className="product-card">
    <div className="product-image-wrap">
      <img src={product.image} alt={product.name} className="product-image" width="600" height="400"
        loading={priority ? 'eager' : 'lazy'} decoding="async" />
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <span className="product-category">{product.category}</span>
    </div>
    <div className="product-details">
      <div className="product-title-row"><h3>{product.name}</h3><span className="product-price">{euro.format(product.price)}</span></div>
      <p>{product.description}</p>
      <div className="product-actions">
        <span className={product.inStock ? 'stock-status' : 'stock-status is-out'}><span /> {product.inStock ? 'En stock' : 'Épuisé'}</span>
        <button className="add-button" disabled={!product.inStock} onClick={() => onAdd(product.id)} aria-label={`Ajouter ${product.name} au panier`}>
          Ajouter <span aria-hidden="true">＋</span>
        </button>
      </div>
    </div>
  </article>
}
