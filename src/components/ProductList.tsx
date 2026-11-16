import { memo } from 'react'
import type { Product } from '../types/ecommerce'
import { useFetch } from '../types/ecommerce'

interface ProductListProps {
  onAdd: (productId: string) => void
}

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export const ProductList = memo(function ProductList({ onAdd }: ProductListProps) {
  const result = useFetch<Product[]>('/data/products.json')

  switch (result.status) {
    case 'idle':
      return <p className="fetch-message" role="status">Préparation de la sélection…</p>
    case 'loading':
      return <p className="fetch-message" role="status">Les pièces arrivent…</p>
    case 'success':
      return (

          <div className="product-grid">
            {result.data.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="product-image"
                        width="600"
                        height="400"
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                    />

                    {product.badge && (
                        <span className="product-badge">{product.badge}</span>
                    )}

                    <span className="product-category">{product.category}</span>
                  </div>

                  <div className="product-details">
                    <div className="product-title-row">
                      <h3>{product.name}</h3>
                      <span className="product-price">
            {euro.format(product.price)}
          </span>
                    </div>

                    <p>{product.description}</p>

                    <div className="product-actions">
          <span className={product.inStock ? 'stock-status' : 'stock-status is-out'}>
            <span /> {product.inStock ? 'En stock' : 'Épuisé'}
          </span>

                      <button
                          className="add-button"
                          disabled={!product.inStock}
                          onClick={() => onAdd(product.id)}
                          aria-label={`Ajouter ${product.name} au panier`}
                      >
                        Ajouter <span aria-hidden="true">＋</span>
                      </button>
                    </div>
                  </div>
                </article>
            ))}
          </div>

      )
    case 'error':
      return <p className="fetch-message error-message" role="alert">Impossible de charger la sélection : {result.message}</p>
    default: {
      const exhaustive: never = result
      return exhaustive
    }
  }
})
