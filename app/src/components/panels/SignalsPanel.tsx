import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Signal {
  direction: string
  type: string
  entry: number
  stop: number
  target: number
  rr: number
  confidence: string
  reason: string
}

export interface SignalsAPIData {
  signals: Signal[]
  bias: string
  bias_score: number
}

interface SignalsPanelProps {
  data?: SignalsAPIData
  className?: string
  lastUpdateTs?: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  orb_break: 'ORB Break',
  ib_break: 'IB Break',
  poc_rejection: 'POC Reject',
  va_edge: 'VA Edge',
  fakeout: 'Fakeout',
  bos: 'BOS / NPOC',
  vwap_bounce: 'VWAP Bounce',
  daily_breakout: 'Daily Break',
  sammelzone_breakout: 'Consol. Break',
  session_fade: 'Session Fade',
  cum_delta_divergence: 'CD Divergenz',
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function confidenceColor(confidence: string): string {
  if (confidence === 'high') return 'var(--color-accent)'
  if (confidence === 'medium') return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function confidenceBgColor(confidence: string): string {
  if (confidence === 'high') return 'var(--color-profit-muted)'
  if (confidence === 'medium') return 'var(--color-warning-muted)'
  return 'var(--color-loss-muted)'
}

function rrColor(rr: number): string {
  if (rr >= 2.5) return 'var(--color-profit)'
  if (rr >= 1.5) return 'var(--color-text-secondary)'
  return 'var(--color-text-muted)'
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function SignalsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 px-3 py-2.5 rounded-[var(--radius-sm)]"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
          {/* Price row */}
          <div className="grid gap-1" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex flex-col gap-0.5">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          {/* R:R bar */}
          <Skeleton className="h-1 w-full rounded" />
          {/* Reason */}
          <Skeleton className="h-2 w-3/4" />
        </div>
      ))}
    </div>
  )
}

// ── Direction Dot + Label ──────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: string }) {
  const isLong = direction === 'long'
  const label = isLong ? 'LONG' : 'SHORT'

  if (isLong) {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-xs)]"
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--color-profit)',
          background: 'var(--color-profit-muted)',
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-profit) 20%, transparent)',
        }}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-xs)]"
      style={{
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--color-loss)',
        background: 'var(--color-loss-muted)',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-loss) 20%, transparent)',
      }}
    >
      {label}
    </span>
  )
}

// ── Confidence Badge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const label = confidence === 'high' ? 'HIGH' : confidence === 'medium' ? 'MED' : 'LOW'
  const color = confidenceColor(confidence)
  const bg = confidenceBgColor(confidence)
  return (
    <span
      style={{
        fontSize: 8,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color,
        background: bg,
        border: `1px solid ${color}`,
        borderRadius: 3,
        padding: '1px 5px',
        lineHeight: 1.6,
      }}
    >
      {label}
    </span>
  )
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ signal, index = 0 }: { signal: Signal; index?: number }) {
  const isLong = signal.direction === 'long'
  const typeLabel = SIGNAL_TYPE_LABELS[signal.type] ?? signal.type.toUpperCase()
  const risk = Math.abs(signal.entry - signal.stop)
  const reward = Math.abs(signal.target - signal.entry)
  const total = risk + reward
  const riskPct = total > 0 ? (risk / total) * 100 : 50
  const rewardPct = total > 0 ? (reward / total) * 100 : 50
  const borderColor = isLong ? 'var(--color-profit)' : 'var(--color-loss)'

  const isFirst = index === 0

  return (
    <div
      className="flex flex-col gap-2 px-3 py-3 rounded-[var(--radius-md)] transition-all duration-150 hover:translate-y-[-1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
      style={{
        background: 'var(--color-surface-raised)',
        border: isFirst ? '1px solid rgba(92,184,240,0.15)' : '1px solid var(--color-border-subtle)',
        borderLeft: `2px solid ${borderColor}`,
        ...(isFirst && {
          boxShadow: '0 0 12px rgba(92,184,240,0.08), inset 0 1px 0 rgba(92,184,240,0.1)',
        }),
      }}
    >
      {/* Header row: direction dot + type | confidence + R:R */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionBadge direction={signal.direction} />
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ConfidenceBadge confidence={signal.confidence} />
          <span
            className="tabular-nums"
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: rrColor(signal.rr),
              letterSpacing: '-0.02em',
            }}
          >
            {signal.rr.toFixed(1)}R
          </span>
        </div>
      </div>

      {/* Price grid: Entry / Stop / Target */}
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '0 4px' }}
      >
        {/* Entry */}
        <div className="flex flex-col gap-0.5">
          <span
            className="font-sans text-[8px] uppercase tracking-[0.1em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Entry
          </span>
          <span
            className="font-mono text-[12px] font-semibold tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {formatPrice(signal.entry)}
          </span>
        </div>
        {/* Stop */}
        <div className="flex flex-col gap-0.5">
          <span
            className="font-sans text-[8px] uppercase tracking-[0.1em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Stop
          </span>
          <span
            className="font-mono text-[12px] font-semibold tabular-nums"
            style={{ color: 'var(--color-loss)' }}
          >
            {formatPrice(signal.stop)}
          </span>
        </div>
        {/* Target */}
        <div className="flex flex-col gap-0.5">
          <span
            className="font-sans text-[8px] uppercase tracking-[0.1em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Target
          </span>
          <span
            className="font-mono text-[12px] font-semibold tabular-nums"
            style={{ color: 'var(--color-profit)' }}
          >
            {formatPrice(signal.target)}
          </span>
        </div>
      </div>

      {/* R:R visual bar */}
      <div
        style={{
          display: 'flex',
          height: 5,
          borderRadius: 2,
          overflow: 'hidden',
          background: 'var(--color-surface-secondary)',
          gap: 1,
        }}
      >
        <div
          style={{
            width: `${riskPct}%`,
            background: 'var(--color-loss)',
            opacity: 0.55,
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            width: `${rewardPct}%`,
            background: 'var(--color-profit)',
            opacity: 0.55,
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Confidence bar */}
      <ConfidenceBar confidence={signal.confidence} />

      {/* Reason text */}
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        {signal.reason}
      </p>
    </div>
  )
}

