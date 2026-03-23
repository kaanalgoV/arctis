import { cn } from '@/lib/utils'

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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  orb_break: 'ORB Break',
  ib_break: 'IB Break',
  poc_rejection: 'POC Reject',
  va_edge: 'VA Edge',
  fakeout: 'Fakeout',
  bos: 'BOS / NPOC',
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function confidenceColor(confidence: string): string {
  if (confidence === 'high') return 'var(--color-profit)'
  if (confidence === 'medium') return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function confidenceBg(confidence: string): string {
  if (confidence === 'high') return 'rgba(0,135,87,0.15)'
  if (confidence === 'medium') return 'rgba(251,191,36,0.12)'
  return 'rgba(255,255,255,0.05)'
}

function confidenceBorder(confidence: string): string {
  if (confidence === 'high') return 'rgba(0,135,87,0.35)'
  if (confidence === 'medium') return 'rgba(251,191,36,0.28)'
  return 'var(--color-border-subtle)'
}

function rrColor(rr: number): string {
  if (rr >= 2.5) return 'var(--color-profit)'
  if (rr >= 1.5) return 'var(--color-warning)'
  return 'var(--color-text-secondary)'
}

// ── Direction Badge ───────────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: string }) {
  const isLong = direction === 'long'
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 36,
        height: 18,
        borderRadius: 3,
        background: isLong ? 'rgba(0,135,87,0.18)' : 'rgba(239,65,54,0.18)',
        border: `1px solid ${isLong ? 'rgba(0,135,87,0.4)' : 'rgba(239,65,54,0.4)'}`,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: isLong ? 'var(--color-profit)' : 'var(--color-loss)',
        }}
      >
        {isLong ? 'LONG' : 'SHORT'}
      </span>
    </div>
  )
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const typeLabel = SIGNAL_TYPE_LABELS[signal.type] ?? signal.type.toUpperCase()
  const risk = Math.abs(signal.entry - signal.stop)
  const reward = Math.abs(signal.target - signal.entry)

  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-3 py-2.5',
        'rounded-[var(--radius-sm)]',
        'border',
      )}
      style={{
        background: confidenceBg(signal.confidence),
        borderColor: confidenceBorder(signal.confidence),
      }}
    >
      {/* Header row: direction + type + confidence + R:R */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DirectionBadge direction={signal.direction} />
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Confidence badge */}
          <div
            className="flex items-center justify-center"
            style={{
              height: 16,
              paddingLeft: 5,
              paddingRight: 5,
              borderRadius: 3,
              background: 'transparent',
              border: `1px solid ${confidenceColor(signal.confidence)}`,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: confidenceColor(signal.confidence),
              }}
            >
              {signal.confidence}
            </span>
          </div>
          {/* R:R */}
          <span
            className="tabular-nums"
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: rrColor(signal.rr),
            }}
          >
            {signal.rr.toFixed(1)}R
          </span>
        </div>
      </div>

      {/* Price row: Entry / Stop / Target */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        {/* Entry */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Entry
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {formatPrice(signal.entry)}
          </span>
        </div>
        {/* Stop */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Stop
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-loss)',
            }}
          >
            {formatPrice(signal.stop)}
          </span>
        </div>
        {/* Target */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Target
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-profit)',
            }}
          >
            {formatPrice(signal.target)}
          </span>
        </div>
      </div>

      {/* Risk magnitude bar */}
      <div
        className="flex items-center gap-1.5"
        style={{ height: 4 }}
      >
        {/* Risk portion */}
        <div
          style={{
            flex: risk,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-loss)',
            opacity: 0.6,
          }}
        />
        {/* Reward portion */}
        <div
          style={{
            flex: reward,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-profit)',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Reason text */}
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        {signal.reason}
      </p>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-6">
      <span
        style={{
          fontSize: 11,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        No active signals
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SignalsPanel({ data, className }: SignalsPanelProps) {
  if (!data) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState />
      </div>
    )
  }

  const { signals, bias, bias_score } = data
  const longSignals = signals.filter((s) => s.direction === 'long')
  const shortSignals = signals.filter((s) => s.direction === 'short')

  if (signals.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Bias context strip */}
        <BiasMicroStrip bias={bias} score={bias_score} />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Bias context strip */}
      <BiasMicroStrip bias={bias} score={bias_score} />

      {/* Long signals */}
      {longSignals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {longSignals.map((sig, i) => (
            <SignalCard key={`long-${i}`} signal={sig} />
          ))}
        </div>
      )}

      {/* Short signals */}
      {shortSignals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {shortSignals.map((sig, i) => (
            <SignalCard key={`short-${i}`} signal={sig} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bias Micro Strip ──────────────────────────────────────────────────────────

function BiasMicroStrip({ bias, score }: { bias: string; score: number }) {
  const isLong = bias.includes('LONG')
  const isShort = bias.includes('SHORT')
  const isRange = bias === 'RANGE'

  let color = 'var(--color-text-muted)'
  if (isLong && !isRange) color = 'var(--color-profit)'
  else if (isShort && !isRange) color = 'var(--color-loss)'
  else if (isLong) color = 'rgba(0,135,87,0.7)'
  else if (isShort) color = 'rgba(239,65,54,0.7)'

  const biasLabel = bias.replace('_', ' ')

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)]"
      style={{
        background: 'var(--color-surface-raised)/40',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontSize: 8,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Bias
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color,
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
