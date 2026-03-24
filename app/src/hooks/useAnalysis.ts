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
      const tf = timeframe
      const results = await Promise.allSettled([
        api.fetchSessions(market, tf),
        api.fetchConfluence(market, tf),
        api.fetchPatterns(market, tf),
        api.fetchIndicators(market, tf),
        api.fetchVolume(market, tf),
        api.fetchStructure(market, tf),
        api.fetchConfig(),
        api.fetchBias(market, tf),
        api.fetchZones(market, tf),
        api.fetchSignals(market, tf),
      ])

      const getValue = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? r.value : null

      setData({
        sessions: getValue(results[0]),
        confluence: getValue(results[1]),
        patterns: getValue(results[2]),
        indicators: getValue(results[3]),
        volume: getValue(results[4]),
        structure: getValue(results[5]),
        config: getValue(results[6]),
        bias: getValue(results[7]),
        zones: getValue(results[8]),
        signals: getValue(results[9]),
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
