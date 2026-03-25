/**
 * SignalOverlay — converts active setup/signal data into chart annotation configs.
 *
 * This is a pure data-transformation module (no React component).
 * It produces ChartSignalLines which ArctisChartWrapper converts into
 * PriceLevel[] and PriceZone[] for CandlestickChart.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Raw setup shape as returned by /api/setups.
 * Only the fields we need are declared here — extra fields are ignored.
 */
export interface Setup {
  id?: string | number
  status: string               // 'armed' | 'qualified' | 'triggered' | 'candidate' | 'invalidated' | 'expired' | 'exited'
  direction: string            // 'long' | 'short'
  setup_type?: string
  entry_trigger: number
  stop_loss: number
  targets?: number[]
}

/**
 * Raw signal shape as returned by /api/signals.
 * Fields match what the Arctis engine returns.
 */
export interface Signal {
  id?: string | number
  type?: string
  direction?: string           // 'long' | 'short'
  price?: number
  entry_price?: number
  stop_price?: number
  target_1?: number
  target_2?: number
}

/**
 * Resolved signal line data ready to be converted into chart annotations.
 * One set of lines = one active signal/setup.
 */
export interface ChartSignalLines {
  entryPrice: number
  stopPrice: number
  target1Price: number
  target2Price?: number
  direction: 'long' | 'short'
  /** Short descriptive label shown on the chart, e.g. "VWAP BOUNCE LONG" */
  label: string
}

// ── Priority order for active statuses ───────────────────────────────────────

const ACTIVE_STATUSES = new Set(['armed', 'qualified', 'triggered', 'candidate'])

const STATUS_PRIORITY: Record<string, number> = {
  armed: 0,
  triggered: 1,
  qualified: 2,
  candidate: 3,
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Convert the best active signal/setup into chart annotation configs.
 *
 * Priority:
 *   1. ARMED / TRIGGERED setup
 *   2. QUALIFIED setup
 *   3. CANDIDATE setup
 *   4. Latest signal (fallback)
 *
 * Returns null if no actionable signal exists.
 * Only ever returns ONE signal — the highest-priority one.
 */
export function buildSignalLines(
  setups: Setup[] | null | undefined,
  signals: Signal[] | null | undefined,
): ChartSignalLines | null {
  // ── Try setups first ──────────────────────────────────────────────────────
  if (setups && setups.length > 0) {
    const activeSetups = setups.filter((s) => ACTIVE_STATUSES.has(s.status))

    if (activeSetups.length > 0) {
      // Sort by status priority (armed first)
      activeSetups.sort(
        (a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99),
      )

      const best = activeSetups[0]
      const rr = best.entry_trigger - best.stop_loss  // positive for long, negative for short
      const target1Fallback = best.entry_trigger + rr * 1.5

      return {
        entryPrice: best.entry_trigger,
        stopPrice: best.stop_loss,
        target1Price: best.targets?.[0] ?? target1Fallback,
        target2Price: best.targets?.[1],
        direction: (best.direction === 'short' ? 'short' : 'long') as 'long' | 'short',
        label: `${best.setup_type ?? best.direction} ${best.direction}`.toUpperCase(),
      }
    }
  }

  // ── Fall back to signals ──────────────────────────────────────────────────
  if (signals && signals.length > 0) {
    const sig = signals[0]
    const basePrice = sig.entry_price ?? sig.price ?? 0
    if (basePrice === 0) return null

    const stopFallback = sig.direction === 'short' ? basePrice + 5 : basePrice - 5
    const target1Fallback = sig.direction === 'short' ? basePrice - 7.5 : basePrice + 7.5

    return {
      entryPrice: basePrice,
      stopPrice: sig.stop_price ?? stopFallback,
      target1Price: sig.target_1 ?? target1Fallback,
      target2Price: sig.target_2,
      direction: (sig.direction === 'short' ? 'short' : 'long') as 'long' | 'short',
      label: `${sig.type ?? sig.direction ?? 'SIGNAL'} ${sig.direction ?? ''}`.trim().toUpperCase(),
    }
  }

  return null
}
