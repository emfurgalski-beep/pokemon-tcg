import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_TCG_API_KEY

function useSets() {
  const [sets, setSets]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function fetchSets() {
      try {
        const response = await fetch('/api/sets')

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        setSets(data.data)

      } catch (err) {
        setError(`Failed to load sets: ${err.message}`)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSets()
  }, [])

  return { sets, loading, error }
}

export default useSets