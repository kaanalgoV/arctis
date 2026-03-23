import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// API shape from /api/analysis/sessions
// ---------------------------------------------------------------------------
export interface SessionAPIData {
  current_session: string // e.g. "ny_open" | "premarket" | "midday" | "power_hour" | "after_hours" | "closed"
  session_stats: Record<
    string,
    {
      bar_count: number
      avg_volume: number
      avg_range: number
      total_volume: number
    }
  >
  bar_count: number
}

// ---------------------------------------------------------------------------
// Internal session representation
// ---------------------------------------------------------------------------
interface Session {
  key: string
  name: string
  progress: number // 0-100
  active: boolean
}

// ---------------------------------------------------------------------------
// Ordered session sequence (market day order)
// ---------------------------------------------------------------------------
const SESSION_ORDER: string[] = [
  'premarket',
  'ny_open',
  'midday',
  'power_hour',
  'after_hours',
]

const SESSION_DISPLAY_NAMES: Record<string, string> = {
  premarket: 'Pre-Mkt',
  ny_open: 'NY Open',
  midday: 'Midday',
  power_hour: 'Power Hr',
  after_hours: 'After Hrs',
}

// ---------------------------------------------------------------------------
// Helper: derive progress for the current active session.
//
// We use bar_count from session_stats[current_session] vs. expected bars:
//   premarket    ~78 bars (6:30-9:30 ET, 1-min)
//   ny_open      ~60 bars (9:30-10:30)
//   midday       ~210 bars (10:30-14:00)
//   power_hour   ~60 bars (15:00-16:00)
//   after_hours  ~240 bars (16:00-20:00)
// Capped at 99 so 100% is reserved for completed sessions.
// ---------------------------------------------------------------------------
const EXPECTED_BARS: Record<string, number> = {
  premarket: 78,
  ny_open: 60,
  midday: 210,
  power_hour: 60,
  after_hours: 240,
}

function deriveCurrentProgress(
  sessionKey: string,
  stats: SessionAPIData['session_stats'],
): number {
  const stat = stats[sessionKey]
  if (!stat) return 0
  const expected = EXPECTED_BARS[sessionKey] ?? 60
  const raw = Math.round((stat.bar_count / expected) * 100)
  return Math.min(raw, 99) // never reach 100 while still active
}

// ---------------------------------------------------------------------------
// Map API data -> internal Session[]
// ---------------------------------------------------------------------------
function mapApiDataToSessions(data: SessionAPIData): Session[] {
  const currentIdx = SESSION_ORDER.indexOf(data.current_session)

  return SESSION_ORDER.map((key, idx) => {
    const displayName = SESSION_DISPLAY_NAMES[key] ?? key
    const isActive = key === data.current_session
    const isDone = currentIdx >= 0 && idx < currentIdx

    let progress: number
    if (isDone) {
      progress = 100
    } else if (isActive) {
      progress = deriveCurrentProgress(key, data.session_stats)
    } else {
      progress = 0
    }

    return { key, name: displayName, progress, active: isActive }
  })
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SessionPanelProps {
  /** Live API response. When omitted the panel shows a loading skeleton. */
  data?: SessionAPIData | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function SessionSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {SESSION_ORDER.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-[52px]" />
          <Skeleton className="flex-1 h-[2px]" />
          <Skeleton className="h-2.5 w-[28px]" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SessionPanel({ data, loading, error }: SessionPanelProps) {
  // Loading state
  if (loading && data == null) {
    return <SessionSkeleton />
  }

  // Error state
  if (error && data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[#EF4444]">{error}</span>
      </div>
    )
  }

  // No data yet (backend not running or first load)
  if (data == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[#8B949E]">Waiting for data...</span>
      </div>
    )
  }

  const sessions: Session[] = mapApiDataToSessions(data)

  return (
    <div className="flex flex-col gap-1.5">
      {sessions.map((s) => (
        <div key={s.key} className="flex items-center gap-2">
          {/* Label */}
          <span
            className={cn(
              'text-[10px] min-w-[52px] shrink-0',
              s.active
                ? 'text-[#5CB8F0] font-semibold'
                : 'text-[#484F58]',
            )}
          >
            {s.name}
          </span>

          {/* 2px thin progress track */}
          <div className="flex-1 h-[2px] bg-[#21262D] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                s.active
                  ? 'bg-[#5CB8F0]'
                  : s.progress === 100
                    ? 'bg-[#5CB8F0] opacity-25'
                    : '',
              )}
              style={{ width: `${s.progress}%` }}
            />
          </div>

          {/* Percentage — always reserve space */}
          <span
            className={cn(
              'font-mono text-[9px] min-w-[28px] text-right tabular-nums',
              s.active ? 'text-[#5CB8F0]' : 'text-[#484F58]',
            )}
          >
            {s.progress > 0 ? `${s.progress}%` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
