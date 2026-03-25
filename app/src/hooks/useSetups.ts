import { useState, useEffect, useRef } from 'react'
import { config } from '@/lib/config'

const ENGINE_URL = config.apiBase
const POLL_INTERVAL_MS = 5000

// ── Types ─────────────────────────────────────────────────────────────────────

export type SetupStatus =
  | 'candidate'
  | 'qualified'
  | 'armed'
  | 'triggered'
  | 'in_position'
  | 'partial_taken'
  | 'exited'
  // Legacy / backward-compatible aliases
  | 'partial_tp1'
  | 'stopped'
  | 'completed'
  // Terminal
  | 'invalidated'
  | 'expired'

// Chart artifact types forwarded from the engine
export interface HLineArtifact {
  type: 'hline'
  price: number
  color: string
  dash: 'solid' | 'dashed' | 'dotted'
  label: string
}

export interface BandArtifact {
  type: 'band'
  low: number
  high: number
  color: string
  border: string
}

export type ChartArtifact = HLineArtifact | BandArtifact

export interface ChartArtifacts {
  entry_zone?: BandArtifact
  entry_trigger?: HLineArtifact
  stop?: HLineArtifact
  tp1?: HLineArtifact
  tp2?: HLineArtifact
  [key: string]: ChartArtifact | undefined
}

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
  status_reason: string
  invalidation_reason: string
  // Price levels
  entry_zone_low: number
  entry_zone_high: number
  entry_trigger_price: number
  stop_price: number
  tp1_price: number
  tp2_price: number
  risk_reward: number
  // Context
  confidence: 'high' | 'medium' | 'low'
  bias_direction: string
  confluence_score: number
  evidence: string[]
  source_modules: string[]
  // Chart annotation artifacts
  chart_artifacts: ChartArtifacts
  // Timestamps
  created_ts: number
  qualified_ts: number
  armed_ts: number
  entry_ts: number
  exit_ts: number
  exit_reason: string
  // Outcomes
  entry_price: number | null
  exit_price: number | null
  pnl_ticks: number | null
}

export interface SetupsResponse {
  setups: SetupData[]
  count: number
  market: string
  timeframe: string
}

// ── Terminal states (historical, dimmed in UI) ────────────────────────────────

export const TERMINAL_STATUSES: SetupStatus[] = [
  'exited',
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
