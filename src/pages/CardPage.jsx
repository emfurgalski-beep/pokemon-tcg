import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import '../styles/card.css'

export default function CardPage() {
  const { cardId } = useParams()
  const [card, setCard] = useState(null)
  const [setInfo, setSetInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCard()
  }, [cardId])

  async function loadCard() {
    try {
      setLoading(true)
      console.log('Loading card:', cardId)
      
      const response = await fetch(`/api/tcg?endpoint=card&id=${cardId}`)
      const data = await response.json()
      
      console.log('Card response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      
      setCard(data.data)

      // Load full set info for breadcrumbs
      if (data.data?.set?.id) {
        const setsResponse = await fetch('/api/tcg?endpoint=sets')
        const setsData = await setsResponse.json()
        const fullSetInfo = setsData.data?.find(s => s.id === data.data.set.id)
        setSetInfo(fullSetInfo || data.data.set)
      }
    } catch (err) {
      console.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading card...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (!card) {
    return <div className="error">Card not found</div>
  }

  return (
    <div className="card-page">
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Expansions', to: '/expansions' },
          { label: setInfo?.name || card.set?.name || 'Set', to: `/expansions/${card.set?.id}` },
          { label: card.name }
        ]} />

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
            
            <div className="card-meta-row">
              <span className="meta-badge">#{card.number}</span>
              {card.rarity && (
                <span className="meta-badge rarity">{card.rarity}</span>
              )}
              {card.supertype && (
                <span className="meta-badge">{card.supertype}</span>
              )}
            </div>

            {/* Pokemon-specific details */}
            {card.supertype === 'Pokémon' && (
              <>
                <div className="card-info-grid">
                  {card.hp && (
                    <div className="info-item">
                      <div className="info-label">HP</div>
                      <div className="info-value">{card.hp}</div>
                    </div>
                  )}
                  {card.types && card.types.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Type</div>
                      <div className="info-value">{card.types.join(', ')}</div>
                    </div>
                  )}
                  {card.subtypes && card.subtypes.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Subtype</div>
                      <div className="info-value">{card.subtypes.join(', ')}</div>
                    </div>
                  )}
                  {card.evolvesFrom && (
                    <div className="info-item">
                      <div className="info-label">Evolves From</div>
                      <div className="info-value">{card.evolvesFrom}</div>
                    </div>
                  )}
                </div>

                {/* Attacks */}
                {card.attacks && card.attacks.length > 0 && (
                  <div className="card-section">
                    <h2 className="section-title">Attacks</h2>
                    <div className="attacks-list">
                      {card.attacks.map((attack, idx) => (
                        <div key={idx} className="attack-item">
                          <div className="attack-header">
                            <div className="attack-cost">
                              {attack.cost?.map((energy, i) => (
                                <span key={i} className="energy-icon">{energy}</span>
                              ))}
                            </div>
                            <div className="attack-name">{attack.name}</div>
                            {attack.damage && (
                              <div className="attack-damage">{attack.damage}</div>
                            )}
                          </div>
                          {attack.text && (
                            <div className="attack-text">{attack.text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abilities */}
                {card.abilities && card.abilities.length > 0 && (
                  <div className="card-section">
                    <h2 className="section-title">Abilities</h2>
                    <div className="abilities-list">
                      {card.abilities.map((ability, idx) => (
                        <div key={idx} className="ability-item">
                          <div className="ability-name">
                            {ability.name} <span className="ability-type">({ability.type})</span>
                          </div>
                          <div className="ability-text">{ability.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses & Resistances */}
                <div className="card-info-grid">
                  {card.weaknesses && card.weaknesses.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Weakness</div>
                      <div className="info-value">
                        {card.weaknesses.map(w => `${w.type} ${w.value}`).join(', ')}
                      </div>
                    </div>
                  )}
                  {card.resistances && card.resistances.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Resistance</div>
                      <div className="info-value">
                        {card.resistances.map(r => `${r.type} ${r.value}`).join(', ')}
                      </div>
                    </div>
                  )}
                  {card.retreatCost && card.retreatCost.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Retreat Cost</div>
                      <div className="info-value">{card.retreatCost.length}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Trainer/Energy card text */}
            {(card.supertype === 'Trainer' || card.supertype === 'Energy') && card.rules && (
              <div className="card-section">
                <h2 className="section-title">Rules</h2>
                <div className="rules-list">
                  {card.rules.map((rule, idx) => (
                    <div key={idx} className="rule-item">{rule}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor Text */}
            {card.flavorText && (
              <div className="card-section">
                <div className="flavor-text">"{card.flavorText}"</div>
              </div>
            )}

            {/* Set Info */}
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

            {/* Artist */}
            {card.artist && (
              <div className="artist-credit">Illustrated by {card.artist}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

