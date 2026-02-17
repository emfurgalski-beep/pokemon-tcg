import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_TCG_API_KEY
console.log('API KEY:', API_KEY)

function useSets() {
  const [sets, setSets]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function fetchSets() {
      try {
        const response = await fetch(
          'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate',
          { headers: { 'X-Api-Key': API_KEY } }
        )
        const data = await response.json()
        setSets(data.data)
      } catch (err) {
        setError('Failed to load sets. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchSets()
  }, [])

  return { sets, loading, error }
}

export default useSets