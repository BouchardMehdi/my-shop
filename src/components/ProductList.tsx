import { memo } from 'react'
import { useProducts } from '../features/products/queries'
import { useSearchParams } from 'react-router-dom'
import { filterProducts } from '../features/products/search'
import ProductCard from './ProductCard'

interface ProductListProps {
  onAdd: (productId: string) => void
}

export const ProductList = memo(function ProductList({ onAdd }: ProductListProps) {
  const result = useProducts()
  const [searchParams] = useSearchParams()

  switch (result.status) {
    case 'pending':
      return <p className="fetch-message" role="status">Les pièces arrivent…</p>
    case 'success': {
      const products = filterProducts(result.data, searchParams.get('search') ?? '')
      if (products.length === 0) return <p className="fetch-message" role="status">Aucun produit ne correspond à votre recherche.</p>
      return (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} onAdd={onAdd} priority={index === 0} />
          ))}
        </div>
      )
    }
    case 'error':
      return <p className="fetch-message error-message" role="alert">Impossible de charger la sélection : {result.error.message}</p>
    default: {
      const exhaustive: never = result
      return exhaustive
    }
  }
})
