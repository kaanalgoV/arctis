import { cn } from '@/lib/utils'

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
// Static fallback data (used when no `data` prop is supplied)
// ---------------------------------------------------------------------------
const DEFAULT_SESSIONS: Session[] = [
  { key: 'premarket', name: 'Pre-Mkt', progress: 100, active: false },
  { key: 'ny_open', name: 'NY Open', progress: 45, active: true },
  { key: 'midday', name: 'Midday', progress: 0, active: false },
  { key: 'power_hour', name: 'Power Hr', progress: 0, active: false },
]

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
  /** Live API response. When omitted the panel falls back to static data. */
  data?: SessionAPIData
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SessionPanel({ data }: SessionPanelProps) {
  const sessions: Session[] = data ? mapApiDataToSessions(data) : DEFAULT_SESSIONS

  return (
    <div className="flex flex-col gap-1">
      {sessions.map((s) => (
        <div
          key={s.key}
          className={cn(
            'flex items-center gap-2 px-1.5 py-1 rounded-[var(--radius-sm)] transition-colors',
            s.active && 'bg-[var(--color-accent-muted)]',
          )}
        >
          <span
            className={cn(
              'text-[10px] min-w-[52px]',
              s.active
                ? 'text-[var(--color-accent)] font-medium'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {s.name}
          </span>

          <div className="flex-1 h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                s.active
                  ? 'bg-gradient-to-r from-[var(--color-accent-dark)] to-[var(--color-accent)] shadow-[0_0_4px_rgba(92,184,240,0.2)]'
                  : s.progress === 100
                    ? 'bg-[var(--color-accent-dark)] opacity-40'
                    : '',
              )}
              style={{ width: `${s.progress}%` }}
            />
          </div>

          {s.active && s.progress > 0 && (
            <span className="font-mono text-[9px] min-w-[28px] text-right tabular-nums text-[var(--color-accent)]">
              {s.progress}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
