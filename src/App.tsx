import { useState } from 'react'
import { OrderList } from './components/OrderList'
import { ProductList } from './components/ProductList'
import type { Cart, CartAction } from './types/ecommerce'
import { applyAction } from './types/ecommerce'
import './App.css'

type View = 'shop' | 'orders'

function formatProductName(productId: string): string {
  return productId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function App() {
  const [view, setView] = useState<View>('shop')
  const [cart, setCart] = useState<Cart>({})
  const itemCount = Object.values(cart).reduce((total, line) => total + line.quantity, 0)

  function sendCartAction(action: CartAction) {
    setCart((currentCart) => applyAction(currentCart, action))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" onClick={() => setView('shop')}>
          <span className="wordmark-mark" aria-hidden="true">m.</span>
          maison moderne
        </a>
        <nav className="main-nav" aria-label="Navigation principale">
          <button className={view === 'shop' ? 'nav-link is-active' : 'nav-link'} onClick={() => setView('shop')}>
            Boutique
          </button>
          <button className={view === 'orders' ? 'nav-link is-active' : 'nav-link'} onClick={() => setView('orders')}>
            Commandes
          </button>
        </nav>
        <button className="cart-button" onClick={() => setView('shop')} aria-label={`Panier, ${itemCount} article(s)`}>
          <span>Panier</span>
          <span className="cart-count">{itemCount}</span>
        </button>
      </header>

      <main id="home">
        {view === 'shop' ? (
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
                <ProductList onAdd={(productId) => sendCartAction({ type: 'addToCart', productId, quantity: 1 })} />
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
                          <button aria-label={`Retirer ${formatProductName(line.productId)} du panier`} onClick={() => sendCartAction({ type: 'removeFromCart', productId: line.productId })}>×</button>
                          <span>{line.quantity}</span>
                          <button aria-label={`Ajouter un article ${line.productId}`} onClick={() => sendCartAction({ type: 'addToCart', productId: line.productId, quantity: 1 })}>+</button>
                        </div>
                      </div>
                    ))}
                    <button className="clear-cart" onClick={() => sendCartAction({ type: 'clearCart' })}>Vider le panier</button>
                  </div>
                )}
                <div className="cart-footnote"><span className="footnote-check">✓</span> Livraison offerte dès 80 €</div>
              </aside>
            </div>
          </>
        ) : (
          <section className="orders-page">
            <div className="orders-intro">
              <p className="eyebrow"><span className="eyebrow-dot" /> Votre espace</p>
              <h1>Les commandes <em>en cours.</em></h1>
              <p>Suivez les dernières nouvelles de vos pièces préférées.</p>
            </div>
            <OrderList />
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>maison moderne <span className="footer-dot">·</span> Des objets faits pour durer.</span>
        <span>Conçu avec soin, en France <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

export default App
