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
  if (val > 0) return '#22C55E'
  if (val < 0) return '#EF4444'
  return '#8B949E'
}

function auctionQualityColor(type: string): string {
  if (type === 'clean') return '#22C55E'
  if (type === 'moderate') return '#F59E0B'
  return '#EF4444'
}

function levelTypeColor(type: string): string {
  if (type === 'resistance') return '#EF4444'
  if (type === 'support') return '#22C55E'
  return '#5CB8F0'
}

function velocityBarGradient(scale: number): string {
  // 1-10 scale: low = muted gray, high = loss red (only extreme velocity signals danger)
  const pct = Math.max(0, Math.min(1, (scale - 1) / 9))
  if (pct < 0.5) {
    return `linear-gradient(90deg, var(--color-border), var(--color-text-muted))`
  }
  // high velocity -> loss color
  return `linear-gradient(90deg, var(--color-text-muted), var(--color-loss))`
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#8B949E]">
      {children}
    </span>
  )
}

// ── Score Badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const positive = score >= 0
  return (
    <span
      className="font-mono text-[20px] font-bold tabular-nums leading-none"
      style={{ color: positive ? '#22C55E' : '#EF4444' }}
    >
      {positive ? '+' : ''}{score}
    </span>
  )
}

// ── Components Grid ────────────────────────────────────────────────────────────

function ComponentsGrid({ components }: { components: Record<string, number> }) {
  const entries = Object.entries(components)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <SectionLabel>Components</SectionLabel>
      <div className="grid grid-cols-2 gap-1">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="flex items-center justify-between px-2 py-1 rounded bg-[#0D1117] border border-[#21262D] text-[10px]"
          >
            <span className="text-[#8B949E]">{componentLabel(key)}</span>
            <span
              className="font-mono font-bold tabular-nums"
              style={{ color: componentValueColor(val) }}
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
  const confColor = confidence === 'high' ? '#22C55E' : confidence === 'low' ? '#EF4444' : '#F59E0B'
  return (
    <div className="flex flex-col gap-1">
      <SectionLabel>Switch Level</SectionLabel>
      {/* Single-line compact row */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#161B22] border border-[#21262D]">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[13px] font-bold tabular-nums text-[#5CB8F0]">
            {level.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#8B949E]">{type}</span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: confColor }}>
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <SectionLabel>Velocity</SectionLabel>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-[#E6EDF3]">
          {clampedScale.toFixed(1)}<span className="text-[9px] text-[#8B949E] font-normal">/10</span>
        </span>
      </div>
      {/* Scale bar — 2px thin */}
      <div className="relative h-[2px] rounded-full overflow-hidden bg-[#21262D]">
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300"
          style={{
            width: `${widthPct}%`,
            background: velocityBarGradient(clampedScale),
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[1, 3, 5, 7, 10].map((tick) => (
            <span key={tick} className="font-mono text-[8px] text-[#484F58]">{tick}</span>
          ))}
        </div>
        <span className="font-mono text-[9px] text-[#8B949E]">
          r:<span className="tabular-nums text-[#8B949E]">{ratio.toFixed(2)}</span>
        </span>
      </div>
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
      <div className="flex items-center gap-2">
        <SectionLabel>Auction</SectionLabel>
        <span className="font-mono text-[11px] font-semibold" style={{ color }}>{label}</span>
      </div>
      <span
        className="font-mono text-[13px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#21262D]"
        style={{ color }}
      >
        {score}
      </span>
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
  const barColor = is_threat ? '#EF4444' : '#F59E0B'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <SectionLabel>Correction</SectionLabel>
        {is_threat && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#EF4444]">Threat</span>
        )}
      </div>
      {/* 2px thin bar */}
      <div className="relative h-[2px] rounded-full overflow-hidden bg-[#21262D]">
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300"
          style={{ width: `${clampedPct}%`, background: barColor }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-[#8B949E]">
          {direction.toUpperCase()} · <span className="tabular-nums">{impulse_size.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
        </span>
        <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: barColor }}>
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
    <div className="flex flex-col gap-1">
      <SectionLabel>Key Levels</SectionLabel>
      <div className="flex flex-col gap-px bg-[#161B22] rounded-md border border-[#21262D] overflow-hidden">
        {top5.map((lvl, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1 hover:bg-[#21262D]/40 transition-colors"
            style={{ borderLeft: `2px solid ${levelTypeColor(lvl.type)}` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[9px] uppercase tracking-wider min-w-[46px]"
                style={{ color: levelTypeColor(lvl.type) }}
              >
                {lvl.type}
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[#E6EDF3]">
                {lvl.level.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="font-mono text-[9px] tabular-nums text-[#484F58] px-1 py-px rounded bg-[#21262D]">
              {lvl.tests}x
            </span>
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
        <span className="text-[11px] text-[#8B949E] font-mono">No bias data</span>
      </div>
    )
  }

  const variant = parseBiasVariant(data.bias_state.state)
  const style = BIAS_STYLES[variant]

  return (
    <div className="flex flex-col gap-2">
      {/* Bias State + Score — compact single card */}
      <div
        className="flex items-center justify-between px-2.5 py-2 rounded-md border"
        style={{
          background: style.bg,
          borderColor: style.borderColor,
        }}
      >
        <div className="flex flex-col gap-0">
          <span
            className="text-[9px] uppercase tracking-[0.1em] font-mono opacity-70"
            style={{ color: style.color }}
          >
            Daily Bias
          </span>
          <span
            className="font-mono text-[16px] font-extrabold leading-tight tracking-wide"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
        </div>
        <ScoreBadge score={data.bias_state.score} />
      </div>

      {/* Components 2-col grid */}
      {Object.keys(data.bias_state.components).length > 0 && (
        <ComponentsGrid components={data.bias_state.components} />
      )}

      {/* Switch Level — single line */}
      {data.bias_switch_level && (
        <SwitchLevel
          level={data.bias_switch_level.level}
          type={data.bias_switch_level.type}
          confidence={data.bias_switch_level.confidence}
        />
      )}

      {/* Velocity — thin bar */}
      {data.velocity && (
        <VelocityBar
          scale={data.velocity.scale}
          ratio={data.velocity.ratio}
        />
      )}

      {/* Auction Quality — inline */}
      {data.auction_quality && (
        <div className="px-2 py-1.5 rounded-md border border-[#21262D] bg-[#161B22]">
          <AuctionQuality
            score={data.auction_quality.score}
            label={data.auction_quality.label}
            type={data.auction_quality.type}
          />
        </div>
      )}

      {/* Correction — thin bar */}
      {data.correction && (
        <div className="px-2 py-1.5 rounded-md border border-[#21262D] bg-[#161B22]">
          <CorrectionBar
            impulse_size={data.correction.impulse_size}
            correction_pct={data.correction.correction_pct}
            is_threat={data.correction.is_threat}
            direction={data.correction.direction}
          />
        </div>
      )}

      {/* Key Levels — compact table */}
      {data.key_levels.length > 0 && (
        <KeyLevelsList levels={data.key_levels} />
      )}
    </div>
  )
}
