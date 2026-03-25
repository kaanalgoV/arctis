import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/Skeleton'

interface ConfluenceSignal {
  name: string
  direction: string
  strength: number
  detail: string
}

export interface ConfluenceAPIData {
  score: number
  max_score: number
  direction: string
  confidence: string
  signals: ConfluenceSignal[]
  indicators: Record<string, unknown>
}

interface ConfluencePanelProps {
  data?: ConfluenceAPIData | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function gaugeColor(score: number, max: number): string {
  const ratio = max > 0 ? score / max : 0
  if (ratio >= 0.7) return 'var(--color-profit)'
  if (ratio >= 0.4) return '#F0A500'
  return 'var(--color-loss)'
}

function strengthColor(v: number): string {
  if (v > 0) return 'var(--color-profit)'
  if (v < 0) return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function directionColor(dir: string): string {
  if (dir === 'LONG') return 'var(--color-profit)'
  if (dir === 'SHORT') return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function confidenceColor(confidence: string): string {
  const c = confidence.toLowerCase()
  if (c === 'high') return 'var(--color-accent)'
  if (c === 'medium' || c === 'med') return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function confidenceBg(confidence: string): string {
  const c = confidence.toLowerCase()
  if (c === 'high') return 'var(--color-accent-muted)'
  if (c === 'medium' || c === 'med') return 'var(--color-warning-muted)'
  return 'var(--color-surface-raised)'
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function ConfluenceSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {/* Score line */}
      <div className="flex items-baseline gap-2 mb-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-4 w-12" />
      </div>
      {/* Gauge bar */}
      <Skeleton className="h-2 w-full rounded-full mb-1" />
      {/* Direction */}
      <div className="flex items-center gap-1.5 mb-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      {/* Signal rows */}
      <div className="flex flex-col gap-1 mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-1 px-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Score Header ──────────────────────────────────────────────────────────────

function ScoreHeader({
  score,
  max_score,
  confidence,
}: {
  score: number
  max_score: number
  confidence: string
}) {
  const color = gaugeColor(score, max_score)
  const confColor = confidenceColor(confidence)
  const confBg = confidenceBg(confidence)
  const confLabel = confidence.toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-baseline gap-1">
        <span
          className="tabular-nums leading-none"
          style={{
            fontSize: 28,
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color,
          }}
        >
          {score > 0 ? '+' : ''}{score}
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
          }}
        >
          / {max_score}
        </span>
      </div>

      {/* Confidence badge */}
      <span
        style={{
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: confColor,
          background: confBg,
          border: `1px solid ${confColor}`,
          borderRadius: 3,
          padding: '2px 6px',
        }}
      >
        {confLabel}
      </span>
    </div>
  )
}

// ── Gauge Bar ─────────────────────────────────────────────────────────────────

function GaugeBar({ score, max_score }: { score: number; max_score: number }) {
  const ratio = max_score > 0 ? Math.max(0, Math.min(1, score / max_score)) : 0
  const fillColor = gaugeColor(score, max_score)

  return (
    <div
      style={{
        height: 6,
        borderRadius: 4,
        background: 'var(--color-surface-secondary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          background: fillColor,
          borderRadius: 4,
          opacity: 0.75,
        }}
      />
    </div>
  )
}

// ── Direction Indicator ───────────────────────────────────────────────────────

function DirectionIndicator({ direction }: { direction: string }) {
  const color = directionColor(direction)
  const isLong = direction === 'LONG'
  const isShort = direction === 'SHORT'

  return (
    <div className="flex items-center gap-1.5">
      {/* Arrow icon */}
      {isLong && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 8.5V1.5M5 1.5L2 4.5M5 1.5L8 4.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {isShort && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1.5V8.5M5 8.5L2 5.5M5 8.5L8 5.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!isLong && !isShort && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5H8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color,
          letterSpacing: '0.06em',
        }}
      >
        {direction}
      </span>
    </div>
  )
}

// ── Signal Breakdown ──────────────────────────────────────────────────────────

function SignalBreakdown({ signals }: { signals: ConfluenceSignal[] }) {
  if (signals.length === 0) return null

  return (
    <div
      className="flex flex-col gap-0.5"
    >
      {signals.map((sig, i) => {
        const color = strengthColor(sig.strength)
        const sign = sig.strength > 0 ? '+' : sig.strength < 0 ? '' : ''
        const iconColor = sig.strength > 0
          ? 'color-mix(in srgb, var(--color-profit) 60%, transparent)'
          : sig.strength < 0
            ? 'color-mix(in srgb, var(--color-loss) 60%, transparent)'
            : 'var(--color-text-muted)'

        return (
          <div
            key={sig.name}
            className="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-xs)] transition-colors duration-75 hover:bg-[var(--color-surface-raised)]"
            style={{ background: 'transparent' }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
              }}
            >
              {sig.name}
            </span>
            <div className="flex items-center gap-1">
              {/* +/- icon */}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                {sig.strength > 0 ? (
                  <>
                    <line x1="4" y1="1" x2="4" y2="7" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="1" y1="4" x2="7" y2="4" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
                  </>
                ) : sig.strength < 0 ? (
                  <line x1="1" y1="4" x2="7" y2="4" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
                ) : (
                  <circle cx="4" cy="4" r="1.5" fill={iconColor} />
                )}
              </svg>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color,
                }}
              >
                {sign}{sig.strength}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfluencePanel({ data, loading, error }: ConfluencePanelProps) {
  // Loading state
  if (loading && data == null) {
    return <ConfluenceSkeleton />
  }

  // Error state
  if (error && data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-loss)',
          }}
        >
          {error}
        </span>
      </div>
    )
  }

  // No data state
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
          }}
        >
          Waiting for data...
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Score: "7.2 / 10" + confidence badge */}
      <ScoreHeader
        score={data.score}
        max_score={data.max_score}
        confidence={data.confidence}
      />

      {/* Visual gauge bar */}
      <GaugeBar score={data.score} max_score={data.max_score} />

      {/* Direction */}
      <DirectionIndicator direction={data.direction} />

      {/* Signal breakdown list */}
      {data.signals.length > 0 && (
        <SignalBreakdown signals={data.signals} />
      )}
    </div>
  )
}
