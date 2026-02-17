import { Link, NavLink } from 'react-router-dom'
import '../styles/navbar.css'

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link className="nav__brand" to="/pokemon/expansions">
          <span className="nav__bolt">⚡</span>
          <span>From Alabastia</span>
        </Link>

        <nav className="nav__links">
          <NavLink 
            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`} 
            to="/pokemon/expansions"
          >
            Expansions
          </NavLink>
          
          <NavLink 
            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`} 
            to="/blog"
          >
            Blog
          </NavLink>
          
          <NavLink 
            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`} 
            to="/shop"
          >
            Shop
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
