import { Link } from 'react-router-dom'

const styles = {
  card: {
    background: '#1a1d27',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'block',
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'pointer',
  },
  image: {
    width: '100%',
    height: '140px',
    objectFit: 'contain',
    background: '#12151e',
    padding: '16px',
  },
  info: {
    padding: '14px 16px',
    borderTop: '1px solid #2a2d3a',
  },
  name: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '6px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  series: {
    fontSize: '12px',
    color: '#8888a0',
  },
  count: {
    fontSize: '12px',
    color: '#8888a0',
    background: '#0f1117',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid #2a2d3a',
  },
}

function SetCard({ set }) {
  return (
    <Link
      to={`/set/${set.id}`}
      style={styles.card}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = '#f5c842'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#2a2d3a'
      }}
    >
      <img
        src={set.images.logo}
        alt={set.name}
        style={styles.image}
        loading="lazy"
      />
      <div style={styles.info}>
        <div style={styles.name}>{set.name}</div>
        <div style={styles.footer}>
          <span style={styles.series}>{set.series}</span>
          <span style={styles.count}>{set.total} cards</span>
        </div>
      </div>
    </Link>
  )
}

export default SetCard