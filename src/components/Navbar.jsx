import { Link } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import '../styles/navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/expansions" className="navbar-logo">
          <img src="/logo.png" alt="From Alabastia" className="navbar-logo-img" />
        </Link>
        
        <GlobalSearch />
        
        <div className="navbar-links">
          <Link to="/expansions" className="navbar-link">Expansions</Link>
        </div>
      </div>
    </nav>
  )
}
