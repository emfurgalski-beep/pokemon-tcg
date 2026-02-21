import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import ShareButton from '../components/ShareButton'
import SEO from '../components/SEO'
import { getMockPrice } from '../utils/pricing'
import { useCollection } from '../context/CollectionContext'
import '../styles/card.css'
import '../styles/collection.css'

export default function CardPage() {
  const { cardId } = useParams()
  const location = useLocation()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [binderOpen, setBinderOpen] = useState(false)

  const {
    toggleCard, addCopy, removeCopy, isOwned, getCount,
    toggleWishlist, isWishlisted,
    binders, addCardToBinder, removeCardFromBinder, isInBinder,
  } = useCollection()

  useEffect(() => {
    loadCard()
  }, [cardId])

  // Close binder dropdown when clicking outside
  useEffect(() => {
    if (!binderOpen) return
    function handler(e) {
      if (!e.target.closest('.binder-dropdown-wrapper')) setBinderOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [binderOpen])

  async function loadCard() {
    try {
      setLoading(true)
      const response = await fetch(`/api/tcg?endpoint=card&id=${cardId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      setCard(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading card...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!card) return <div className="error">Card not found</div>

  const owned = isOwned(card.id)
  const count = getCount(card.id)
  const wishlisted = isWishlisted(card.id)
  const binderEntries = Object.values(binders)

  return (
    <div className="card-page">
      <SEO
        title={`${card.name} - ${card.set?.name || 'Pokemon TCG'}`}
        description={`${card.name} from ${card.set?.name || 'Pokemon TCG'}. ${card.hp ? `HP: ${card.hp}` : ''} ${card.types ? card.types.join(', ') + ' type' : ''}`}
        image={card.images?.large || card.images?.small}
        type="article"
      />

      <div className="container">
        <Breadcrumbs items={[
          { label: 'Expansions', to: '/expansions' },
          { label: card.set?.name || 'Set', to: `/expansions/${card.set?.id}` },
          { label: card.name },
        ]} />

        <div className="card-actions">
          <BackButton fallbackPath={`/expansions/${card.set?.id}`} label="Back to Set" />
          <ShareButton
            title={`${card.name} - ${card.set?.name || 'Pokemon TCG'}`}
            url={window.location.origin + location.pathname}
          />
        </div>

        <div className="card-content">
          {/* Left: Card Image */}
          <div className="card-image-section">
            <img
              src={card.images?.large || card.images?.small}
              alt={card.name}
              className="card-large-image"
            />
          </div>

          {/* Right: Card Details */}
          <div className="card-details-section">
            <h1 className="card-title">{card.name}</h1>

            <div className="market-value">
              <span className="market-value-label">Market Value</span>
              <span className="market-value-price">${getMockPrice(card)}</span>
            </div>

            {/* ---- Collection toggle ---- */}
            <button
              className={`collection-toggle-btn${owned ? ' is-owned' : ''}`}
              onClick={() => toggleCard(card)}
            >
              <span className="collection-toggle-icon">{owned ? '✓' : '+'}</span>
              {owned ? 'In My Collection' : 'Add to Collection'}
              {owned && (
                <span className="collection-btn-copies">
                  {count} cop{count === 1 ? 'y' : 'ies'}
                </span>
              )}
            </button>

            {owned && (
              <div className="card-copy-row">
                <button
                  className="collection-qty-btn"
                  onClick={() => removeCopy(card.id)}
                  title="Remove one copy"
                >− Remove copy</button>
                <span className="collection-qty">{count}</span>
                <button
                  className="collection-qty-btn"
                  onClick={() => addCopy(card)}
                  title="Add another copy"
                >+ Add copy</button>
              </div>
            )}

            {/* ---- Wishlist + Binder row ---- */}
            <div className="card-secondary-actions">
              <button
                className={`wishlist-btn${wishlisted ? ' wishlisted' : ''}`}
                onClick={() => toggleWishlist(card)}
                title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                {wishlisted ? '★ On Wishlist' : '☆ Add to Wishlist'}
              </button>

              {binderEntries.length > 0 && (
                <div className="binder-dropdown-wrapper">
                  <button
                    className="binder-btn"
                    onClick={() => setBinderOpen(v => !v)}
                  >
                    🗂 Binders
                  </button>
                  {binderOpen && (
                    <div className="binder-dropdown">
                      <div className="binder-dropdown-title">Add / Remove from Binder</div>
                      {binderEntries.map(binder => {
                        const inBinder = isInBinder(binder.id, card.id)
                        return (
                          <button
                            key={binder.id}
                            className={`binder-dropdown-item${inBinder ? ' in-binder' : ''}`}
                            onClick={() => {
                              inBinder
                                ? removeCardFromBinder(binder.id, card.id)
                                : addCardToBinder(binder.id, card)
                            }}
                          >
                            {inBinder ? '✓ ' : '+ '}{binder.name}
                            <span className="binder-count">
                              {Object.keys(binder.cards).length}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card-meta-row">
              <span className="meta-badge">#{card.number}</span>
              {card.rarity && <span className="meta-badge rarity">{card.rarity}</span>}
              {card.supertype && <span className="meta-badge">{card.supertype}</span>}
            </div>

            <div className="card-section">
              <h2 className="section-title">Set Information</h2>
              <div className="set-info">
                <div className="set-info-row">
                  <span className="label">Set:</span>
                  <span className="value">{card.set?.name}</span>
                </div>
                <div className="set-info-row">
                  <span className="label">Series:</span>
                  <span className="value">{card.set?.series}</span>
                </div>
                <div className="set-info-row">
                  <span className="label">Release Date:</span>
                  <span className="value">{card.set?.releaseDate}</span>
                </div>
                <div className="set-info-row">
                  <span className="label">Card Number:</span>
                  <span className="value">{card.number} / {card.set?.total}</span>
                </div>
              </div>
            </div>

            {card.artist && (
              <div className="card-section">
                <h2 className="section-title">Artist</h2>
                <div className="artist-block">
                  <span className="artist-icon">✦</span>
                  <span className="artist-name">{card.artist}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
