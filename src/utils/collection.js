const COLLECTION_KEY = 'pokemon-collection'
const BINDERS_KEY = 'pokemon-binders'
const WISHLIST_KEY = 'pokemon-wishlist'

export function getOwned() {
  try { return JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}') } catch { return {} }
}

export function getBinders() {
  try { return JSON.parse(localStorage.getItem(BINDERS_KEY) || '{}') } catch { return {} }
}

export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '{}') } catch { return {} }
}

// Count unique owned cards belonging to a set
export function countOwnedInSet(setId, ownedData) {
  const data = ownedData || getOwned()
  return Object.values(data).filter(e => e.setId === setId).length
}

// Return array of sets the user has started, with owned/copies counts
export function getOwnedSets(ownedData) {
  const data = ownedData || getOwned()
  const sets = {}
  Object.values(data).forEach(entry => {
    if (!entry.setId) return
    const k = entry.setId
    if (!sets[k]) {
      sets[k] = {
        setId: k,
        setName: entry.setName || k,
        setTotal: entry.setTotal || null,
        owned: 0,
        copies: 0,
      }
    }
    sets[k].owned++
    sets[k].copies += entry.count || 1
  })
  return Object.values(sets)
}

// Trigger a JSON file download with the full collection export
export function exportCollection(owned, binders) {
  const json = JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), collection: owned, binders },
    null, 2
  )
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pokemon-collection-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Parse an import JSON string; throws on invalid input
export function importCollection(jsonString) {
  const data = JSON.parse(jsonString)
  if (!data.collection) throw new Error('Invalid file: missing collection data')
  return { collection: data.collection, binders: data.binders || {} }
}
