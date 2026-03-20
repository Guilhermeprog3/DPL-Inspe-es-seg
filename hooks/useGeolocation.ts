'use client'
import { useState, useCallback } from 'react'

interface Coords {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste dispositivo')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return { coords, error, loading, capture }
}
