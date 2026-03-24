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
  stats?: {
    avg_volume: number
    avg_range: number
    total_volume: number
    bar_count: number
  }
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
// Format helpers
// ---------------------------------------------------------------------------
function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(Math.round(v))
}

function formatRange(r: number): string {
  return `${r.toFixed(1)}`
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
    const rawStats = data.session_stats[key]

    let progress: number
    if (isDone) {
      progress = 100
    } else if (isActive) {
      progress = deriveCurrentProgress(key, data.session_stats)
    } else {
      progress = 0
    }

    return {
      key,
      name: displayName,
      progress,
      active: isActive,
      stats: rawStats
        ? {
            avg_volume: rawStats.avg_volume,
            avg_range: rawStats.avg_range,
            total_volume: rawStats.total_volume,
            bar_count: rawStats.bar_count,
          }
        : undefined,
    }
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
// Session stats row — shown below the active session
// ---------------------------------------------------------------------------
interface StatsRowProps {
  stats: NonNullable<Session['stats']>
  completed?: boolean
}

function StatsRow({ stats, completed = false }: StatsRowProps) {
  const labelClass = cn(
    'font-mono text-[8px] uppercase tracking-wide',
    completed
      ? 'text-[var(--color-text-muted)] opacity-60'
      : 'text-[var(--color-text-muted)]',
  )
  const valueClass = cn(
    'font-mono text-[9px] tabular-nums',
    completed
      ? 'text-[#484F58]'
      : 'text-[var(--color-text-secondary)]',
  )

  // For completed sessions show total volume; for active show avg
  const volumeLabel = completed ? 'Vol' : 'Avg Vol'
  const volumeValue = completed
    ? formatVolume(stats.total_volume)
    : formatVolume(stats.avg_volume)

  return (
    <div className="flex items-center gap-2 pl-[60px] pb-0.5">
      <span className={labelClass}>{volumeLabel}</span>
      <span className={valueClass}>{volumeValue}</span>
      <span
        className="text-[7px]"
        style={{ color: 'var(--color-border-subtle)' }}
      >
        |
      </span>
      <span className={labelClass}>Range</span>
      <span className={valueClass}>{formatRange(stats.avg_range)} pts</span>
      <span
        className="text-[7px]"
        style={{ color: 'var(--color-border-subtle)' }}
      >
        |
      </span>
      <span className={labelClass}>Bars</span>
      <span className={valueClass}>{stats.bar_count}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pulsing live dot
// ---------------------------------------------------------------------------
function LiveDot() {
  return (
    <span className="relative flex h-[6px] w-[6px] shrink-0">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: 'var(--color-accent, #5CB8F0)' }}
      />
      <span
        className="relative inline-flex rounded-full h-[6px] w-[6px]"
        style={{ backgroundColor: 'var(--color-accent, #5CB8F0)' }}
      />
    </span>
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
    <div className="flex flex-col gap-0.5">
      {sessions.map((s) => (
        <div key={s.key}>
          {/* Progress row */}
          <div className="flex items-center gap-2">
            {/* Label — active gets live dot + larger text */}
            <div className="flex items-center gap-1 min-w-[52px] shrink-0">
              {s.active && <LiveDot />}
              <span
                className={cn(
                  s.active
                    ? 'text-[11px] font-semibold'
                    : 'text-[10px]',
                )}
                style={{
                  color: s.active
                    ? 'var(--color-accent, #5CB8F0)'
                    : s.progress === 100
                      ? '#484F58'
                      : '#484F58',
                }}
              >
                {s.name}
              </span>
            </div>

            {/* 2px thin progress track */}
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{
                height: s.active ? '3px' : '2px',
                backgroundColor: 'var(--color-border-subtle, #21262D)',
              }}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                )}
                style={{
                  width: `${s.progress}%`,
                  backgroundColor: s.active
                    ? 'var(--color-accent, #5CB8F0)'
                    : s.progress === 100
                      ? 'rgba(92,184,240,0.25)'
                      : 'transparent',
                }}
              />
            </div>

            {/* Percentage — always reserve space */}
            <span
              className="font-mono text-[9px] min-w-[28px] text-right tabular-nums"
              style={{
                color: s.active
                  ? 'var(--color-accent, #5CB8F0)'
                  : '#484F58',
              }}
            >
              {s.progress > 0 ? `${s.progress}%` : ''}
            </span>
          </div>

          {/* Stats row — show for active session and completed sessions with stats */}
          {s.stats && (s.active || s.progress === 100) && (
            <StatsRow stats={s.stats} completed={s.progress === 100 && !s.active} />
          )}
        </div>
      ))}
    </div>
  )
}
