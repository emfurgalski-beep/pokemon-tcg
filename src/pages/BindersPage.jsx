import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getBinders, createBinder, deleteBinder } from '../utils/binders'
import '../styles/binders.css'

export default function BindersPage() {
  const [binders, setBinders] = useState(() => getBinders())
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const binderList = Object.values(binders).sort((a, b) => b.createdAt - a.createdAt)

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    createBinder(newName.trim(), newDesc.trim())
    setBinders(getBinders())
    setNewName('')
    setNewDesc('')
    setShowForm(false)
  }

  function handleDelete(id, name) {
    if (!confirm(`Delete binder "${name}"? This cannot be undone.`)) return
    deleteBinder(id)
    setBinders(getBinders())
  }

  return (
    <div className="binders-page">
      <div className="container">
        <div className="binders-header">
          <h1 className="binders-title">My Binders</h1>
          <button className="collection-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Binder'}
          </button>
        </div>

        {showForm && (
          <form className="binder-create-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Binder name (e.g. My Favourite Fire Types)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="binder-form-input"
              autoFocus
              maxLength={60}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="binder-form-input"
              maxLength={120}
            />
            <button type="submit" className="collection-btn" disabled={!newName.trim()}>
              Create Binder
            </button>
          </form>
        )}

        {binderList.length === 0 ? (
          <div className="collection-empty">
            <div className="collection-empty-icon">📚</div>
            <p className="collection-empty-title">No binders yet</p>
            <p className="collection-empty-sub">
              Create a binder to organise any mix of cards across sets — favourite cards, trades, decks, anything.
            </p>
            <button className="collection-btn" onClick={() => setShowForm(true)}>+ New Binder</button>
          </div>
        ) : (
          <div className="binders-grid">
            {binderList.map(binder => (
              <div key={binder.id} className="binder-card">
                <Link to={`/binders/${binder.id}`} className="binder-card-link">
                  <div className="binder-card-cover">
                    {binder.cards.slice(0, 4).map((card, i) => (
                      <img key={card.id} src={card.image} alt={card.name} className={`binder-cover-thumb binder-cover-thumb-${i}`} />
                    ))}
                    {binder.cards.length === 0 && (
                      <div className="binder-cover-empty">No cards yet</div>
                    )}
                  </div>
                  <div className="binder-card-info">
                    <div className="binder-card-name">{binder.name}</div>
                    {binder.description && (
                      <div className="binder-card-desc">{binder.description}</div>
                    )}
                    <div className="binder-card-count">{binder.cards.length} card{binder.cards.length !== 1 ? 's' : ''}</div>
                  </div>
                </Link>
                <button
                  className="binder-delete-btn"
                  onClick={() => handleDelete(binder.id, binder.name)}
                  title="Delete binder"
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
