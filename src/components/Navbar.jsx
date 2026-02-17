import { Link } from 'react-router-dom'

const styles = {
  nav: {
    background: '#1a1d27',
    borderBottom: '2px solid #2a2d3a',
    padding: '0 32px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#f5c842',
  },
  links: {
    display: 'flex',
    gap: '32px',
    listStyle: 'none',
  },
  link: {
    color: '#8888a0',
    fontWeight: '600',
    fontSize: '14px',
  },
}

function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>From Alabastia</Link>
      <ul style={styles.links}>
        <li><Link to="/" style={styles.link}>Sets</Link></li>
        <li><a href="#" style={styles.link}>Blog</a></li>
      </ul>
    </nav>
  )
}

export default Navbar