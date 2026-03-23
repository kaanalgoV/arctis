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
  if (score >= 8) return '#22C55E'
  if (score >= 5) return '#5CB8F0'
  if (score <= -5) return '#EF4444'
  return '#8B949E'
}

function valueColor(v: number) {
  if (v > 0) return '#22C55E'
  if (v < 0) return '#EF4444'
  return '#8B949E'
}

function directionColor(dir: string) {
  if (dir === 'LONG') return '#22C55E'
  if (dir === 'SHORT') return '#EF4444'
  return '#8B949E'
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
        <span className="text-[10px] text-[#EF4444]">{error}</span>
      </div>
    )
  }

  // No data state
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[#8B949E]">Waiting for data...</span>
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
    <div className="flex flex-col gap-0">
      {/* Score + verdict on one line */}
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="font-mono text-[28px] font-bold leading-none tabular-nums"
          style={{ color }}
        >
          {score > 0 ? '+' : ''}{score}
        </span>
        <span
          className="text-[9px] font-semibold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded bg-[#161B22] border border-[#21262D]"
          style={{ color }}
        >
          {verdict}
        </span>
      </div>

      {/* Direction indicator */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dirColor }}
        />
        <span className="text-[10px] font-semibold" style={{ color: dirColor }}>
          {direction}
        </span>
      </div>

      {/* Signal rows */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-px bg-[#161B22] rounded-md border border-[#21262D] overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center px-2 py-1 text-[11px] hover:bg-[#21262D]/40 transition-colors">
              <span className="text-[#8B949E]">{r.label}</span>
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
    </div>
  )
}
