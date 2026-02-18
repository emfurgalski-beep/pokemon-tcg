import { Link } from 'react-router-dom'
import '../styles/breadcrumbs.css'

/**
 * Breadcrumbs component
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Expansions', to: '/pokemon/expansions' },
 *     { label: 'Base Set', to: '/pokemon/expansions/base1' },
 *     { label: 'Charizard' }
 *   ]} />
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1

          return (
            <li key={i} className="breadcrumbs__item">
              {!isLast && item.to ? (
                <Link className="breadcrumbs__link" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs__current">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
