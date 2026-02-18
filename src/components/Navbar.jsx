import { Link } from 'react-router-dom'
import '../styles/navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/expansions" className="navbar-logo">
          ⚡ From Alabastia
        </Link>
        <div className="navbar-links">
          <Link to="/expansions" className="navbar-link">Expansions</Link>
        </div>
      </div>
    </nav>
  )
}
