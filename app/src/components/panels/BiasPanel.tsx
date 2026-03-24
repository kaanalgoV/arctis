import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { transitions } from '@/lib/motion'

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

const COMPONENT_LABELS: Record<string, string> = {
  trend: 'Trend',
  velocity: 'Velocity',
  auction: 'Auction',
  vwap: 'VWAP',
  ema: 'EMA',
}

function componentLabel(key: string): string {
  return COMPONENT_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function fmtPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtSigned(n: number): string {
  return (n > 0 ? '+' : '') + n
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={cn('skeleton rounded', width, height)} />
}

function BiasPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-1 animate-pulse">
      <SkeletonLine height="h-14" />
      <SkeletonLine height="h-2" />
      <div className="grid grid-cols-2 gap-1">
        {[...Array(4)].map((_, i) => <SkeletonLine key={i} height="h-7" />)}
      </div>
      <SkeletonLine height="h-8" />
      <SkeletonLine height="h-6" />
      <SkeletonLine height="h-6" />
      <SkeletonLine height="h-16" />
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[9px] font-semibold tracking-[0.14em] uppercase"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </span>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-full h-px" style={{ background: 'var(--color-border-subtle)' }} />
}

// ── 1. BIAS STATE HEADER ──────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<BiasVariant, {
  label: string
  dirLabel: string
  scorePrefix: string
  headerBg: string
  headerBorder: string
  labelColor: string
  scoreColor: string
  barFill: string
}> = {
  long: {
    label: 'LONG',
    dirLabel: 'BULLISH',
    scorePrefix: '+',
    headerBg: 'rgba(0, 135, 87, 0.12)',
    headerBorder: 'rgba(0, 135, 87, 0.35)',
    labelColor: 'var(--color-profit)',
    scoreColor: 'var(--color-profit)',
    barFill: 'linear-gradient(90deg, rgba(0,135,87,0.3) 0%, var(--color-profit) 100%)',
  },
  range_long: {
    label: 'RANGE LONG',
    dirLabel: 'LEAN LONG',
    scorePrefix: '+',
    headerBg: 'rgba(0, 135, 87, 0.07)',
    headerBorder: 'rgba(0, 135, 87, 0.2)',
    labelColor: 'var(--color-profit)',
    scoreColor: 'var(--color-profit)',
    barFill: 'linear-gradient(90deg, rgba(0,135,87,0.15) 0%, rgba(0,135,87,0.6) 100%)',
  },
  range: {
    label: 'RANGE',
    dirLabel: 'NEUTRAL',
    scorePrefix: '',
    headerBg: 'rgba(53, 61, 72, 0.25)',
    headerBorder: 'var(--color-border)',
    labelColor: 'var(--color-text-secondary)',
    scoreColor: 'var(--color-text-secondary)',
    barFill: 'linear-gradient(90deg, rgba(110,118,129,0.3) 0%, rgba(110,118,129,0.6) 100%)',
  },
  range_short: {
    label: 'RANGE SHORT',
    dirLabel: 'LEAN SHORT',
    scorePrefix: '',
    headerBg: 'rgba(239, 65, 54, 0.07)',
    headerBorder: 'rgba(239, 65, 54, 0.2)',
    labelColor: 'var(--color-loss)',
    scoreColor: 'var(--color-loss)',
    barFill: 'linear-gradient(90deg, rgba(239,65,54,0.6) 0%, rgba(239,65,54,0.15) 100%)',
  },
  short: {
    label: 'SHORT',
    dirLabel: 'BEARISH',
    scorePrefix: '',
    headerBg: 'rgba(239, 65, 54, 0.12)',
    headerBorder: 'rgba(239, 65, 54, 0.35)',
    labelColor: 'var(--color-loss)',
    scoreColor: 'var(--color-loss)',
    barFill: 'linear-gradient(90deg, var(--color-loss) 0%, rgba(239,65,54,0.3) 100%)',
  },
}

