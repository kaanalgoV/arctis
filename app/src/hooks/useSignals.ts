import { useState, useEffect, useCallback } from 'react'
import { useMarketStore } from '../store/market'
import { useSettingsStore } from '../store/settings'

export interface TradeSignal {
  signal_type: string
  direction: 'long' | 'short'
  entry_price: number
  stop_price: number
  target_price: number
  risk_reward: number
  confidence: string
  reason: string
  timestamp: number
}

export function useSignals(maxBars?: number, enabled = true) {
  const { market, timeframe } = useMarketStore()
  const ENGINE = useSettingsStore((s) => s.engineUrl)
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSignals = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ market, timeframe, days: '5' })
      if (maxBars) params.set('max_bars', String(maxBars))
      const res = await fetch(`${ENGINE}/api/signals?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSignals(data.signals || [])
      }
    } catch {} finally { setIsLoading(false) }
  }, [market, timeframe, maxBars, enabled])

  useEffect(() => { fetchSignals() }, [fetchSignals])
  return { signals, isLoading, refetch: fetchSignals }
}
