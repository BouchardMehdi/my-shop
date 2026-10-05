import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home">
          <span className="wordmark-mark" aria-hidden="true">m.</span>
          maison moderne
        </a>
        <nav className="main-nav" aria-label="Navigation principale">
          <a className="nav-link is-active" href="#catalog">Boutique</a>
          <a className="nav-link" href="#basket">Le panier</a>
        </nav>
        <a className="cart-button" href="#basket" aria-label="Voir le panier">
          <span>Panier</span>
          <span className="cart-count">0</span>
        </a>
      </header>

      <main id="home">
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
          <section className="catalog-section" id="catalog" aria-labelledby="catalog-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Nos essentiels</p>
                <h2 id="catalog-title">À découvrir <span className="heading-count">06</span></h2>
              </div>
              <span className="sort-label">Sélection du studio <span aria-hidden="true">⌄</span></span>
            </div>

            <div className="product-grid" aria-live="polite" />
          </section>

          <aside className="cart-panel" id="basket" aria-labelledby="cart-title">
            <div className="cart-panel-heading">
              <div>
                <p className="eyebrow">Votre sélection</p>
                <h2 id="cart-title">Le panier <span className="heading-count">00</span></h2>
              </div>
              <span className="basket-icon" aria-hidden="true">↗</span>
            </div>
            <div className="empty-cart">
              <span className="empty-cart-mark" aria-hidden="true">＋</span>
              <p>Votre panier est encore vide.</p>
              <span>Les belles trouvailles sont juste à côté.</span>
            </div>
            <div className="cart-footnote"><span className="footnote-check">✓</span> Livraison offerte dès 80 €</div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <span>maison moderne <span className="footer-dot">·</span> Des objets faits pour durer.</span>
        <span>Conçu avec soin, en France <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

export default App
