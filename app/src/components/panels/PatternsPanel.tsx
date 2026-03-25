import { Skeleton } from '@/components/ui/Skeleton'

interface Annotation {
  timestamp: number
  pattern: string
  direction: string
  text: string
  detail: string
  confidence: string
  win_rate: number | null
  profit_factor: number | null
  sample_size: number | null
  category: string
  price: number | null
  target: number | null
  marker_type: string
  color: string
  expiry_days: number
}

export interface PatternsAPIData {
  annotations: Annotation[]
  day_type: string
  day_bias: string
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
const typeColors: Record<string, { border: string; text: string }> = {
  long: { border: 'var(--color-profit)', text: 'var(--color-profit)' },
  short: { border: 'var(--color-loss)', text: 'var(--color-loss)' },
  info: { border: 'var(--color-accent, #5CB8F0)', text: 'var(--color-accent, #5CB8F0)' },
}

function directionToType(direction: string): 'long' | 'short' | 'info' {
  if (direction === 'long') return 'long'
  if (direction === 'short') return 'short'
  return 'info'
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatTimestamp(ts: number): string {
  // ts is Unix seconds or ms — normalize to ms
  const ms = ts < 1e12 ? ts * 1000 : ts
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatConfidence(confidence: string): string {
  // confidence may be "0.75", "75%", "high", etc.
  const num = parseFloat(confidence)
  if (!isNaN(num)) {
    // If it's a fraction like 0.75, convert to percent
    if (num <= 1) return `${Math.round(num * 100)}%`
    return `${Math.round(num)}%`
  }
  return confidence
}

function formatPrice(price: number): string {
  return price.toFixed(2)
}

function formatWinRate(win_rate: number | null): string | null {
  if (win_rate === null) return null
  // Backend sends whole numbers (e.g. 48.0 for 48%), not fractions
  if (win_rate > 1) return `${Math.round(win_rate)}%`
  return `${Math.round(win_rate * 100)}%`
}

function formatRR(price: number, target: number, _direction: string): string | null {
  const dist = Math.abs(target - price)
  if (dist === 0) return null
  // Simple 1:R ratio display (assume 1pt stop for ratio context)
  const ratio = (dist / 1).toFixed(1)
  return `T: ${formatPrice(target)} (+${ratio})`
}

// ---------------------------------------------------------------------------
// Day context pill
// ---------------------------------------------------------------------------
interface DayPillProps {
  label: string
  value: string
  accentColor?: string
}

function DayPill({ label, value, accentColor }: DayPillProps) {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: 'var(--color-surface-tertiary, #21262D)',
        border: '1px solid var(--color-border-subtle, #30363D)',
      }}
    >
      <span
        className="font-mono text-[8px] uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted, #484F58)' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[9px] font-semibold capitalize"
        style={{ color: accentColor ?? 'var(--color-text-secondary, #8B949E)' }}
      >
        {value}
      </span>
    </div>
  )
}

function getBiasColor(bias: string): string {
  const lower = bias.toLowerCase()
  if (lower === 'long' || lower === 'bullish') return 'var(--color-profit)'
  if (lower === 'short' || lower === 'bearish') return 'var(--color-loss)'
  return 'var(--color-accent, #5CB8F0)'
}

