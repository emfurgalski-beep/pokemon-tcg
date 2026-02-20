import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  const [collection, setCollection] = useState(() => {
    try {
      const saved = localStorage.getItem('pokemon-collection')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem('pokemon-collection', JSON.stringify(collection))
  }, [collection])

  // card = { id, name, images, set, rarity, number }
  const toggleCard = useCallback((card) => {
    setCollection(prev => {
      if (prev[card.id]) {
        const { [card.id]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [card.id]: {
          count: 1,
          name: card.name,
          image: card.images?.small || card.images?.large,
          setId: card.set?.id,
          setName: card.set?.name,
          rarity: card.rarity,
          number: card.number,
        },
      }
    })
  }, [])

  const addCopy = useCallback((card) => {
    setCollection(prev => {
      if (prev[card.id]) {
        return { ...prev, [card.id]: { ...prev[card.id], count: prev[card.id].count + 1 } }
      }
      return {
        ...prev,
        [card.id]: {
          count: 1,
          name: card.name,
          image: card.images?.small || card.images?.large,
          setId: card.set?.id,
          setName: card.set?.name,
          rarity: card.rarity,
          number: card.number,
        },
      }
    })
  }, [])

  const removeCopy = useCallback((cardId) => {
    setCollection(prev => {
      const entry = prev[cardId]
      if (!entry) return prev
      if (entry.count <= 1) {
        const { [cardId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [cardId]: { ...entry, count: entry.count - 1 } }
    })
  }, [])

  const isOwned = useCallback((cardId) => Boolean(collection[cardId]), [collection])
  const getCount = useCallback((cardId) => collection[cardId]?.count || 0, [collection])

  const uniqueCards = Object.keys(collection).length
  const totalCopies = Object.values(collection).reduce((sum, e) => sum + e.count, 0)

  return (
    <CollectionContext.Provider value={{
      collection,
      toggleCard,
      addCopy,
      removeCopy,
      isOwned,
      getCount,
      uniqueCards,
      totalCopies,
    }}>
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider')
  return ctx
}
