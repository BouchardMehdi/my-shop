import { lazy, Suspense, useReducer, useState } from 'react'
import { applyAction } from './types/ecommerce'
import './App.css'

const ShopPage = lazy(() => import('./pages/ShopPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))

type View = 'shop' | 'orders'

function App() {
  const [view, setView] = useState<View>('shop')
  const [cart, sendCartAction] = useReducer(applyAction, {})
  const itemCount = Object.values(cart).reduce((total, line) => total + line.quantity, 0)

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
        <Suspense fallback={<p className="fetch-message" role="status">Chargement de la page...</p>}>
          {view === 'shop' ? (
            <ShopPage cart={cart} itemCount={itemCount} onCartAction={sendCartAction} />
          ) : (
            <OrdersPage />
          )}
        </Suspense>
      </main>

      <footer className="site-footer">
        <span>maison moderne <span className="footer-dot">·</span> Des objets faits pour durer.</span>
        <span>Conçu avec soin, en France <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

export default App
