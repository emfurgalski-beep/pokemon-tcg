const COLLECTION_KEY = 'pokemon-collection'

function getCollection() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}')
    // Migrate old format { [id]: true } → { [id]: { qty, condition, price, name } }
    const result = {}
    for (const [id, val] of Object.entries(raw)) {
      if (val === true) {
        result[id] = { qty: 1, condition: 'NM', price: 0, name: '' }
      } else if (val && typeof val === 'object' && val.qty) {
        result[id] = val
      }
    }
    return result
  } catch {
    return {}
  }
}

function saveCollection(data) {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(data))
}

export function getOwned() {
  return getCollection()
}

export function collectCard(cardId, price, name) {
  const col = getCollection()
  if (!col[cardId]) {
    col[cardId] = { qty: 1, condition: 'NM', price: parseFloat(price) || 0, name: name || '' }
  } else {
    col[cardId] = { ...col[cardId], qty: col[cardId].qty + 1 }
  }
  saveCollection(col)
  return col
}

export function decrementCard(cardId) {
  const col = getCollection()
  if (!col[cardId]) return col
  const newQty = col[cardId].qty - 1
  if (newQty <= 0) {
    delete col[cardId]
  } else {
    col[cardId] = { ...col[cardId], qty: newQty }
  }
  saveCollection(col)
  return col
}

export function setCardCondition(cardId, condition) {
  const col = getCollection()
  if (!col[cardId]) return col
  col[cardId] = { ...col[cardId], condition }
  saveCollection(col)
  return col
}

export function countOwnedInSet(setId, collection) {
  const prefix = setId + '-'
  return Object.keys(collection).filter(id => id.startsWith(prefix)).length
}

export function getTotalValue(collection) {
  return Object.values(collection).reduce((sum, entry) => {
    return sum + (parseFloat(entry.price) || 0) * (entry.qty || 0)
  }, 0)
}

export function getSetValue(setId, collection) {
  const prefix = setId + '-'
  return Object.entries(collection)
    .filter(([id]) => id.startsWith(prefix))
    .reduce((sum, [, entry]) => sum + (parseFloat(entry.price) || 0) * (entry.qty || 0), 0)
}

export function exportCollection() {
  return JSON.stringify(getCollection(), null, 2)
}

export function importCollection(json) {
  const data = JSON.parse(json)
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid collection format')
  }
  saveCollection(data)
}
