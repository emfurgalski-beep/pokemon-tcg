import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_TCG_API_KEY

function useSets() {
 const response = await fetch('/api/sets')
 const json = await response.json()
setSets(json.data)


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