// ── Confidence Bar ─────────────────────────────────────────────────────────────

function ConfidenceBar({ confidence }: { confidence: string }) {
  const pct = confidence === 'high' ? 90 : confidence === 'medium' ? 55 : 25
  const color = confidenceColor(confidence)
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="font-mono text-[8px] uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)', minWidth: 28 }}
      >
        Conf
      </span>
      <div
        className="flex-1 h-[3px] rounded-full overflow-hidden"
        style={{ background: 'var(--color-surface-secondary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
        />
      </div>
      <span className="font-mono text-[8px] uppercase" style={{ color }}>
        {confidence === 'high' ? 'HIGH' : confidence === 'medium' ? 'MED' : 'LOW'}
      </span>
    </div>
  )
}

// ── Staleness Dot ─────────────────────────────────────────────────────────────

function StalenessDot({ lastUpdateTs }: { lastUpdateTs?: number | null }) {
  const [age, setAge] = useState(0)

  useEffect(() => {
    if (!lastUpdateTs) return
    const tick = () => setAge(Math.floor((Date.now() - lastUpdateTs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastUpdateTs])

  if (!lastUpdateTs) return null

  const color =
    age < 5
      ? 'var(--color-profit)'
      : age < 30
        ? 'var(--color-warning)'
        : 'var(--color-loss)'

  const shadow = age < 5 ? '0 0 5px var(--color-profit)' : age < 30 ? '0 0 4px var(--color-warning)' : 'none'
  const label = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`

  return (
    <div className="flex items-center gap-1" title={`Last updated ${label}`}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: shadow }} />
      <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-8"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {/* Muted icon: simple horizontal lines suggesting an empty list */}
      <svg
        width="20"
        height="16"
        viewBox="0 0 20 16"
        fill="none"
        style={{ opacity: 0.35 }}
      >
        <rect x="0" y="0" width="8" height="2" rx="1" fill="currentColor" />
        <rect x="0" y="5" width="14" height="2" rx="1" fill="currentColor" />
        <rect x="0" y="10" width="10" height="2" rx="1" fill="currentColor" />
        <circle cx="17" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="19" y1="15.5" x2="20.5" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
        }}
      >
        No active signals
      </span>
    </div>
  )
}

// ── Bias Micro Strip ──────────────────────────────────────────────────────────

function BiasMicroStrip({ bias, score }: { bias: string; score: number }) {
  const biasUpper = bias.toUpperCase()
  const isLong = biasUpper.includes('LONG')
  const isShort = biasUpper.includes('SHORT')

  let biasColor = 'var(--color-text-muted)'
  if (isLong) biasColor = 'var(--color-profit)'
  else if (isShort) biasColor = 'var(--color-loss)'

  const biasLabel = bias.replace('_', ' ')

  return (
    <div
      className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)]"
      style={{
        background: 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
          }}
        >
          Bias
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: biasColor,
            letterSpacing: '0.05em',
          }}
        >
          {biasLabel}
        </span>
      </div>
      <span
        className="tabular-nums"
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: score >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
        }}
      >
        {score >= 0 ? '+' : ''}{score}
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SignalsPanel({ data, className, lastUpdateTs }: SignalsPanelProps) {
  // Loading: no data yet
  if (!data) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <SignalsSkeleton />
      </div>
    )
  }

  const { signals, bias, bias_score } = data
  const longSignals = signals.filter((s) => s.direction === 'long')
  const shortSignals = signals.filter((s) => s.direction === 'short')

  if (signals.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <BiasMicroStrip bias={bias} score={bias_score} />
        <EmptyState />
        {lastUpdateTs != null && (
          <div className="flex justify-end">
            <StalenessDot lastUpdateTs={lastUpdateTs} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <BiasMicroStrip bias={bias} score={bias_score} />
        {lastUpdateTs != null && <StalenessDot lastUpdateTs={lastUpdateTs} />}
      </div>

      {longSignals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-profit)' }} />
            <span className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--color-profit)', opacity: 0.7 }}>
              Long Setups
            </span>
          </div>
          {longSignals.map((sig, i) => (
            <SignalCard key={`long-${i}`} signal={sig} index={signals.indexOf(sig)} />
          ))}
        </div>
      )}

      {shortSignals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-loss)' }} />
            <span className="font-mono text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--color-loss)', opacity: 0.7 }}>
              Short Setups
            </span>
          </div>
          {shortSignals.map((sig, i) => (
            <SignalCard key={`short-${i}`} signal={sig} index={signals.indexOf(sig)} />
          ))}
        </div>
      )}
    </div>
  )
}
