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
  cum_delta: any | null
}

export function useAnalysis(pollIntervalMs = 5000) {
  const { market, timeframe, days, lastBarTs } = useMarketStore()
  const [data, setData] = useState<AnalysisData>({
    sessions: null, confluence: null, patterns: null,
    indicators: null, volume: null, structure: null,
    config: null, bias: null, zones: null, signals: null,
    cum_delta: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchAll = useCallback(async () => {
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      // Fetch snapshot and cum_delta in parallel; cum_delta failure is non-fatal
      const [snapshot, cumDeltaResult] = await Promise.all([
        api.fetchSnapshot(market, timeframe, days),
        api.fetchCumDelta(market, timeframe, days).catch(() => null),
      ])

      // If this request was aborted while awaiting, discard the result
      if (controller.signal.aborted) return

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
        cum_delta:   cumDeltaResult       ?? null,
      })
      setError(null)
    } catch (e) {
      // Ignore abort errors — they are expected on market/timeframe change
      if (controller.signal.aborted) return
      const msg = e instanceof Error ? e.message : 'Analysis fetch failed'
      setError(msg)
      // Auto-retry after 5s on failure
      clearTimeout(retryRef.current)
      retryRef.current = setTimeout(() => { void fetchAll() }, 5000)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [market, timeframe, days])

  // Initial fetch + polling — abort on cleanup or dependency change
  useEffect(() => {
    setIsLoading(true)
    fetchAll()
    intervalRef.current = setInterval(fetchAll, pollIntervalMs)
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(retryRef.current)
      abortRef.current?.abort()
    }
  }, [fetchAll, pollIntervalMs])

  // Refetch on new bar
  useEffect(() => {
    if (lastBarTs) void fetchAll()
  }, [lastBarTs, fetchAll])

  return { ...data, isLoading, error, refetch: fetchAll }
}
