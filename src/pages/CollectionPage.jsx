import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../context/CollectionContext'
import { getMockPrice, RARITY_ORDER } from '../utils/pricing'
import '../styles/collection.css'

export default function CollectionPage() {
  const { collection, uniqueCards, totalCopies, removeCopy, addCopy, toggleCard } = useCollection()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [groupBySet, setGroupBySet] = useState(false)

  const entries = useMemo(() => Object.entries(collection), [collection])

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return entries.filter(([, card]) => {
      if (!q) return true
      return (
        card.name?.toLowerCase().includes(q) ||
        card.setName?.toLowerCase().includes(q) ||
        card.rarity?.toLowerCase().includes(q) ||
        card.number?.toString().includes(q)
      )
    })
  }, [entries, searchQuery])

  const sortedEntries = useMemo(() => {
    const arr = [...filteredEntries]
    switch (sortBy) {
      case 'name-asc':
        return arr.sort((a, b) => a[1].name.localeCompare(b[1].name))
      case 'name-desc':
        return arr.sort((a, b) => b[1].name.localeCompare(a[1].name))
      case 'value-high':
        return arr.sort((a, b) => (RARITY_ORDER[b[1].rarity] || 0) - (RARITY_ORDER[a[1].rarity] || 0))
      case 'value-low':
        return arr.sort((a, b) => (RARITY_ORDER[a[1].rarity] || 0) - (RARITY_ORDER[b[1].rarity] || 0))
      case 'set':
        return arr.sort((a, b) => {
          const setCompare = (a[1].setName || '').localeCompare(b[1].setName || '')
          if (setCompare !== 0) return setCompare
          return (parseInt(a[1].number) || 0) - (parseInt(b[1].number) || 0)
        })
      case 'copies-desc':
        return arr.sort((a, b) => b[1].count - a[1].count)
      default:
        return arr
    }
  }, [filteredEntries, sortBy])

  const estimatedValue = useMemo(() => {
    return entries.reduce((sum, [id, card]) => {
      const mockCard = { id, rarity: card.rarity }
      return sum + getMockPrice(mockCard) * card.count
    }, 0)
  }, [entries])

  const setGroups = useMemo(() => {
    if (!groupBySet) return null
    const groups = {}
    sortedEntries.forEach(([id, card]) => {
      const key = card.setId || 'unknown'
      if (!groups[key]) groups[key] = { setName: card.setName || 'Unknown Set', setId: card.setId, cards: [] }
      groups[key].cards.push([id, card])
    })
    return Object.values(groups).sort((a, b) => a.setName.localeCompare(b.setName))
  }, [sortedEntries, groupBySet])

  if (uniqueCards === 0) {
    return (
      <div className="collection-page">
        <div className="container">
          <div className="collection-empty">
            <div className="collection-empty-icon">📦</div>
            <h1>Your Collection is Empty</h1>
            <p>Start browsing cards and add them to your collection!</p>
            <Link to="/expansions" className="collection-empty-btn">Browse Expansions</Link>
          </div>
        </div>
      </div>
    )
  }

  const renderCard = ([cardId, card]) => (
    <div key={cardId} className="collection-card-item">
      <Link to={`/cards/${cardId}`} className="collection-card-link">
        <div className="collection-card-image-wrapper">
          {card.image ? (
            <img src={card.image} alt={card.name} className="collection-card-image" loading="lazy" />
          ) : (
            <div className="collection-card-no-image">?</div>
          )}
          {card.count > 1 && (
            <div className="collection-copy-badge">x{card.count}</div>
          )}
        </div>
        <div className="collection-card-info">
          <div className="collection-card-name">{card.name}</div>
          <div className="collection-card-meta">
            <span className="collection-card-number">#{card.number}</span>
            {card.rarity && <span className="collection-card-rarity">{card.rarity}</span>}
          </div>
          {card.setName && (
            <div className="collection-card-set">{card.setName}</div>
          )}
        </div>
      </Link>
      <div className="collection-card-actions">
        <button
          className="collection-qty-btn"
          onClick={() => removeCopy(cardId)}
          title="Remove one copy"
        >−</button>
        <span className="collection-qty">{card.count}</span>
        <button
          className="collection-qty-btn"
          onClick={() => addCopy({ id: cardId, ...card, images: { small: card.image }, set: { id: card.setId, name: card.setName } })}
          title="Add one copy"
        >+</button>
        <button
          className="collection-remove-btn"
          onClick={() => toggleCard({ id: cardId })}
          title="Remove from collection"
        >✕</button>
      </div>
    </div>
  )

  return (
    <div className="collection-page">
      <div className="collection-header">
        <div className="container">
          <h1 className="collection-title">My Collection</h1>
          <div className="collection-stats">
            <div className="collection-stat">
              <span className="collection-stat-value">{uniqueCards}</span>
              <span className="collection-stat-label">Unique Cards</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value">{totalCopies}</span>
              <span className="collection-stat-label">Total Copies</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value collection-stat-value--green">${estimatedValue.toFixed(2)}</span>
              <span className="collection-stat-label">Est. Value</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="collection-controls">
          <input
            type="search"
            placeholder="Search by name, set, or rarity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="collection-controls-right">
            <div className="sort-dropdown">
              <label htmlFor="collection-sort" className="sort-label">Sort By</label>
              <select
                id="collection-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="set">By Set</option>
                <option value="value-high">Value High to Low</option>
                <option value="value-low">Value Low to High</option>
                <option value="copies-desc">Most Copies</option>
              </select>
            </div>
            <label className="variants-toggle">
              <input
                type="checkbox"
                checked={groupBySet}
                onChange={(e) => setGroupBySet(e.target.checked)}
              />
              <span>Group by Set</span>
            </label>
            <div className="cards-count">
              {filteredEntries.length} / {uniqueCards} cards
            </div>
          </div>
        </div>

        {groupBySet && setGroups ? (
          setGroups.map(group => (
            <div key={group.setId} className="collection-set-group">
              <div className="collection-set-group-header">
                <h2 className="collection-set-group-title">
                  <Link to={`/expansions/${group.setId}`}>{group.setName}</Link>
                </h2>
                <span className="collection-set-group-count">{group.cards.length} cards</span>
              </div>
              <div className="collection-cards-grid">
                {group.cards.map(renderCard)}
              </div>
            </div>
          ))
        ) : (
          <div className="collection-cards-grid">
            {sortedEntries.map(renderCard)}
          </div>
        )}
      </div>
    </div>
  )
}
