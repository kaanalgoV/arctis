import { useState, useEffect, useRef } from 'react'

const ENGINE_URL = 'http://127.0.0.1:8001'
const POLL_INTERVAL_MS = 5000

// ── Types ─────────────────────────────────────────────────────────────────────

export type SetupStatus =
  | 'candidate'
  | 'armed'
  | 'triggered'
  | 'partial_tp1'
  | 'stopped'
  | 'invalidated'
  | 'expired'
  | 'completed'

export interface SetupData {
  setup_id: string
  instrument: string
  timeframe: string
  direction: 'long' | 'short'
  status: SetupStatus
  setup_type: string
  thesis: string
  why_now: string
  why_here: string
  invalidation_reason: string
  entry_zone_low: number
  entry_zone_high: number
  entry_trigger_price: number
  stop_price: number
  tp1_price: number
  tp2_price: number
  risk_reward: number
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  created_ts: number
  armed_ts: number
  entry_ts: number
  exit_ts: number
  exit_reason: string
  source_modules: string[]
}

export interface SetupsResponse {
  setups: SetupData[]
  count: number
  market: string
  timeframe: string
}

// ── Terminal states (historical, dimmed in UI) ────────────────────────────────

export const TERMINAL_STATUSES: SetupStatus[] = [
  'stopped',
  'invalidated',
  'expired',
  'completed',
]

export function isTerminalStatus(status: SetupStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSetups(
  market: string,
  timeframe: string = '1min',
  days: number = 5,
) {
  const [data, setData] = useState<SetupsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSetups = async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const url = `${ENGINE_URL}/api/setups?market=${encodeURIComponent(market)}&timeframe=${encodeURIComponent(timeframe)}&days=${days}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: SetupsResponse = await res.json()
      setData(json)
      setError(null)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    setData(null)
    setError(null)

    void fetchSetups()

    timerRef.current = setInterval(() => {
      void fetchSetups()
    }, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, timeframe, days])

  const activeSetups = data?.setups.filter(s => !isTerminalStatus(s.status)) ?? []
  const historicalSetups = data?.setups.filter(s => isTerminalStatus(s.status)) ?? []

  return {
    data,
    setups: data?.setups ?? [],
    activeSetups,
    historicalSetups,
    count: data?.count ?? 0,
    isLoading,
    error,
  }
}