function BiasHeader({ state, score }: { state: BiasData['bias_state']; score: number }) {
  const variant = parseBiasVariant(state.state)
  const cfg = VARIANT_CONFIG[variant]

  // Score normalized to -10..+10 range — clamp and map to 0-100%
  const clampedScore = Math.max(-10, Math.min(10, score))
  const isPositive = clampedScore >= 0
  // Bar: center at 50%, extend left or right
  const barWidth = (Math.abs(clampedScore) / 10) * 50   // 0% – 50% of half-bar
  const barLeft = isPositive ? 50 : 50 - barWidth        // start x
  // Marker x position as percent
  const markerPct = ((clampedScore + 10) / 20) * 100

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${cfg.headerBorder}`, background: cfg.headerBg }}
    >
      {/* Top row: direction + score */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Daily Bias
          </span>
          <span
            className="font-mono text-[22px] font-black leading-none tracking-wide"
            style={{ color: cfg.labelColor }}
          >
            {cfg.label}
          </span>
          <span
            className="text-[9px] font-semibold tracking-[0.1em] uppercase mt-0.5"
            style={{ color: cfg.labelColor, opacity: 0.65 }}
          >
            {cfg.dirLabel}
          </span>
        </div>

        {/* Score box */}
        <div
          className="flex flex-col items-end gap-0"
          style={{ minWidth: 44 }}
        >
          <span
            className="text-[9px] font-medium tracking-wider uppercase"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Score
          </span>
          <span
            className="font-mono text-[26px] font-black tabular-nums leading-none"
            style={{ color: cfg.scoreColor }}
          >
            {score > 0 ? '+' : ''}{score}
          </span>
          <span
            className="font-mono text-[9px] tabular-nums"
            style={{ color: 'var(--color-text-muted)' }}
          >
            / 10
          </span>
        </div>
      </div>

      {/* Gradient scale bar */}
      <div className="px-3 pb-2.5">
        <div
          className="relative h-[6px] rounded-full overflow-visible"
          style={{ background: 'var(--color-surface-raised)' }}
        >
          {/* Filled region */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%`, left: `${barLeft}%` }}
            transition={transitions.easeOutSlow}
            style={{ background: cfg.barFill }}
          />

          {/* Center tick */}
          <div
            className="absolute top-[-2px] bottom-[-2px] w-px"
            style={{
              left: '50%',
              background: 'var(--color-border)',
              zIndex: 2,
            }}
          />

          {/* Position marker triangle */}
          <motion.div
            className="absolute -top-[4px] -translate-x-1/2"
            initial={{ left: '50%' }}
            animate={{ left: `${markerPct}%` }}
            transition={transitions.easeOutSlow}
            style={{ zIndex: 3 }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <polygon
                points="4,7 0,0 8,0"
                fill={cfg.scoreColor}
                opacity={0.9}
              />
            </svg>
          </motion.div>
        </div>

        {/* Scale ticks */}
        <div className="flex justify-between mt-1">
          {['-10', '-5', '0', '+5', '+10'].map((t) => (
            <span
              key={t}
              className="font-mono text-[8px] tabular-nums"
              style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 2. COMPONENTS GRID ────────────────────────────────────────────────────────

function ComponentsGrid({ components }: { components: Record<string, number> }) {
  const entries = Object.entries(components)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Signal Components</Label>
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
        {entries.map(([key, val], i) => {
          const isPositive = val > 0
          const isNegative = val < 0
          const color = isPositive
            ? 'var(--color-profit)'
            : isNegative
              ? 'var(--color-loss)'
              : 'var(--color-text-muted)'

          // Bar fill: max value assumed ±3 for components
          const maxVal = 3
          const barPct = Math.min(Math.abs(val) / maxVal, 1) * 100

          return (
            <div key={key}>
              {i > 0 && (
                <div className="h-px mx-2" style={{ background: 'var(--color-border-subtle)', opacity: 0.5 }} />
              )}
              <div
                className="relative flex items-center justify-between px-2.5 py-1.5"
                style={{ background: 'var(--color-surface-secondary)' }}
              >
                {/* Subtle background fill bar */}
                <div
                  className="absolute inset-y-0 rounded-sm transition-all duration-300"
                  style={{
                    [isPositive ? 'left' : 'right']: 0,
                    width: `${barPct * 0.6}%`,
                    background: isPositive
                      ? 'rgba(0,135,87,0.07)'
                      : isNegative
                        ? 'rgba(239,65,54,0.07)'
                        : 'transparent',
                  }}
                />
                <span
                  className="text-[11px] relative z-10"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {componentLabel(key)}
                </span>
                <span
                  className="font-mono text-[12px] font-bold tabular-nums relative z-10"
                  style={{ color }}
                >
                  {fmtSigned(val)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 3. SWITCH LEVEL ───────────────────────────────────────────────────────────

function SwitchLevel({ level, type, confidence }: {
  level: number
  type: string
  confidence: string
}) {
  const confColor =
    confidence === 'high'
      ? 'var(--color-profit)'
      : confidence === 'low'
        ? 'var(--color-loss)'
        : 'var(--color-warning)'

  return (
    <div
      className="flex flex-col gap-0 rounded-md overflow-hidden"
      style={{
        borderLeft: '2px solid var(--color-accent)',
        border: '1px solid var(--color-border-subtle)',
        borderLeftWidth: 2,
        borderLeftColor: 'var(--color-accent)',
        background: 'var(--color-surface-secondary)',
      }}
    >
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <Label>Switch Level</Label>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: confColor }}
        >
          {confidence}
        </span>
      </div>
      <div className="flex items-baseline justify-between px-2.5 pb-2">
        <span
          className="font-mono text-[15px] font-bold tabular-nums"
          style={{ color: 'var(--color-accent)' }}
        >
          {fmtPrice(level)}
        </span>
        <span
          className="text-[10px] font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {type}
        </span>
      </div>
      <div
        className="px-2.5 py-1 text-[9px]"
        style={{
          background: 'rgba(92,184,240,0.05)',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        Bias inverts if price crosses this level
      </div>
    </div>
  )
}

// ── 4. VELOCITY ───────────────────────────────────────────────────────────────

function VelocityBar({ scale, ratio }: { scale: number; ratio: number }) {
  // scale: signed -10 to +10
  const clampedScale = Math.max(-10, Math.min(10, scale))
  const isPositive = clampedScale >= 0
  const absPct = (Math.abs(clampedScale) / 10) * 50 // half of bar (50% per side)
  const barLeft = isPositive ? 50 : 50 - absPct

  const barColor = isPositive ? 'var(--color-profit)' : 'var(--color-loss)'
  const absLabel = Math.abs(clampedScale).toFixed(1)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>Momentum</Label>
        <div className="flex items-baseline gap-1">
          <span
            className="font-mono text-[12px] font-bold tabular-nums"
            style={{ color: barColor }}
          >
            {clampedScale > 0 ? '+' : clampedScale < 0 ? '-' : ''}{absLabel}
          </span>
          <span className="font-mono text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
            · r:{ratio.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Bidirectional bar */}
      <div className="relative h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--color-surface-raised)' }}>
        {/* Center line */}
        <div
          className="absolute top-0 bottom-0 w-px z-10"
          style={{ left: '50%', background: 'var(--color-border)' }}
        />
        <motion.div
          className="absolute top-0 bottom-0 rounded-full"
          initial={{ left: '50%', width: 0 }}
          animate={{ left: `${barLeft}%`, width: `${absPct}%` }}
          transition={transitions.easeOutSlow}
          style={{ background: barColor, opacity: 0.85 }}
        />
      </div>

      {/* Axis labels */}
      <div className="flex justify-between">
        <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>-10</span>
        <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>0</span>
        <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>+10</span>
      </div>
    </div>
  )
}

// ── 5. AUCTION QUALITY ────────────────────────────────────────────────────────

function AuctionQuality({ score, label, type }: { score: number; label: string; type: string }) {
  const isClean = type === 'clean' || score >= 7
  const isWeak = score < 4
  const pillColor = isClean
    ? 'var(--color-profit)'
    : isWeak
      ? 'var(--color-loss)'
      : 'var(--color-warning)'
  const pillBg = isClean
    ? 'rgba(0,135,87,0.1)'
    : isWeak
      ? 'rgba(239,65,54,0.1)'
      : 'rgba(247,148,29,0.1)'
  const pillBorder = isClean
    ? 'rgba(0,135,87,0.25)'
    : isWeak
      ? 'rgba(239,65,54,0.25)'
      : 'rgba(247,148,29,0.25)'

  return (
    <div className="flex items-center justify-between">
      <Label>Auction Quality</Label>
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
        style={{ background: pillBg, border: `1px solid ${pillBorder}` }}
      >
        <span
          className="font-mono text-[11px] font-bold tabular-nums"
          style={{ color: pillColor }}
        >
          {score.toFixed(1)}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: pillColor, opacity: 0.8 }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

// ── 6. NAKED POCs ─────────────────────────────────────────────────────────────

function NakedPocs({ pocs }: { pocs: BiasData['naked_pocs'] }) {
  const naked = pocs.filter((p) => p.naked)
  if (naked.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>Naked POCs</Label>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            color: 'var(--color-warning)',
            background: 'rgba(247,148,29,0.1)',
            border: '1px solid rgba(247,148,29,0.2)',
          }}
        >
          {naked.length} untested
        </span>
      </div>
      <div
        className="rounded-md overflow-hidden"
        style={{ border: '1px solid var(--color-border-subtle)' }}
      >
        {naked.slice(0, 4).map((poc, i) => {
          const isAbove = poc.distance > 0
          return (
            <div key={`${poc.date}-${poc.price}`}>
              {i > 0 && (
                <div className="h-px mx-2.5" style={{ background: 'var(--color-border-subtle)', opacity: 0.5 }} />
              )}
              <div
                className="flex items-center justify-between px-2.5 py-1.5"
                style={{ background: 'var(--color-surface-secondary)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ background: 'var(--color-warning)' }}
                  />
                  <span
                    className="font-mono text-[11px] font-semibold tabular-nums"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {fmtPrice(poc.price)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {poc.date}
                  </span>
                  <span
                    className="font-mono text-[9px] font-medium"
                    style={{ color: isAbove ? 'var(--color-loss)' : 'var(--color-profit)' }}
                  >
                    {isAbove ? '+' : ''}{poc.distance.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 7. CORRECTION ─────────────────────────────────────────────────────────────

function CorrectionBar({ impulse_size, correction_pct, is_threat, direction }: {
  impulse_size: number
  correction_pct: number
  is_threat: boolean
  direction: string
}) {
  const clampedPct = Math.max(0, Math.min(100, correction_pct))
  const color = is_threat ? 'var(--color-loss)' : 'var(--color-warning)'
  const bgColor = is_threat ? 'rgba(239,65,54,0.08)' : 'rgba(247,148,29,0.08)'
  const borderColor = is_threat ? 'rgba(239,65,54,0.25)' : 'rgba(247,148,29,0.2)'

  // Fibonacci reference zones
  const fibLevels = [
    { pct: 38.2, label: '38.2' },
    { pct: 50, label: '50' },
    { pct: 61.8, label: '61.8' },
  ]

  return (
    <div
      className="rounded-md px-2.5 py-2 flex flex-col gap-1.5"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between">
        <Label>Correction</Label>
        <div className="flex items-center gap-1.5">
          {is_threat && (
            <span
              className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded"
              style={{ color: 'var(--color-loss)', background: 'rgba(239,65,54,0.15)' }}
            >
              Threat
            </span>
          )}
          <span
            className="font-mono text-[13px] font-bold tabular-nums"
            style={{ color }}
          >
            {clampedPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Correction bar with fib zones */}
      <div className="relative h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--color-surface-raised)' }}>
        {/* Fib markers */}
        {fibLevels.map((f) => (
          <div
            key={f.pct}
            className="absolute top-0 bottom-0 w-px opacity-30"
            style={{ left: `${f.pct}%`, background: 'var(--color-border)' }}
          />
        ))}
        <motion.div
          className="absolute left-0 top-0 bottom-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedPct}%` }}
          transition={transitions.easeOutSlow}
          style={{ background: color, opacity: 0.8 }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
          {direction.toUpperCase()} · {impulse_size.toLocaleString('en-US', { maximumFractionDigits: 1 })} pts
        </span>
        <div className="flex gap-1.5">
          {fibLevels.map((f) => (
            <span key={f.pct} className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)', opacity: 0.45 }}>
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 8. KEY LEVELS ─────────────────────────────────────────────────────────────

function KeyLevelsList({ levels }: {
  levels: Array<{ level: number; tests: number; type: string }>
}) {
  if (levels.length === 0) return null

  const top5 = levels.slice(0, 5)

  function levelColor(type: string) {
    if (type === 'resistance') return 'var(--color-loss)'
    if (type === 'support') return 'var(--color-profit)'
    return 'var(--color-accent)'
  }

  function levelBg(type: string) {
    if (type === 'resistance') return 'rgba(239,65,54,0.06)'
    if (type === 'support') return 'rgba(0,135,87,0.06)'
    return 'rgba(92,184,240,0.06)'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Key Levels</Label>
      <div
        className="rounded-md overflow-hidden"
        style={{ border: '1px solid var(--color-border-subtle)' }}
      >
        {top5.map((lvl, i) => {
          const color = levelColor(lvl.type)
          const bg = levelBg(lvl.type)
          return (
            <div key={i}>
              {i > 0 && (
                <div className="h-px" style={{ background: 'var(--color-border-subtle)', opacity: 0.5 }} />
              )}
              <div
                className="flex items-center gap-0 transition-colors"
                style={{ background: 'var(--color-surface-secondary)' }}
              >
                {/* Type color bar */}
                <div className="w-0.5 self-stretch" style={{ background: color }} />

                <div
                  className="flex items-center justify-between flex-1 px-2.5 py-1.5"
                  style={{ background: bg }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider min-w-[52px]"
                      style={{ color, opacity: 0.85 }}
                    >
                      {lvl.type}
                    </span>
                    <span
                      className="font-mono text-[12px] font-bold tabular-nums"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {fmtPrice(lvl.level)}
                    </span>
                  </div>
                  <span
                    className="font-mono text-[9px] tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-surface-raised)',
                    }}
                  >
                    {lvl.tests}x
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-surface-raised)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="var(--color-text-muted)" strokeWidth="1.5" />
          <path d="M8 5v3M8 10v1" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span
        className="text-[11px] font-medium"
        style={{ color: 'var(--color-text-muted)' }}
      >
        No bias data available
      </span>
      <span
        className="text-[10px]"
        style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
      >
        Waiting for analysis...
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface BiasPanelProps {
  data?: BiasData
  loading?: boolean
}

export function BiasPanel({ data, loading = false }: BiasPanelProps) {
  if (loading) {
    return <BiasPanelSkeleton />
  }

  if (!data || !data.bias_state || !data.bias_state.state) {
    return <EmptyState />
  }

  const components = data.bias_state.components ?? {}
  const hasComponents = Object.keys(components).length > 0
  const hasNakedPocs = data.naked_pocs?.some((p: any) => p.naked)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={(data.bias_state.state ?? 'unknown') + (data.bias_state.score ?? 0)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={transitions.easeOutSlow}
        className="flex flex-col gap-2.5"
      >
        {/* 1. Bias State Header */}
        <BiasHeader state={data.bias_state} score={data.bias_state.score ?? 0} />

        {/* 2. Components Grid */}
        {hasComponents && (
          <>
            <Divider />
            <ComponentsGrid components={components} />
          </>
        )}

        {/* 3. Switch Level */}
        {data.bias_switch_level && (
          <>
            <Divider />
            <SwitchLevel
              level={data.bias_switch_level.level}
              type={data.bias_switch_level.type}
              confidence={data.bias_switch_level.confidence}
            />
          </>
        )}

        {/* 4. Velocity + 5. Auction — side by side if both exist, else stacked */}
        {(data.velocity || data.auction_quality) && (
          <>
            <Divider />
            <div className="flex flex-col gap-2.5">
              {data.velocity && (
                <VelocityBar
                  scale={data.velocity.scale}
                  ratio={data.velocity.ratio}
                />
              )}
              {data.auction_quality && (
                <AuctionQuality
                  score={data.auction_quality.score}
                  label={data.auction_quality.label}
                  type={data.auction_quality.type}
                />
              )}
            </div>
          </>
        )}

        {/* 6. Naked POCs */}
        {hasNakedPocs && (
          <>
            <Divider />
            <NakedPocs pocs={data.naked_pocs} />
          </>
        )}

        {/* 7. Correction */}
        {data.correction && (
          <>
            <Divider />
            <CorrectionBar
              impulse_size={data.correction.impulse_size}
              correction_pct={data.correction.correction_pct}
              is_threat={data.correction.is_threat}
              direction={data.correction.direction}
            />
          </>
        )}

        {/* 8. Key Levels */}
        {data.key_levels && data.key_levels.length > 0 && (
          <>
            <Divider />
            <KeyLevelsList levels={data.key_levels} />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
