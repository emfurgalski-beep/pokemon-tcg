const STORAGE_KEY = 'pokemon-collection'

export function getOwned() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function toggleCard(cardId) {
  const owned = getOwned()
  if (owned[cardId]) {
    delete owned[cardId]
  } else {
    owned[cardId] = true
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(owned))
  return owned
}

export function countOwnedInSet(setId, owned) {
  const prefix = setId + '-'
  return Object.keys(owned).filter(id => id.startsWith(prefix)).length
}

export function exportCollection() {
  return JSON.stringify(getOwned(), null, 2)
}

export function importCollection(json) {
  const data = JSON.parse(json)
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid collection format')
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
