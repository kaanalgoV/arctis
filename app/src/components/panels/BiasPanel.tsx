import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BiasData {
  bias_state: {
    state: string
    score: number
    components: Record<string, number>
  }
  bias_switch_level: {
    level: number
    type: string
    confidence: string
  } | null
  velocity: {
    scale: number
    ratio: number
  } | null
  auction_quality: {
    score: number
    label: string
    type: string
  } | null
  naked_pocs: Array<{
    date: string
    price: number
    naked: boolean
    distance: number
  }>
  correction: {
    impulse_size: number
    correction_pct: number
    is_threat: boolean
    direction: string
  } | null
  key_levels: Array<{
    level: number
    tests: number
    type: string
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type BiasVariant = 'long' | 'range_long' | 'range' | 'range_short' | 'short'

function parseBiasVariant(state: string): BiasVariant {
  const s = state.toLowerCase()
  if (s === 'long') return 'long'
  if (s === 'range_long') return 'range_long'
  if (s === 'range_short') return 'range_short'
  if (s === 'short') return 'short'
  return 'range'
}

const BIAS_STYLES: Record<
  BiasVariant,
  { bg: string; color: string; borderColor: string; label: string }
> = {
  long: {
    bg: 'var(--color-profit)',
    color: 'white',
    borderColor: 'var(--color-profit)',
    label: 'LONG',
  },
  range_long: {
    bg: 'rgba(0, 135, 87, 0.2)',
    color: 'var(--color-profit)',
    borderColor: 'rgba(0, 135, 87, 0.4)',
    label: 'RANGE LONG',
  },
  range: {
    bg: 'var(--color-surface-raised)',
    color: 'var(--color-text-muted)',
    borderColor: 'var(--color-border)',
    label: 'RANGE',
  },
  range_short: {
    bg: 'rgba(239, 65, 54, 0.2)',
    color: 'var(--color-loss)',
    borderColor: 'rgba(239, 65, 54, 0.4)',
    label: 'RANGE SHORT',
  },
  short: {
    bg: 'var(--color-loss)',
    color: 'white',
    borderColor: 'var(--color-loss)',
    label: 'SHORT',
  },
}

function componentLabel(key: string): string {
  const map: Record<string, string> = {
    trend: 'Trend',
    velocity: 'Velocity',
    auction: 'Auction',
    vwap: 'VWAP',
    ema: 'EMA',
  }
  return map[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function componentValueColor(val: number): string {
  if (val > 0) return 'var(--color-profit)'
  if (val < 0) return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function auctionQualityColor(type: string): string {
  if (type === 'clean') return 'var(--color-profit)'
  if (type === 'moderate') return 'var(--color-warning)'
  return 'var(--color-loss)'
}

function levelTypeColor(type: string): string {
  if (type === 'resistance') return 'var(--color-loss)'
  if (type === 'support') return 'var(--color-profit)'
  return 'var(--color-accent)'
}

function velocityBarGradient(scale: number): string {
  // 1-10 scale: low = blue/info, high = red/loss
  const pct = Math.max(0, Math.min(1, (scale - 1) / 9))
  if (pct < 0.5) {
    // blue -> warning
    return `linear-gradient(90deg, var(--color-info), var(--color-warning))`
  }
  // warning -> loss
  return `linear-gradient(90deg, var(--color-warning), var(--color-loss))`
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="uppercase tracking-widest"
      style={{
        fontSize: 9,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </span>
  )
}

// ── Score Badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const positive = score >= 0
  return (
    <div
      className="flex flex-col items-end gap-0.5"
    >
      <span
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Score
      </span>
      <span
        className="tabular-nums"
        style={{
          fontSize: 22,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          lineHeight: 1,
          color: positive ? 'var(--color-profit)' : 'var(--color-loss)',
        }}
      >
        {positive ? '+' : ''}{score}
      </span>
    </div>
  )
}

// ── Components Grid ────────────────────────────────────────────────────────────

function ComponentsGrid({ components }: { components: Record<string, number> }) {
  const entries = Object.entries(components)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>Components</SectionLabel>
      <div className="grid grid-cols-2 gap-1">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className={cn(
              'flex items-center justify-between px-2 py-1.5',
              'rounded-[var(--radius-sm)]',
              'border border-[var(--color-border-subtle)]',
              'bg-[var(--color-surface-raised)]/40',
            )}
          >
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {componentLabel(key)}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: componentValueColor(val),
              }}
            >
              {val > 0 ? '+' : ''}{val}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Switch Level ──────────────────────────────────────────────────────────────

function SwitchLevel({
  level,
  type,
  confidence,
}: {
  level: number
  type: string
  confidence: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>Switch Level</SectionLabel>
      <div
        className={cn(
          'relative flex items-center justify-between px-3 py-2.5',
          'rounded-[var(--radius-sm)]',
          'border border-[var(--color-border-subtle)]',
          'bg-[var(--color-surface-raised)]/40',
          'overflow-hidden',
        )}
      >
        {/* Horizontal accent line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: '50%',
            height: 1,
            background: 'var(--color-accent)',
            opacity: 0.25,
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <span
            className="tabular-nums"
            style={{
              fontSize: 16,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-accent)',
            }}
          >
            {level.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {type}
          </span>
        </div>
        <span
          className="relative z-10"
          style={{
            fontSize: 10,
            color: confidence === 'high' ? 'var(--color-profit)' : confidence === 'low' ? 'var(--color-loss)' : 'var(--color-warning)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}
        >
          {confidence}
        </span>
      </div>
    </div>
  )
}

// ── Velocity Bar ──────────────────────────────────────────────────────────────

function VelocityBar({ scale, ratio }: { scale: number; ratio: number }) {
  const clampedScale = Math.max(1, Math.min(10, scale))
  const widthPct = ((clampedScale - 1) / 9) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <SectionLabel>Velocity</SectionLabel>
        <span
          className="tabular-nums"
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          {clampedScale.toFixed(1)}
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 400 }}>/10</span>
        </span>
      </div>
      {/* Scale bar */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${widthPct}%`,
            background: velocityBarGradient(clampedScale),
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {/* Tick marks */}
      <div className="flex justify-between">
        {[1, 3, 5, 7, 10].map((tick) => (
          <span
            key={tick}
            style={{
              fontSize: 8,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tick}
          </span>
        ))}
      </div>
      <span
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Ratio: <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{ratio.toFixed(2)}</span>
      </span>
    </div>
  )
}

// ── Auction Quality ───────────────────────────────────────────────────────────

function AuctionQuality({
  score,
  label,
  type,
}: {
  score: number
  label: string
  type: string
}) {
  const color = auctionQualityColor(type)

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <SectionLabel>Auction Quality</SectionLabel>
        <span
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color,
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="flex items-center justify-center rounded-[var(--radius-sm)]"
        style={{
          width: 36,
          height: 36,
          background: 'var(--color-surface-raised)',
          border: `1px solid ${color}40`,
        }}
      >
        <span
          className="tabular-nums"
          style={{
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color,
          }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}

// ── Correction ────────────────────────────────────────────────────────────────

function CorrectionBar({
  impulse_size,
  correction_pct,
  is_threat,
  direction,
}: {
  impulse_size: number
  correction_pct: number
  is_threat: boolean
  direction: string
}) {
  const clampedPct = Math.max(0, Math.min(100, correction_pct))
  const barColor = is_threat ? 'var(--color-loss)' : 'var(--color-warning)'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <SectionLabel>Correction</SectionLabel>
        {is_threat && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--color-loss)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            Threat
          </span>
        )}
      </div>
      <div
        className="relative overflow-hidden"
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clampedPct}%`,
            background: barColor,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 9,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {direction.toUpperCase()} / Impulse: <span className="tabular-nums">{impulse_size.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: barColor,
          }}
        >
          {clampedPct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ── Key Levels ────────────────────────────────────────────────────────────────

function KeyLevelsList({
  levels,
}: {
  levels: Array<{ level: number; tests: number; type: string }>
}) {
  if (levels.length === 0) return null
  const top5 = levels.slice(0, 5)

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>Key Levels</SectionLabel>
      <div className="flex flex-col gap-1">
        {top5.map((lvl, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1"
            style={{
              borderRadius: 4,
              background: 'var(--color-surface-raised)/40',
              borderLeft: `2px solid ${levelTypeColor(lvl.type)}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 9,
                  color: levelTypeColor(lvl.type),
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  minWidth: 52,
                }}
              >
                {lvl.type}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {lvl.level.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded"
              style={{
                minWidth: 24,
                height: 18,
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <span
                className="tabular-nums"
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {lvl.tests}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface BiasPanelProps {
  data?: BiasData
}

export function BiasPanel({ data }: BiasPanelProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center py-6">
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          No bias data
        </span>
      </div>
    )
  }

  const variant = parseBiasVariant(data.bias_state.state)
  const style = BIAS_STYLES[variant]

  return (
    <div className="flex flex-col gap-3">
      {/* Bias State + Score */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)]"
        style={{
          background: style.bg,
          border: `1px solid ${style.borderColor}`,
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 9,
              color: style.color,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.75,
            }}
          >
            Daily Bias
          </span>
          <span
            style={{
              fontSize: 18,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: style.color,
              letterSpacing: '0.03em',
              lineHeight: 1.1,
            }}
          >
            {style.label}
          </span>
        </div>
        <ScoreBadge score={data.bias_state.score} />
      </div>

      {/* Components */}
      {Object.keys(data.bias_state.components).length > 0 && (
        <ComponentsGrid components={data.bias_state.components} />
      )}

      {/* Switch Level */}
      {data.bias_switch_level && (
        <SwitchLevel
          level={data.bias_switch_level.level}
          type={data.bias_switch_level.type}
          confidence={data.bias_switch_level.confidence}
        />
      )}

      {/* Velocity */}
      {data.velocity && (
        <VelocityBar
          scale={data.velocity.scale}
          ratio={data.velocity.ratio}
        />
      )}

      {/* Auction Quality */}
      {data.auction_quality && (
        <div
          className={cn(
            'px-3 py-2.5 rounded-[var(--radius-sm)]',
            'border border-[var(--color-border-subtle)]',
            'bg-[var(--color-surface-raised)]/40',
          )}
        >
          <AuctionQuality
            score={data.auction_quality.score}
            label={data.auction_quality.label}
            type={data.auction_quality.type}
          />
        </div>
      )}

      {/* Correction */}
      {data.correction && (
        <div
          className={cn(
            'px-3 py-2.5 rounded-[var(--radius-sm)]',
            'border border-[var(--color-border-subtle)]',
            'bg-[var(--color-surface-raised)]/40',
          )}
        >
          <CorrectionBar
            impulse_size={data.correction.impulse_size}
            correction_pct={data.correction.correction_pct}
            is_threat={data.correction.is_threat}
            direction={data.correction.direction}
          />
        </div>
      )}

      {/* Key Levels */}
      {data.key_levels.length > 0 && (
        <KeyLevelsList levels={data.key_levels} />
      )}
    </div>
  )
}
