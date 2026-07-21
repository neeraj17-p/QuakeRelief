'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useGPS() {
  const [location, setLocation] = useState<{
    lat: number | null
    lng: number | null
    accuracy: number | null
  }>({ lat: null, lng: null, accuracy: null })

  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser'
      setError(msg)
      toast.error(msg)
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setIsLocating(false)
        setError(null)
      },
      (err) => {
        let msg: string
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Permission denied'
            break
          case err.POSITION_UNAVAILABLE:
            msg = 'Location unavailable'
            break
          case err.TIMEOUT:
            msg = 'Location request timed out'
            break
          default:
            msg = 'An unknown error occurred'
            break
        }
        setError(msg)
        toast.error(msg)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [])

  return { location, isLocating, requestLocation, error }
}