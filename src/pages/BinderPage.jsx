import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import { getBinders, updateBinder, removeCardFromBinder, deleteBinder } from '../utils/binders'
import '../styles/binders.css'

export default function BinderPage() {
  const { binderId } = useParams()
  const navigate = useNavigate()
  const [binders, setBinders] = useState(() => getBinders())
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const binder = binders[binderId]

  if (!binder) {
    return (
      <div className="binders-page">
        <div className="container">
          <div className="collection-empty">
            <p className="collection-empty-title">Binder not found</p>
            <Link to="/binders" className="collection-btn">Back to Binders</Link>
          </div>
        </div>
      </div>
    )
  }

  function startEdit() {
    setEditName(binder.name)
    setEditDesc(binder.description || '')
    setEditMode(true)
  }

  function handleSaveEdit(e) {
    e.preventDefault()
    if (!editName.trim()) return
    updateBinder(binderId, { name: editName.trim(), description: editDesc.trim() })
    setBinders(getBinders())
    setEditMode(false)
  }

  function handleRemove(cardId) {
    removeCardFromBinder(binderId, cardId)
    setBinders(getBinders())
  }

  function handleDelete() {
    if (!confirm(`Delete binder "${binder.name}"? This cannot be undone.`)) return
    deleteBinder(binderId)
    navigate('/binders')
  }

  return (
    <div className="binders-page">
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Binders', to: '/binders' },
          { label: binder.name }
        ]} />

        <BackButton fallbackPath="/binders" label="Back to Binders" />

        <div className="binder-page-header">
          {editMode ? (
            <form className="binder-edit-form" onSubmit={handleSaveEdit}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="binder-form-input binder-form-input-lg"
                autoFocus
                maxLength={60}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="binder-form-input"
                maxLength={120}
              />
              <div className="binder-edit-actions">
                <button type="submit" className="collection-btn" disabled={!editName.trim()}>Save</button>
                <button type="button" className="collection-btn collection-btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="binder-page-title-row">
                <h1 className="binders-title">{binder.name}</h1>
                <div className="binder-page-actions">
                  <button className="collection-btn collection-btn-secondary" onClick={startEdit}>Edit</button>
                  <button className="binder-danger-btn" onClick={handleDelete}>Delete</button>
                </div>
              </div>
              {binder.description && (
                <p className="binder-page-desc">{binder.description}</p>
              )}
              <p className="binder-page-count">{binder.cards.length} card{binder.cards.length !== 1 ? 's' : ''}</p>
            </>
          )}
        </div>

        {binder.cards.length === 0 ? (
          <div className="collection-empty">
            <div className="collection-empty-icon">🃏</div>
            <p className="collection-empty-title">This binder is empty</p>
            <p className="collection-empty-sub">
              Browse a set and use the <strong>📚</strong> button on any card to add it here.
            </p>
            <Link to="/expansions" className="collection-btn">Browse Expansions</Link>
          </div>
        ) : (
          <div className="binder-cards-grid">
            {binder.cards.map(card => (
              <div key={card.id} className="binder-card-item">
                <Link to={`/cards/${card.id}`} className="binder-card-image-link">
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="binder-card-img" loading="lazy" />
                  ) : (
                    <div className="binder-card-img-placeholder">{card.name?.[0]}</div>
                  )}
                </Link>
                <div className="binder-card-item-info">
                  <Link to={`/cards/${card.id}`} className="binder-card-item-name">{card.name}</Link>
                  <div className="binder-card-item-meta">#{card.number} · {card.setId}</div>
                </div>
                <button
                  className="binder-card-remove"
                  onClick={() => handleRemove(card.id)}
                  title="Remove from binder"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
