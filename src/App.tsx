import { lazy, Suspense, useEffect, useReducer, useRef, type PropsWithChildren } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { applyAction } from './types/ecommerce'
import AuthControls from './features/auth/AuthControls'
import ProtectedRoute from './features/auth/ProtectedRoute'
import './App.css'

const ShopPage = lazy(() => import('./pages/ShopPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))

function Page({ children }: PropsWithChildren) {
  return <Suspense fallback={<p className="fetch-message" role="status">Chargement de la page...</p>}>{children}</Suspense>
}

const titles: Record<string, string> = {
  '/': 'Boutique', '/orders': 'Commandes', '/account': 'Mon compte',
  '/login': 'Connexion', '/signup': 'Inscription',
}

function App() {
  const { pathname } = useLocation()
  const [cart, sendCartAction] = useReducer(applyAction, {})
  const itemCount = Object.values(cart).reduce((total, line) => total + line.quantity, 0)
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)
  const title = titles[pathname] ?? 'Page introuvable'

  useEffect(() => {
    document.title = `${title} — maison moderne`
    if (previousPath.current !== pathname) {
      mainRef.current?.focus()
      previousPath.current = pathname
    }
  }, [pathname, title])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#home">Aller au contenu principal</a>
      <header className="topbar">
        <Link className="wordmark" to="/">
          <span className="wordmark-mark" aria-hidden="true">m.</span>
          maison moderne
        </Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <NavLink className={({ isActive }) => isActive ? 'nav-link is-active' : 'nav-link'} to="/" end>
            Boutique
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-link is-active' : 'nav-link'} to="/orders">
            Commandes
          </NavLink>
        </nav>
        <Link className="cart-button" to="/" aria-label={`Panier, ${itemCount} article(s)`}>
          <span>Panier</span>
          <span className="cart-count">{itemCount}</span>
        </Link>
      </header>
      <AuthControls />

      <p className="sr-only" role="status" aria-atomic="true">
        {itemCount === 0 ? 'Votre panier est vide.' : `${itemCount} article${itemCount > 1 ? 's' : ''} dans le panier.`}
      </p>

      <main id="home" ref={mainRef} tabIndex={-1} aria-label={title}>
        <Routes>
          <Route path="/" element={<Page><ShopPage cart={cart} itemCount={itemCount} onCartAction={sendCartAction} /></Page>} />
          <Route path="/login" element={<Page><AuthPage key="login" mode="login" /></Page>} />
          <Route path="/signup" element={<Page><AuthPage key="signup" mode="signup" /></Page>} />
          <Route path="/account" element={<ProtectedRoute><Page><AccountPage /></Page></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Page><OrdersPage /></Page></ProtectedRoute>} />
          <Route path="*" element={<section className="auth-page"><h1>Page introuvable</h1><Link to="/">Retour à la boutique</Link></section>} />
        </Routes>
      </main>

      <footer className="site-footer">
        <span>maison moderne <span className="footer-dot">·</span> Des objets faits pour durer.</span>
        <span>Conçu avec soin, en France <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

export default App
