import { useState, useEffect, useCallback } from 'react'
import { config } from '@/lib/config'

export interface RadarSignal {
  type: string
  direction: string
  entry: number
  stop: number
  target: number
  rr: number
  confidence: string
}

export interface RadarMarket {
  root: string
  name: string
  symbol: string
  price: number
  session: string
  bias_state: string
  bias_score: number
  confluence_score: number
  direction: string
  active_signals: number
  opportunity_score: number
  top_signal?: RadarSignal
}

export function useRadar(pollMs = 10000) {
  const [markets, setMarkets] = useState<RadarMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${config.apiBase}/api/radar/scan?timeframe=15min`)
      if (res.ok) {
        const data = await res.json() as { markets: RadarMarket[] }
        setMarkets(data.markets ?? [])
        setLastScan(new Date())
        setError(null)
      } else {
        setError(`HTTP ${res.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { markets, isLoading, error, lastScan, refresh }
}
