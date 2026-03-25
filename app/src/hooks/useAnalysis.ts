import { useState, useEffect, useCallback, useRef } from 'react'
import { useMarketStore } from '../store/market'
import * as api from '../api'

interface AnalysisData {
  sessions: any | null
  confluence: any | null
  patterns: any | null
  indicators: any | null
  volume: any | null
  structure: any | null
  config: any | null
  bias: any | null
  zones: any | null
  signals: any | null
}

export function useAnalysis(pollIntervalMs = 5000) {
  const { market, timeframe, lastBarTs } = useMarketStore()
  const [data, setData] = useState<AnalysisData>({
    sessions: null, confluence: null, patterns: null,
    indicators: null, volume: null, structure: null,
    config: null, bias: null, zones: null, signals: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const fetchAll = useCallback(async () => {
    try {
      const snapshot = await api.fetchSnapshot(market, timeframe)
      setData({
        sessions:    snapshot.sessions    ?? null,
        confluence:  snapshot.confluence  ?? null,
        patterns:    snapshot.patterns    ?? null,
        indicators:  snapshot.indicators  ?? null,
        volume:      snapshot.volume      ?? null,
        structure:   snapshot.structure   ?? null,
        config:      snapshot.config      ?? null,
        bias:        snapshot.bias        ?? null,
        zones:       snapshot.zones       ?? null,
        signals:     snapshot.signals     ?? null,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis fetch failed')
    } finally {
      setIsLoading(false)
    }
  }, [market, timeframe])

  // Initial fetch + polling
  useEffect(() => {
    setIsLoading(true)
    fetchAll()
    intervalRef.current = setInterval(fetchAll, pollIntervalMs)
    return () => clearInterval(intervalRef.current)
  }, [fetchAll, pollIntervalMs])

  // Refetch on new bar
  useEffect(() => {
    if (lastBarTs) void fetchAll()
  }, [lastBarTs, fetchAll])

  return { ...data, isLoading, error, refetch: fetchAll }
}
