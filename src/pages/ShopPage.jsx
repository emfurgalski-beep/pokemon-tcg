import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import '../styles/placeholder.css'

export default function ShopPage() {
  return (
    <main className="page">
      <Breadcrumbs items={[
        { label: 'Expansions', to: '/pokemon/expansions' },
        { label: 'Shop' }
      ]} />

      <div className="placeholder">
        <div className="placeholder__icon">🛍️</div>
        <h1 className="placeholder__title">Shop Opening Soon</h1>
        <p className="placeholder__text">
          We're preparing an exceptional shopping experience with verified cards,
          competitive pricing, and secure checkout. Join our waitlist to get early access.
        </p>

        <div className="placeholder__features">
          <div className="feature">
            <div className="feature__icon">✓</div>
            <div className="feature__title">Verified Cards</div>
            <div className="feature__desc">Authenticated and graded inventory</div>
          </div>

          <div className="feature">
            <div className="feature__icon">💳</div>
            <div className="feature__title">Secure Payments</div>
            <div className="feature__desc">Stripe integration with buyer protection</div>
          </div>

          <div className="feature">
            <div className="feature__icon">🚚</div>
            <div className="feature__title">Fast Shipping</div>
            <div className="feature__desc">Tracked delivery across Poland & EU</div>
          </div>
        </div>

        <div className="placeholder__actions">
          <a className="btn btnAccent" href="mailto:shop@fromalabastia.com">
            Join Waitlist
          </a>
          <Link className="btn" to="/pokemon/expansions">
            Browse Cards
          </Link>
        </div>

        <div className="placeholder__footnote">
          In the meantime, check out our partners:
          <a href="https://allegro.pl" target="_blank" rel="noopener noreferrer">Allegro</a>
          ·
          <a href="https://cardmarket.com" target="_blank" rel="noopener noreferrer">Cardmarket</a>
        </div>
      </div>
    </main>
  )
}
