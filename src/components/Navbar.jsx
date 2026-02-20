import { Link } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'
import '../styles/navbar.css'

export default function Navbar() {
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
            <Link to="/collection" className="navbar-link">My Collection</Link>
            <Link to="/binders" className="navbar-link">Binders</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
