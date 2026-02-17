import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import '../styles/placeholder.css'

export default function BlogPage() {
  return (
    <main className="page">
      <Breadcrumbs items={[
        { label: 'Expansions', to: '/pokemon/expansions' },
        { label: 'Blog' }
      ]} />

      <div className="placeholder">
        <div className="placeholder__icon">📝</div>
        <h1 className="placeholder__title">Blog Coming Soon</h1>
        <p className="placeholder__text">
          We're working on bringing you the latest news, strategies, and insights from the Pokemon TCG world.
          Follow us on social media to stay updated.
        </p>

        <div className="placeholder__features">
          <div className="feature">
            <div className="feature__icon">🎯</div>
            <div className="feature__title">Strategy Guides</div>
            <div className="feature__desc">Deck building tips and meta analysis</div>
          </div>

          <div className="feature">
            <div className="feature__icon">📰</div>
            <div className="feature__title">Latest News</div>
            <div className="feature__desc">Set releases and tournament coverage</div>
          </div>

          <div className="feature">
            <div className="feature__icon">💡</div>
            <div className="feature__title">Collecting Tips</div>
            <div className="feature__desc">Investment advice and market trends</div>
          </div>
        </div>

        <div className="placeholder__actions">
          <Link className="btn btnAccent" to="/pokemon/expansions">
            Browse Expansions
          </Link>
          <a className="btn" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            Follow on Twitter
          </a>
        </div>
      </div>
    </main>
  )
}
