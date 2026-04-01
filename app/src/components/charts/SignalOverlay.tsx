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
  // Backend field names (from /api/setups SetupData)
  entry_trigger_price?: number
  stop_price?: number
  tp1_price?: number
  tp2_price?: number
  // Legacy / alternative field names
  entry_trigger?: number
  stop_loss?: number
  targets?: number[]
}

/**
 * Raw signal shape — accepts both standalone /api/signals format
 * (entry_price, stop_price, target_1) and snapshot /api/snapshot format
 * (entry, stop, target).
 */
export interface Signal {
  id?: string | number
  type?: string
  direction?: string           // 'long' | 'short'
  price?: number
  // Standalone /api/signals field names
  entry_price?: number
  stop_price?: number
  target_1?: number
  target_2?: number
  // Snapshot /api/snapshot field names
  entry?: number
  stop?: number
  target?: number
  rr?: number
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

// ── Direction consistency guard ────────────────────────────────────────────────

/**
 * Validate that stop/target are on the correct side of entry for the direction.
 *
 * LONG:  stop < entry, target > entry
 * SHORT: stop > entry, target < entry
 *
 * Returns null if the signal is directionally inconsistent — prevents confusing
 * chart annotations where stop is above entry for a long trade (or vice versa).
 */
function validateDirectionConsistency(lines: ChartSignalLines): ChartSignalLines | null {
  const { direction, entryPrice, stopPrice, target1Price } = lines

  if (direction === 'long') {
    // Long: stop must be below entry, target must be above
    if (stopPrice >= entryPrice || target1Price <= entryPrice) return null
  } else {
    // Short: stop must be above entry, target must be below
    if (stopPrice <= entryPrice || target1Price >= entryPrice) return null
  }

  return lines
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
 *
 * All results are validated for direction consistency: stop must be on the
 * opposite side of entry from target. Inconsistent signals are discarded.
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
      // Support both backend field names (entry_trigger_price) and legacy (entry_trigger)
      const entryVal = best.entry_trigger_price ?? best.entry_trigger ?? 0
      const stopVal = best.stop_price ?? best.stop_loss ?? 0
      if (entryVal === 0 || stopVal === 0) return null

      const rr = entryVal - stopVal  // positive for long, negative for short
      const target1Fallback = entryVal + rr * 1.5

      return validateDirectionConsistency({
        entryPrice: entryVal,
        stopPrice: stopVal,
        target1Price: best.tp1_price ?? best.targets?.[0] ?? target1Fallback,
        target2Price: best.tp2_price ?? best.targets?.[1],
        direction: (best.direction === 'short' ? 'short' : 'long') as 'long' | 'short',
        label: `${best.setup_type ?? best.direction} ${best.direction}`.toUpperCase(),
      })
    }
  }

  // ── Fall back to signals ───────────��──────────────────────────────────────
  if (signals && signals.length > 0) {
    // Filter out stale signals: only show signals from the last 30 minutes.
    // Signal timestamps are Unix seconds (from the bar that triggered them).
    const now = Math.floor(Date.now() / 1000)
    const MAX_AGE_S = 30 * 60  // 30 minutes
    const fresh = signals.filter((s) => {
      const ts = (s as any).timestamp
      if (typeof ts !== 'number' || ts <= 0) return true  // no timestamp = keep
      return now - ts <= MAX_AGE_S
    })
    if (fresh.length === 0) return null

    // Pick the most recent signal (highest timestamp)
    const sig = fresh.reduce((best, cur) => {
      const bestTs = (best as any).timestamp ?? 0
      const curTs = (cur as any).timestamp ?? 0
      return curTs > bestTs ? cur : best
    }, fresh[0])
    // Support both standalone API (entry_price) and snapshot (entry) field names
    const basePrice = sig.entry_price ?? sig.entry ?? sig.price ?? 0
    if (basePrice === 0) return null

    const stopFallback = sig.direction === 'short' ? basePrice + 5 : basePrice - 5
    const target1Fallback = sig.direction === 'short' ? basePrice - 7.5 : basePrice + 7.5

    return validateDirectionConsistency({
      entryPrice: basePrice,
      stopPrice: sig.stop_price ?? sig.stop ?? stopFallback,
      target1Price: sig.target_1 ?? sig.target ?? target1Fallback,
      target2Price: sig.target_2,
      direction: (sig.direction === 'short' ? 'short' : 'long') as 'long' | 'short',
      label: `${sig.type ?? sig.direction ?? 'SIGNAL'} ${sig.direction ?? ''}`.trim().toUpperCase(),
    })
  }

  return null
}
