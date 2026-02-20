const BINDERS_KEY = 'pokemon-binders'

export function getBinders() {
  try {
    return JSON.parse(localStorage.getItem(BINDERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveBinders(data) {
  localStorage.setItem(BINDERS_KEY, JSON.stringify(data))
}

export function createBinder(name, description = '') {
  const binders = getBinders()
  const id = 'binder-' + Date.now()
  binders[id] = { id, name, description, cards: [], createdAt: Date.now() }
  saveBinders(binders)
  return binders[id]
}

export function updateBinder(id, updates) {
  const binders = getBinders()
  if (!binders[id]) return null
  binders[id] = { ...binders[id], ...updates }
  saveBinders(binders)
  return binders[id]
}

export function deleteBinder(id) {
  const binders = getBinders()
  delete binders[id]
  saveBinders(binders)
}

export function addCardToBinder(binderId, card) {
  const binders = getBinders()
  if (!binders[binderId]) return
  const alreadyIn = binders[binderId].cards.some(c => c.id === card.id)
  if (!alreadyIn) {
    binders[binderId].cards.push({
      id: card.id,
      name: card.name,
      image: card.images?.small || card.images?.large || '',
      number: card.number,
      setId: card.set?.id || card.id.split('-')[0] || '',
    })
  }
  saveBinders(binders)
}

export function removeCardFromBinder(binderId, cardId) {
  const binders = getBinders()
  if (!binders[binderId]) return
  binders[binderId].cards = binders[binderId].cards.filter(c => c.id !== cardId)
  saveBinders(binders)
}
