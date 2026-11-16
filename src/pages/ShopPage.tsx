import { useProducts } from '../features/products/queries'
import { useCallback } from 'react'
import { ProductList } from '../components/ProductList'
import type { Cart, CartAction } from '../types/ecommerce'

type ShopPageProps = {
  cart: Cart
  itemCount: number
  onCartAction: (action: CartAction) => void
}

export default function ShopPage({ cart, itemCount, onCartAction }: ShopPageProps) {
  const handleAdd = useCallback((productId: string) => {
    onCartAction({ type: 'addToCart', productId, quantity: 1 })
  }, [onCartAction])

  const { data: products = [] } = useProducts()
  const formatProductName = (productId: string) =>
    products.find(product => product.id === productId)?.name ?? 'Produit'

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
              <h2 id="catalog-title">À découvrir <span className="heading-count">06</span></h2>
            </div>
            <span className="sort-label">Sélection du studio <span aria-hidden="true">⌄</span></span>
          </div>
          <ProductList onAdd={handleAdd} />
        </section>

        <aside className="cart-panel" aria-labelledby="cart-title">
          <div className="cart-panel-heading">
            <div>
              <p className="eyebrow">Votre sélection</p>
              <h2 id="cart-title">Le panier <span className="heading-count">{String(itemCount).padStart(2, '0')}</span></h2>
            </div>
            <span className="basket-icon" aria-hidden="true">↗</span>
          </div>
          {itemCount === 0 ? (
            <div className="empty-cart">
              <span className="empty-cart-mark" aria-hidden="true">＋</span>
              <p>Votre panier est encore vide.</p>
              <span>Les belles trouvailles sont juste à côté.</span>
            </div>
          ) : (
            <div className="cart-lines">
              {Object.values(cart).map((line) => (
                <div className="cart-line" key={line.productId}>
                  <div className="cart-line-thumb" aria-hidden="true">m.</div>
                  <div className="cart-line-info">
                    <strong>{formatProductName(line.productId)}</strong>
                    <span>Quantité {line.quantity}</span>
                  </div>
                  <div className="quantity-control" aria-label={`Quantité ${line.quantity}`}>
                    <button aria-label={`Retirer ${formatProductName(line.productId)} du panier`} onClick={() => onCartAction({ type: 'removeFromCart', productId: line.productId })}>×</button>
                    <span>{line.quantity}</span>
                    <button aria-label={`Ajouter un article ${formatProductName(line.productId)}`} onClick={() => onCartAction({ type: 'addToCart', productId: line.productId, quantity: 1 })}>+</button>
                  </div>
                </div>
              ))}
              <button className="clear-cart" onClick={() => onCartAction({ type: 'clearCart' })}>Vider le panier</button>
            </div>
          )}
          <div className="cart-footnote"><span className="footnote-check">✓</span> Livraison offerte dès 80 €</div>
        </aside>
      </div>
    </>
  )
}
