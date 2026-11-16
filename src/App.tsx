import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react'
import { applyAction } from './types/ecommerce'
import './App.css'

const ShopPage = lazy(() => import('./pages/ShopPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))

type View = 'shop' | 'orders'

function App() {
  const [view, setView] = useState<View>('shop')
  const [cart, sendCartAction] = useReducer(applyAction, {})
  const itemCount = Object.values(cart).reduce((total, line) => total + line.quantity, 0)
  const mainRef = useRef<HTMLElement>(null)
  const previousView = useRef(view)

  useEffect(() => {
    document.title = `${view === 'shop' ? 'Boutique' : 'Commandes'} — maison moderne`
    if (previousView.current !== view) {
      mainRef.current?.focus()
      previousView.current = view
    }
  }, [view])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#home">Aller au contenu principal</a>
      <header className="topbar">
        <a className="wordmark" href="#home" onClick={() => setView('shop')}>
          <span className="wordmark-mark" aria-hidden="true">m.</span>
          maison moderne
        </a>
        <nav className="main-nav" aria-label="Navigation principale">
          <button className={view === 'shop' ? 'nav-link is-active' : 'nav-link'} aria-current={view === 'shop' ? 'page' : undefined} onClick={() => setView('shop')}>
            Boutique
          </button>
          <button className={view === 'orders' ? 'nav-link is-active' : 'nav-link'} aria-current={view === 'orders' ? 'page' : undefined} onClick={() => setView('orders')}>
            Commandes
          </button>
        </nav>
        <button className="cart-button" onClick={() => setView('shop')} aria-label={`Panier, ${itemCount} article(s)`}>
          <span>Panier</span>
          <span className="cart-count">{itemCount}</span>
        </button>
      </header>

      <p className="sr-only" role="status" aria-atomic="true">
        {itemCount === 0 ? 'Votre panier est vide.' : `${itemCount} article${itemCount > 1 ? 's' : ''} dans le panier.`}
      </p>

      <main id="home" ref={mainRef} tabIndex={-1} aria-label={view === 'shop' ? 'Boutique' : 'Commandes'}>
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
