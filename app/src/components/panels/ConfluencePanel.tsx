import { cn } from '@/lib/utils'
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

interface ConfluenceRow {
  label: string
  value: number
}

interface ConfluencePanelProps {
  data?: ConfluenceAPIData | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

function scoreColor(score: number) {
  if (score >= 8) return 'var(--color-profit)'
  if (score >= 5) return 'var(--color-accent)'
  if (score <= -5) return 'var(--color-loss)'
  return 'var(--color-text-secondary)'
}

function valueColor(v: number) {
  if (v > 0) return 'var(--color-profit)'
  if (v < 0) return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function directionColor(dir: string) {
  if (dir === 'LONG') return 'var(--color-profit)'
  if (dir === 'SHORT') return 'var(--color-loss)'
  return 'var(--color-text-secondary)'
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ConfluenceSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2 mb-1">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-[2px]">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-6" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ConfluencePanel({ data, loading, error }: ConfluencePanelProps) {
  // Loading state
  if (loading && data == null) {
    return <ConfluenceSkeleton />
  }

  // Error state
  if (error && data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-loss)]">{error}</span>
      </div>
    )
  }

  // No data state
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-text-muted)]">Waiting for data...</span>
      </div>
    )
  }

  const score = data.score
  const verdict = data.confidence
  const direction = data.direction

  const rows: ConfluenceRow[] = data.signals.map((s) => ({ label: s.name, value: s.strength }))

  const color = scoreColor(score)
  const dirColor = directionColor(direction)

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="font-mono text-[28px] font-extrabold leading-none tabular-nums"
          style={{ color }}
        >
          {score > 0 ? '+' : ''}{score}
        </span>
        <span
          className="font-mono text-[10px] font-semibold tracking-wide uppercase"
          style={{ color }}
        >
          {verdict}
        </span>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center text-[10px] py-[2px]">
              <span className="text-[var(--color-text-muted)]">{r.label}</span>
              <span
                className="font-mono font-semibold tabular-nums"
                style={{ color: valueColor(r.value) }}
              >
                {r.value > 0 ? '+' : ''}{r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn('pt-2 flex justify-between items-center text-[10px]', rows.length > 0 ? 'mt-2' : 'mt-0')}
        style={{ borderTop: rows.length > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
      >
        <span className="text-[var(--color-text-muted)]">Direction</span>
        <span className="font-mono font-bold text-[11px]" style={{ color: dirColor }}>
          {direction}
        </span>
      </div>
    </div>
  )
}