// ---------------------------------------------------------------------------
// Interface: PatternsPanelProps
// ---------------------------------------------------------------------------
interface PatternsPanelProps {
  data?: PatternsAPIData | null
  loading?: boolean
  error?: string | null
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PatternsSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Day context skeleton */}
      <div className="flex items-center gap-1.5 mb-1">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      {/* Pattern card skeletons */}
      <div
        className="flex flex-col gap-px rounded-md overflow-hidden"
        style={{
          border: '1px solid var(--color-border-subtle, #21262D)',
          backgroundColor: 'var(--color-surface-secondary, #161B22)',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5">
            <Skeleton className="w-[2px] h-8 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-2.5 w-8" />
              </div>
              <Skeleton className="h-2 w-32" />
              <Skeleton className="h-2 w-20" />
            </div>
            <Skeleton className="h-3 w-8 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pattern card
// ---------------------------------------------------------------------------
interface PatternCardProps {
  annotation: Annotation
  isLast: boolean
}

function PatternCard({ annotation, isLast }: PatternCardProps) {
  const type = directionToType(annotation.direction)
  const colors = typeColors[type]
  const winRate = formatWinRate(annotation.win_rate)
  const confidence = annotation.confidence ? formatConfidence(annotation.confidence) : null
  const rrLabel =
    annotation.price && annotation.target
      ? formatRR(annotation.price, annotation.target, annotation.direction)
      : null

  const directionLabel =
    type === 'long' ? 'Long' : type === 'short' ? 'Short' : annotation.direction

  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 hover:bg-[var(--color-surface-raised)]/40 transition-colors"
      style={{
        borderLeft: `2px solid ${colors.border}`,
        borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle, #1C2128)',
      }}
    >
      <div className="flex-1 min-w-0">
        {/* Row 1: time + pattern name + direction label */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="font-mono text-[8px] tabular-nums shrink-0"
            style={{ color: 'var(--color-text-muted, #484F58)' }}
          >
            {formatTimestamp(annotation.timestamp)}
          </span>
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: 'var(--color-text-primary, #E6EDF3)' }}
          >
            {annotation.pattern}
          </span>
          <span
            className="font-mono text-[8px] font-semibold shrink-0"
            style={{ color: colors.text }}
          >
            {directionLabel}
          </span>
          {confidence && (
            <span
              className="font-mono text-[8px] shrink-0"
              style={{ color: 'var(--color-text-muted, #484F58)' }}
            >
              {confidence}
            </span>
          )}
        </div>

        {/* Row 2: detail text */}
        {annotation.detail && (
          <div
            className="text-[9px] mt-0.5 truncate"
            style={{ color: 'var(--color-text-muted, #484F58)' }}
          >
            {annotation.detail}
          </div>
        )}

        {/* Row 3: price + target R:R */}
        {(annotation.price || rrLabel) && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {annotation.price && (
              <span
                className="font-mono text-[9px] tabular-nums"
                style={{ color: 'var(--color-text-secondary, #8B949E)' }}
              >
                @ {formatPrice(annotation.price)}
              </span>
            )}
            {rrLabel && (
              <span
                className="font-mono text-[9px] tabular-nums"
                style={{ color: colors.text, opacity: 0.8 }}
              >
                {rrLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right column: stats */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        {winRate && (
          <div className="flex items-center gap-1">
            <span
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted, #484F58)' }}
            >
              WR
            </span>
            <span
              className="font-mono text-[10px] font-semibold tabular-nums"
              style={{ color: colors.text }}
            >
              {winRate}
            </span>
          </div>
        )}
        {annotation.profit_factor != null && (
          <div className="flex items-center gap-1">
            <span
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted, #484F58)' }}
            >
              PF
            </span>
            <span
              className="font-mono text-[10px] font-semibold tabular-nums"
              style={{
                color: annotation.profit_factor >= 1.5
                  ? 'var(--color-profit, #22C55E)'
                  : annotation.profit_factor >= 1.0
                    ? 'var(--color-text-secondary, #8B949E)'
                    : 'var(--color-loss, #EF4444)',
              }}
            >
              {annotation.profit_factor.toFixed(1)}x
            </span>
          </div>
        )}
        {annotation.sample_size != null && (
          <span
            className="font-mono text-[7px] tabular-nums"
            style={{ color: 'var(--color-text-muted, #484F58)' }}
          >
            n={annotation.sample_size}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PatternsPanel({ data, loading, error }: PatternsPanelProps) {
  // Loading state
  if (loading && data == null) {
    return <PatternsSkeleton />
  }

  // Error state
  if (error && data == null) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[10px]" style={{ color: 'var(--color-loss)' }}>{error}</span>
      </div>
    )
  }

  // No data state
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-4">
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-muted, #8B949E)' }}
        >
          Waiting for data...
        </span>
      </div>
    )
  }

  const hasDayContext = data.day_type || data.day_bias
  const hasPatterns = data.annotations.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      {/* Day context header */}
      {hasDayContext && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {data.day_type && (
            <DayPill
              label="Day"
              value={data.day_type}
              accentColor="var(--color-accent, #5CB8F0)"
            />
          )}
          {data.day_bias && (
            <DayPill
              label="Bias"
              value={data.day_bias}
              accentColor={getBiasColor(data.day_bias)}
            />
          )}
        </div>
      )}

      {/* Pattern cards */}
      {!hasPatterns ? (
        <div className="flex items-center justify-center py-3">
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted, #8B949E)' }}
          >
            No active patterns
          </span>
        </div>
      ) : (
        <div
          className="flex flex-col rounded-md overflow-hidden"
          style={{
            border: '1px solid var(--color-border-subtle, #21262D)',
            backgroundColor: 'var(--color-surface-secondary, #161B22)',
          }}
        >
          {data.annotations.map((annotation, index) => (
            <PatternCard
              key={`${annotation.pattern}-${annotation.timestamp}-${index}`}
              annotation={annotation}
              isLast={index === data.annotations.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
