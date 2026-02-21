import { Link } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'
import { useCollection } from '../context/CollectionContext'
import '../styles/navbar.css'
import '../styles/collection.css'

export default function Navbar() {
  const { uniqueCards } = useCollection()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/expansions" className="navbar-logo">
          <img src="/logo.png" alt="From Alabastia" className="navbar-logo-img" />
        </Link>

        <GlobalSearch />

        <div className="navbar-right">
          <ThemeToggle />
          <div className="navbar-links">
            <Link to="/expansions" className="navbar-link">Expansions</Link>
            <Link to="/collection" className="navbar-link">
              My Collection
              {uniqueCards > 0 && (
                <span className="collection-badge">{uniqueCards}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
