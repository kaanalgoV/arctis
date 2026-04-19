import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HudStripProps {
  rvol?: number | null
  rsi?: number | null
  rsiDivergence?: string | null
  emaAlignment?: string | null
  vwapPosition?: string | null
  sessionName?: string | null
  /** Session progress 0-1 for the thin progress bar under the session label */
  sessionProgress?: number | null
  /** When true the session pill briefly pulses to signal a session transition */
  sessionTransition?: boolean
  barCount?: number | null
  /** When true, all values render as "—" (loading state). */
  loading?: boolean
  /** Current live price */
  currentPrice?: number | null
  /** Session open price for change calculation */
  sessionOpenPrice?: number | null
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricPillProps {
  label: string
  value: React.ReactNode
}

function MetricPill({ label, value }: MetricPillProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'font-mono text-[10px] leading-none uppercase tracking-wide',
          'text-[var(--color-text-muted)]',
        )}
      >
        {label}
      </span>
      <span className="font-mono text-[11px] leading-none tabular-nums">
        {value}
      </span>
    </div>
  )
}

function Divider({ variant = 'subtle' }: { variant?: 'subtle' | 'group' }) {
  return (
    <div
      className="w-px shrink-0 self-center"
      style={{
        height: variant === 'group' ? '16px' : '10px',
        backgroundColor: variant === 'group' ? 'var(--color-border)' : 'var(--color-border-subtle)',
        opacity: variant === 'group' ? 0.9 : 0.6,
      }}
    />
  )
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function getRvolColor(rvol: number): string {
  if (rvol > 2.0) return 'var(--color-accent)'
  if (rvol > 1.5) return 'var(--color-warning, #F7941D)'
  return 'var(--color-text-muted)'
}

function getRsiColor(rsi: number): string {
  if (rsi > 70) return 'var(--color-loss)'
  if (rsi < 30) return 'var(--color-profit)'
  return 'var(--color-text-muted)'
}

function getRsiDivergenceColor(divergence: string): string {
  if (divergence === 'bullish') return 'var(--color-profit)'
  if (divergence === 'bearish') return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function getEmaLabel(alignment: string): string {
  if (alignment === 'bullish') return 'Bull'
  if (alignment === 'bearish') return 'Bear'
  return 'Mix'
}

function getEmaColor(alignment: string): string {
  if (alignment === 'bullish') return 'var(--color-profit)'
  if (alignment === 'bearish') return 'var(--color-loss)'
  return 'var(--color-text-muted)'  // mixed = dimmed
}

function getVwapLabel(position: string): string {
  if (position === 'above') return 'Above'
  if (position === 'below') return 'Below'
  return 'At'
}

function getVwapColor(position: string): string {
  if (position === 'above') return 'var(--color-profit)'
  if (position === 'below') return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

// Placeholder shown while loading
const DASH = (
  <span style={{ color: 'var(--color-text-muted)' }}>—</span>
)

// ── Main Component ────────────────────────────────────────────────────────────

export function HudStrip({
  rvol,
  rsi,
  rsiDivergence,
  emaAlignment,
  vwapPosition,
  sessionName,
  sessionProgress,
  sessionTransition = false,
  barCount,
  loading = false,
  currentPrice,
  sessionOpenPrice,
}: HudStripProps) {
  // Pulse animation state for session transitions
  const [pulsing, setPulsing] = useState(false)
  const prevSessionRef = useRef<string | null | undefined>(sessionName)

  // Price direction tracking
  const prevPriceRef = useRef<number | null>(null)
  const [priceDir, setPriceDir] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (currentPrice != null && prevPriceRef.current != null) {
      if (currentPrice > prevPriceRef.current) setPriceDir('up')
      else if (currentPrice < prevPriceRef.current) setPriceDir('down')
    }
    prevPriceRef.current = currentPrice ?? null
  }, [currentPrice])

  useEffect(() => {
    // Trigger pulse when sessionName changes (session boundary crossed)
    if (
      prevSessionRef.current != null &&
      sessionName != null &&
      prevSessionRef.current !== sessionName
    ) {
      setPulsing(true)
      const timer = setTimeout(() => setPulsing(false), 2000)
      prevSessionRef.current = sessionName
      return () => clearTimeout(timer)
    }
    prevSessionRef.current = sessionName
  }, [sessionName])

  // Also pulse when explicitly triggered by parent
  useEffect(() => {
    if (sessionTransition) {
      setPulsing(true)
      const timer = setTimeout(() => setPulsing(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [sessionTransition])
  // When loading with no data yet, show placeholder strip
  if (loading && rvol == null && rsi == null && emaAlignment == null && sessionName == null && currentPrice == null) {
    return (
      <div
        className={cn(
          'flex items-center w-full shrink-0',
          'bg-[var(--color-surface-secondary)]/90 backdrop-blur-sm',
          'shadow-[0_1px_0_var(--color-border-subtle)]',
        )}
        style={{
          height: 'var(--hudstrip-height, 32px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          gap: '8px',
        }}
        role="region"
        aria-label="HUD metrics strip"
      >
        {(['RVOL', 'RSI', 'EMA', 'VWAP', 'SESSION'] as const).map((label, index) => (
          <div key={label} className="flex items-center" style={{ gap: '8px' }}>
            {index > 0 && <Divider />}
            <MetricPill label={label} value={DASH} />
          </div>
        ))}
      </div>
    )
  }

  const hasAnyMetric =
    currentPrice != null ||
    rvol != null ||
    rsi != null ||
    rsiDivergence != null ||
    emaAlignment != null ||
    vwapPosition != null ||
    sessionName != null ||
    barCount != null

  if (!hasAnyMetric) return null

  const metrics: React.ReactNode[] = []

  // Live price — always shown first when available
  if (currentPrice != null) {
    const priceColor =
      priceDir === 'up'
        ? 'var(--color-profit)'
        : priceDir === 'down'
          ? 'var(--color-loss)'
          : 'var(--color-text-secondary)'

    const sessionChange = sessionOpenPrice != null ? currentPrice - sessionOpenPrice : null
    const changePct = sessionChange != null && sessionOpenPrice != null
      ? (sessionChange / sessionOpenPrice) * 100
      : null

    metrics.push(
      <div key="price" className="flex items-center gap-1.5">
        <span
          className="font-mono text-[12px] font-bold leading-none tabular-nums"
          style={{ color: priceColor, letterSpacing: '-0.01em' }}
        >
          {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {priceDir && (
          <span
            className="font-mono text-[10px] leading-none"
            style={{ color: priceColor }}
          >
            {priceDir === 'up' ? '▲' : '▼'}
          </span>
        )}
        {sessionChange != null && changePct != null && (
          <span
            className="font-mono text-[10px] leading-none tabular-nums"
            style={{ color: sessionChange >= 0 ? 'var(--color-profit)' : 'var(--color-loss)' }}
          >
            {sessionChange >= 0 ? '+' : ''}{sessionChange.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        )}
      </div>,
    )
  }

  if (rvol != null) {
    metrics.push(
      <MetricPill
        key="rvol"
        label="RVOL"
        value={
          <span className="tabular-nums" style={{ color: getRvolColor(rvol) }}>
            {rvol.toFixed(1)}x
          </span>
        }
      />,
    )
  }

  if (rsi != null) {
    metrics.push(
      <MetricPill
        key="rsi"
        label="RSI"
        value={
          <span className="tabular-nums" style={{ color: getRsiColor(rsi) }}>
            {rsi.toFixed(1)}
          </span>
        }
      />,
    )
  }

  if (rsiDivergence != null) {
    const lower = rsiDivergence.toLowerCase()
    metrics.push(
      <MetricPill
        key="rsi-div"
        label="DIV"
        value={
          <span style={{ color: getRsiDivergenceColor(lower) }}>
            {rsiDivergence.charAt(0).toUpperCase() + rsiDivergence.slice(1).toLowerCase()}
          </span>
        }
      />,
    )
  }

  if (emaAlignment != null) {
    const lower = emaAlignment.toLowerCase()
    metrics.push(
      <MetricPill
        key="ema"
        label="EMA"
        value={
          <span style={{ color: getEmaColor(lower) }}>
            {getEmaLabel(lower)}
          </span>
        }
      />,
    )
  }

  if (vwapPosition != null) {
    const lower = vwapPosition.toLowerCase()
    metrics.push(
      <MetricPill
        key="vwap"
        label="VWAP"
        value={
          <span style={{ color: getVwapColor(lower) }}>
            {getVwapLabel(lower)}
          </span>
        }
      />,
    )
  }

  if (sessionName != null) {
    const progressPct = sessionProgress != null ? Math.round(sessionProgress * 100) : null
    metrics.push(
      <div key="session" className="flex flex-col justify-center gap-[2px]">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-mono text-[10px] leading-none uppercase tracking-wide',
              'text-[var(--color-text-muted)]',
            )}
          >
            SESSION
          </span>
          <span
            className={cn(
              'font-mono text-[11px] leading-none tabular-nums transition-colors duration-300',
              pulsing && 'text-[var(--color-accent)]',
            )}
            style={{ color: pulsing ? 'var(--color-accent, #5CB8F0)' : 'var(--color-text-secondary)' }}
          >
            {sessionName}
          </span>
          {progressPct != null && (
            <span
              className="font-mono text-[9px] leading-none tabular-nums opacity-60"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {progressPct}%
            </span>
          )}
        </div>
        {/* Thin progress bar under session label */}
        {progressPct != null && (
          <div
            className="h-[2px] rounded-full overflow-hidden"
            style={{ width: '72px', backgroundColor: 'var(--color-border-subtle)' }}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                pulsing && 'animate-pulse',
              )}
              style={{
                width: `${progressPct}%`,
                backgroundColor: 'var(--color-accent, #5CB8F0)',
                opacity: 0.7,
              }}
            />
          </div>
        )}
      </div>,
    )
  }

  if (barCount != null) {
    metrics.push(
      <MetricPill
        key="bars"
        label="BARS"
        value={
          <span style={{ color: 'var(--color-text-muted)' }}>
            {barCount}
          </span>
        }
      />,
    )
  }

  // ── Semantic grouping ─────────────────────────────────────────────────────
  // Group 1: Price (live price + change) — highest visual weight, leftmost.
  // Group 2: Market state (RVOL, RSI, DIV, EMA, VWAP) — the core indicator read.
  // Group 3: Context (SESSION, BARS) — orientation / metadata, rightmost.
  const priceGroup: React.ReactNode[] = []
  const stateGroup: React.ReactNode[] = []
  const contextGroup: React.ReactNode[] = []

  metrics.forEach((m) => {
    if (!m || typeof m !== 'object' || !('key' in m)) return
    const key = (m as { key: string }).key
    if (key === 'price') priceGroup.push(m)
    else if (key === 'session' || key === 'bars') contextGroup.push(m)
    else stateGroup.push(m)
  })

  const groups = [priceGroup, stateGroup, contextGroup].filter((g) => g.length > 0)

  return (
    <div
      className={cn(
        'flex items-center w-full shrink-0',
        'bg-[var(--color-surface-secondary)]/90 backdrop-blur-sm',
        'shadow-[0_1px_0_var(--color-border-subtle)]',
      )}
      style={{
        height: 'var(--hudstrip-height, 32px)',
        paddingLeft: '16px',
        paddingRight: '16px',
        gap: '16px',
      }}
      role="region"
      aria-label="HUD metrics strip"
    >
      {groups.map((group, gi) => (
        <div
          key={gi}
          className="flex items-center"
          style={{ gap: '10px' }}
        >
          {gi > 0 && <Divider variant="group" />}
          {group.map((m, i) => (
            <div key={i} className="flex items-center" style={{ gap: '10px' }}>
              {i > 0 && <Divider variant="subtle" />}
              {m}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
