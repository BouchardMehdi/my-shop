import { ProductList } from '../components/ProductList'
import CartPanel from '../components/CartPanel'
import { useCart } from '../features/cart/store'
import { useProducts } from '../features/products/queries'
import { useSearchParams } from 'react-router-dom'
import { filterProducts } from '../features/products/search'
import ProductSearch from '../components/ProductSearch'

function ProductCount() {
  const { data } = useProducts()
  const [searchParams] = useSearchParams()
  const count = data ? filterProducts(data, searchParams.get('search') ?? '').length : undefined
  return <span className="heading-count">{count === undefined ? '…' : String(count).padStart(2, '0')}</span>
}

export default function ShopPage() {
  const addToCart = useCart(state => state.addToCart)

  return (
    <>
      <section className="intro-band">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Objets choisis, vie quotidienne</p>
          <h1>Le beau, <em>pour longtemps.</em></h1>
          <p className="intro-description">Une sélection de pièces utiles et bien pensées, fabriquées pour trouver leur place chez vous.</p>
        </div>
        <div className="intro-note">
          <span className="note-index">01 / 03</span>
          <span>La collection<br />du quotidien</span>
          <span className="note-arrow" aria-hidden="true">↘</span>
        </div>
      </section>

      <div className="shop-layout">
        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Nos essentiels</p>
              <h2 id="catalog-title">À découvrir <ProductCount /></h2>
            </div>
            <span className="sort-label">Sélection du studio <span aria-hidden="true">⌄</span></span>
          </div>
          <ProductSearch />
          <ProductList onAdd={addToCart} />
        </section>

        <CartPanel />
      </div>
    </>
  )
}
