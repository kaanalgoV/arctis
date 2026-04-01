import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSessionClock } from '@/hooks/useSessionClock'

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
// Ordered session sequence (market day order, CME Futures ET)
// ---------------------------------------------------------------------------
const SESSION_ORDER: string[] = [
  'overnight',
  'premarket',
  'ny_open',
  'midday',
  'afternoon',
  'power_hour',
  'after_hours',
]

const SESSION_DISPLAY_NAMES: Record<string, string> = {
  overnight: 'Overnight',
  premarket: 'Pre-Mkt',
  ny_open: 'NY Open',
  midday: 'Midday',
  afternoon: 'Afternoon',
  power_hour: 'Power Hr',
  after_hours: 'After Hrs',
}

const SESSION_TIMES: Record<string, string> = {
  overnight: '18:00-4:00',
  premarket: '4:00-9:30',
  ny_open: '9:30-10:30',
  midday: '10:30-14:00',
  afternoon: '14:00-15:00',
  power_hour: '15:00-16:00',
  after_hours: '16:00-18:00',
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
  overnight: 600,   // 18:00-04:00 ET = 10h
  premarket: 330,   // 04:00-09:30 ET = 5.5h (1-min bars)
  ny_open: 60,      // 09:30-10:30
  midday: 210,      // 10:30-14:00
  afternoon: 60,    // 14:00-15:00
  power_hour: 60,   // 15:00-16:00
  after_hours: 120, // 16:00-18:00
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
// clockSession overrides the API current_session for "active" determination.
// clockProgress (0-1) is used for the active session's progress bar.
// ---------------------------------------------------------------------------
function mapApiDataToSessionsWithClock(
  data: SessionAPIData,
  clockSession: string,
  clockProgress: number,
): Session[] {
  // currentIdx is based on the clock session (real-time), not the API session
  const currentIdx = SESSION_ORDER.indexOf(clockSession)

  return SESSION_ORDER.map((key, idx) => {
    const displayName = SESSION_DISPLAY_NAMES[key] ?? key
    const isActive = key === clockSession
    const isDone = currentIdx >= 0 && idx < currentIdx
    const rawStats = data.session_stats[key]

    let progress: number
    if (isDone) {
      progress = 100
    } else if (isActive) {
      // Prefer clock-based progress (always current) over bar-count heuristic
      progress = Math.min(99, Math.round(clockProgress * 100))
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
// Time-to-next pill
// ---------------------------------------------------------------------------
interface TimeToNextProps {
  label: string
}

function TimeToNextPill({ label }: TimeToNextProps) {
  return (
    <div className="flex items-center gap-1 pl-14 pb-1">
      <span
        className="font-sans text-[8px] uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Next
      </span>
      <span
        className="font-mono text-[9px] tabular-nums"
        style={{ color: 'var(--color-accent, #5CB8F0)', opacity: 0.8 }}
      >
        {label}
      </span>
    </div>
  )
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
    'font-sans text-[8px] uppercase tracking-wider',
    completed
      ? 'text-[var(--color-text-muted)] opacity-60'
      : 'text-[var(--color-text-muted)]',
  )
  const valueClass = cn(
    'font-mono text-[9px] tabular-nums',
    completed
      ? 'text-[var(--color-text-inactive)]'
      : 'text-[var(--color-text-secondary)]',
  )

  // For completed sessions show total volume; for active show avg
  const volumeLabel = completed ? 'Vol' : 'Avg Vol'
  const volumeValue = completed
    ? formatVolume(stats.total_volume)
    : formatVolume(stats.avg_volume)

  return (
    <div className="flex items-center gap-3 pl-14 pb-0.5">
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
        style={{
          backgroundColor: 'var(--color-accent, #5CB8F0)',
          boxShadow: '0 0 6px var(--color-accent, #5CB8F0)',
        }}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SessionPanel({ data, loading, error }: SessionPanelProps) {
  // Real-time clock — always active regardless of API data availability.
  // This is the authoritative source for which session is "now".
  const clock = useSessionClock()

  // Loading state
  if (loading && data == null) {
    return <SessionSkeleton />
  }

  // Error state — still show clock-based view when possible
  if (error && data == null) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-center py-1">
          <span className="text-[10px] text-[var(--color-loss,#FF3B3B)]">{error}</span>
        </div>
        <ClockOnlyView clock={clock} />
      </div>
    )
  }

  // No data yet — show clock-based view while waiting for API
  if (data == null) {
    return <ClockOnlyView clock={clock} />
  }

  // Merge API data with clock:
  // - currentSession comes from clock (always real-time)
  // - stats/bar counts come from API data
  // The API current_session might be stale (last bar's session), so we
  // override it with the clock value.
  const clockSession = clock.session
  const sessions: Session[] = mapApiDataToSessionsWithClock(data, clockSession, clock.progress)

  return (
    <div className="flex flex-col gap-0.5">
      {/* ET time + RTH badge */}
      <div className="flex items-center gap-2 pb-1">
        <span
          className="font-mono text-[9px] tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {clock.etTimeLabel} ET
        </span>
        <span
          className={cn(
            'px-1 py-0.5 rounded font-mono text-[8px] leading-none font-semibold tracking-wide',
          )}
          style={
            clock.isRTH
              ? { background: 'rgba(0,183,117,0.12)', color: 'var(--color-profit, #00B775)' }
              : { background: 'rgba(92,184,240,0.10)', color: 'var(--color-text-muted)' }
          }
        >
          {clock.isRTH ? 'RTH' : 'ETH'}
        </span>
      </div>

      {sessions.map((s) => (
        <div key={s.key}>
          {/* Progress row */}
          <div className="flex items-center gap-2">
            {/* Label — active gets live dot + larger text */}
            <div className="flex items-center gap-1 min-w-[52px] shrink-0">
              {s.active && <LiveDot />}
              <div className="flex flex-col leading-none gap-[2px]">
                <span
                  className={cn(
                    'font-sans font-medium text-[12px]',
                    !s.active && 'opacity-70',
                  )}
                  style={{
                    color: s.active
                      ? 'var(--color-accent, #5CB8F0)'
                      : 'var(--color-text-inactive)',
                  }}
                >
                  {s.name}
                </span>
                <span className="text-[8px] opacity-50" style={{ color: 'var(--color-text-inactive)' }}>
                  {SESSION_TIMES[s.key] ?? ''}
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{
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
                      ? 'var(--color-text-inactive)'
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
                  : 'var(--color-text-inactive)',
              }}
            >
              {s.progress > 0 ? `${s.progress}%` : ''}
            </span>
          </div>

          {/* Stats row — show for active session and completed sessions with stats */}
          {s.stats && (s.active || s.progress === 100) && (
            <StatsRow stats={s.stats} completed={s.progress === 100 && !s.active} />
          )}

          {/* Time-to-next — only under active session */}
          {s.active && clock.timeToNextLabel && (
            <TimeToNextPill label={clock.timeToNextLabel} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ClockOnlyView — shown when API data isn't available yet
// ---------------------------------------------------------------------------
interface ClockOnlyViewProps {
  clock: ReturnType<typeof useSessionClock>
}

function ClockOnlyView({ clock }: ClockOnlyViewProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 pb-1">
        <span
          className="font-mono text-[9px] tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {clock.etTimeLabel} ET
        </span>
        <span
          className="px-1 py-0.5 rounded font-mono text-[8px] leading-none font-semibold tracking-wide"
          style={
            clock.isRTH
              ? { background: 'rgba(0,183,117,0.12)', color: 'var(--color-profit, #00B775)' }
              : { background: 'rgba(92,184,240,0.10)', color: 'var(--color-text-muted)' }
          }
        >
          {clock.isRTH ? 'RTH' : 'ETH'}
        </span>
      </div>

      {SESSION_ORDER.map((key) => {
        const isActive = key === clock.session
        const progressPct = isActive ? Math.round(clock.progress * 100) : 0
        return (
          <div key={key}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 min-w-[52px] shrink-0">
                {isActive && <LiveDot />}
                <div className="flex flex-col leading-none gap-[2px]">
                  <span
                    className={cn('font-sans font-medium text-[12px]', !isActive && 'opacity-70')}
                    style={{
                      color: isActive ? 'var(--color-accent, #5CB8F0)' : 'var(--color-text-inactive)',
                    }}
                  >
                    {SESSION_DISPLAY_NAMES[key] ?? key}
                  </span>
                  <span className="text-[8px] opacity-50" style={{ color: 'var(--color-text-inactive)' }}>
                    {SESSION_TIMES[key] ?? ''}
                  </span>
                </div>
              </div>

              <div
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-border-subtle, #21262D)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: isActive ? 'var(--color-accent, #5CB8F0)' : 'transparent',
                  }}
                />
              </div>

              <span
                className="font-mono text-[9px] min-w-[28px] text-right tabular-nums"
                style={{
                  color: isActive ? 'var(--color-accent, #5CB8F0)' : 'var(--color-text-inactive)',
                }}
              >
                {progressPct > 0 ? `${progressPct}%` : ''}
              </span>
            </div>

            {isActive && clock.timeToNextLabel && (
              <TimeToNextPill label={clock.timeToNextLabel} />
            )}
          </div>
        )
      })}
    </div>
  )
}
