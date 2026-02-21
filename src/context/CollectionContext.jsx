import { createContext, useContext, useState, useCallback } from 'react'
import { getOwned, getBinders, getWishlist } from '../utils/collection'

const COLLECTION_KEY = 'pokemon-collection'
const BINDERS_KEY = 'pokemon-binders'
const WISHLIST_KEY = 'pokemon-wishlist'

const CollectionContext = createContext(null)

function toEntry(card) {
  return {
    count: 1,
    name: card.name,
    image: card.images?.small || card.images?.large,
    setId: card.set?.id,
    setName: card.set?.name,
    setTotal: card.set?.total,
    rarity: card.rarity,
    number: card.number,
  }
}

export function CollectionProvider({ children }) {
  const [owned, setOwned] = useState(getOwned)
  const [binders, setBinders] = useState(getBinders)
  const [wishlist, setWishlist] = useState(getWishlist)

  // ---- Collection ----

  const toggleCard = useCallback((card) => {
    setOwned(prev => {
      const next = prev[card.id]
        ? (({ [card.id]: _, ...r }) => r)(prev)
        : { ...prev, [card.id]: toEntry(card) }
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addCopy = useCallback((card) => {
    setOwned(prev => {
      const existing = prev[card.id]
      const next = existing
        ? { ...prev, [card.id]: { ...existing, count: existing.count + 1 } }
        : { ...prev, [card.id]: toEntry(card) }
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeCopy = useCallback((cardId) => {
    setOwned(prev => {
      const existing = prev[cardId]
      if (!existing) return prev
      const next = existing.count <= 1
        ? (({ [cardId]: _, ...r }) => r)(prev)
        : { ...prev, [cardId]: { ...existing, count: existing.count - 1 } }
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isOwned = useCallback((cardId) => Boolean(owned[cardId]), [owned])
  const getCount = useCallback((cardId) => owned[cardId]?.count || 0, [owned])
  const uniqueCards = Object.keys(owned).length
  const totalCopies = Object.values(owned).reduce((s, e) => s + (e.count || 1), 0)

  // ---- Binders ----

  const createBinder = useCallback((name) => {
    const id = `binder-${Date.now()}`
    setBinders(prev => {
      const next = { ...prev, [id]: { id, name, createdAt: Date.now(), cards: {} } }
      localStorage.setItem(BINDERS_KEY, JSON.stringify(next))
      return next
    })
    return id
  }, [])

  const deleteBinder = useCallback((binderId) => {
    setBinders(prev => {
      const { [binderId]: _, ...next } = prev
      localStorage.setItem(BINDERS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const renameBinder = useCallback((binderId, newName) => {
    setBinders(prev => {
      if (!prev[binderId]) return prev
      const next = { ...prev, [binderId]: { ...prev[binderId], name: newName } }
      localStorage.setItem(BINDERS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addCardToBinder = useCallback((binderId, card) => {
    setBinders(prev => {
      if (!prev[binderId]) return prev
      const binder = prev[binderId]
      const next = {
        ...prev,
        [binderId]: {
          ...binder,
          cards: {
            ...binder.cards,
            [card.id]: {
              name: card.name,
              image: card.images?.small || card.images?.large || card.image,
              setId: card.set?.id || card.setId,
              setName: card.set?.name || card.setName,
              rarity: card.rarity,
              number: card.number,
            },
          },
        },
      }
      localStorage.setItem(BINDERS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeCardFromBinder = useCallback((binderId, cardId) => {
    setBinders(prev => {
      if (!prev[binderId]) return prev
      const { [cardId]: _, ...cards } = prev[binderId].cards
      const next = { ...prev, [binderId]: { ...prev[binderId], cards } }
      localStorage.setItem(BINDERS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isInBinder = useCallback(
    (binderId, cardId) => Boolean(binders[binderId]?.cards[cardId]),
    [binders]
  )

  // ---- Wishlist ----

  const toggleWishlist = useCallback((card) => {
    setWishlist(prev => {
      const next = prev[card.id]
        ? (({ [card.id]: _, ...r }) => r)(prev)
        : {
            ...prev,
            [card.id]: {
              name: card.name,
              image: card.images?.small || card.images?.large,
              setId: card.set?.id,
              setName: card.set?.name,
              rarity: card.rarity,
              number: card.number,
            },
          }
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isWishlisted = useCallback((cardId) => Boolean(wishlist[cardId]), [wishlist])

  // ---- Export / Import ----

  const exportFull = useCallback(() => {
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
  }, [owned, binders])

  const importFull = useCallback((jsonString) => {
    const data = JSON.parse(jsonString)
    if (data.collection) {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(data.collection))
      setOwned(data.collection)
    }
    if (data.binders) {
      localStorage.setItem(BINDERS_KEY, JSON.stringify(data.binders))
      setBinders(data.binders)
    }
  }, [])

  return (
    <CollectionContext.Provider
      value={{
        owned, binders, wishlist,
        toggleCard, addCopy, removeCopy,
        isOwned, getCount, uniqueCards, totalCopies,
        createBinder, deleteBinder, renameBinder,
        addCardToBinder, removeCardFromBinder, isInBinder,
        toggleWishlist, isWishlisted,
        exportFull, importFull,
      }}
    >
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider')
  return ctx
}
