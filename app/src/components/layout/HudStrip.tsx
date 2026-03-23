import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HudStripProps {
  rvol?: number | null
  rsi?: number | null
  rsiDivergence?: string | null
  emaAlignment?: string | null
  vwapPosition?: string | null
  sessionName?: string | null
  barCount?: number | null
  /** When true, all values render as "—" (loading state). */
  loading?: boolean
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricPillProps {
  label: string
  value: React.ReactNode
}

function MetricPill({ label, value }: MetricPillProps) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          'font-mono text-[9px] leading-none uppercase tracking-wider',
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

function Divider() {
  return (
    <div
      className="w-px shrink-0 self-center"
      style={{
        height: '12px',
        backgroundColor: 'var(--color-border-subtle)',
      }}
    />
  )
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function getRvolColor(rvol: number): string {
  if (rvol > 2.0) return 'var(--color-loss)'
  if (rvol > 1.5) return 'var(--color-warning)'
  return 'var(--color-text-secondary)'
}

function getRsiColor(rsi: number): string {
  if (rsi > 70) return 'var(--color-loss)'
  if (rsi < 30) return 'var(--color-profit)'
  return 'var(--color-text-secondary)'
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
  return 'var(--color-text-muted)'
}

function getVwapLabel(position: string): string {
  if (position === 'above') return 'Above'
  if (position === 'below') return 'Below'
  return 'At'
}

function getVwapColor(position: string): string {
  if (position === 'above') return 'var(--color-profit)'
  if (position === 'below') return 'var(--color-loss)'
  return 'var(--color-text-secondary)'
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
  barCount,
  loading = false,
}: HudStripProps) {
  // When loading with no data yet, show placeholder strip
  if (loading && rvol == null && rsi == null && emaAlignment == null && sessionName == null) {
    return (
      <div
        className={cn(
          'flex items-center w-full shrink-0',
          'border-b border-[var(--color-border-subtle)]',
        )}
        style={{
          height: '28px',
          backgroundColor: 'var(--color-surface-secondary)',
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
    rvol != null ||
    rsi != null ||
    rsiDivergence != null ||
    emaAlignment != null ||
    vwapPosition != null ||
    sessionName != null ||
    barCount != null

  if (!hasAnyMetric) return null

  const metrics: React.ReactNode[] = []

  if (rvol != null) {
    metrics.push(
      <MetricPill
        key="rvol"
        label="RVOL"
        value={
          <span style={{ color: getRvolColor(rvol) }}>
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
          <span style={{ color: getRsiColor(rsi) }}>
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
    metrics.push(
      <MetricPill
        key="session"
        label="SESSION"
        value={
          <span style={{ color: 'var(--color-accent)' }}>
            {sessionName}
          </span>
        }
      />,
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

  return (
    <div
      className={cn(
        'flex items-center w-full shrink-0',
        'border-b border-[var(--color-border-subtle)]',
      )}
      style={{
        height: '28px',
        backgroundColor: 'var(--color-surface-secondary)',
        paddingLeft: '16px',
        paddingRight: '16px',
        gap: '8px',
      }}
      role="region"
      aria-label="HUD metrics strip"
    >
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center" style={{ gap: '8px' }}>
          {index > 0 && <Divider />}
          {metric}
        </div>
      ))}
    </div>
  )
}
