import { Skeleton } from '@/components/ui/Skeleton'

interface Annotation {
  timestamp: number
  pattern: string
  direction: string
  text: string
  detail: string
  confidence: string
  win_rate: number | null
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

interface Pattern {
  name: string
  description: string
  winRate?: string
  type: 'long' | 'short' | 'info'
}

interface PatternsPanelProps {
  data?: PatternsAPIData | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

const typeColors = {
  long: { border: '#22C55E', text: '#22C55E' },
  short: { border: '#EF4444', text: '#EF4444' },
  info: { border: '#5CB8F0', text: '#5CB8F0' },
}

function directionToType(direction: string): 'long' | 'short' | 'info' {
  if (direction === 'long') return 'long'
  if (direction === 'short') return 'short'
  return 'info'
}

function formatWinRate(win_rate: number | null): string | undefined {
  if (win_rate === null) return undefined
  return `${Math.round(win_rate * 100)}%`
}

function mapAnnotationToPattern(annotation: Annotation): Pattern {
  return {
    name: annotation.pattern,
    description: annotation.detail,
    winRate: formatWinRate(annotation.win_rate),
    type: directionToType(annotation.direction),
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PatternsSkeleton() {
  return (
    <div className="flex flex-col gap-px bg-[#161B22] rounded-md border border-[#21262D] overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="w-[2px] h-5 rounded-full flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2 w-28" />
          </div>
          <Skeleton className="h-3 w-8 flex-shrink-0" />
        </div>
      ))}
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
        <span className="text-[10px] text-[#EF4444]">{error}</span>
      </div>
    )
  }

  // No data state
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[11px] text-[#8B949E]">Waiting for data...</span>
      </div>
    )
  }

  const items: Pattern[] = data.annotations.map(mapAnnotationToPattern)

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[11px] text-[#8B949E]">No active patterns</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-px bg-[#161B22] rounded-md border border-[#21262D] overflow-hidden">
      {items.map((p, index) => {
        const colors = typeColors[p.type]
        return (
          <div
            key={`${p.name}-${index}`}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#21262D]/40 transition-colors"
            style={{ borderLeft: `2px solid ${colors.border}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-[#E6EDF3] truncate">
                {p.name}
              </div>
              <div className="text-[9px] text-[#484F58] truncate">
                {p.description}
              </div>
            </div>
            {p.winRate !== undefined && (
              <span
                className="font-mono text-[11px] font-semibold tabular-nums flex-shrink-0"
                style={{ color: colors.text }}
              >
                {p.winRate}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
