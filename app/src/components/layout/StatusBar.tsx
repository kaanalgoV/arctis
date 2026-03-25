import { cn } from '@/lib/utils'
import { useMarketStore } from '@/store/market'

// ---------------------------------------------------------------------------
// Live store integration — graceful: if the live module doesn't exist yet,
// latencyMs falls back to the prop value.
// ---------------------------------------------------------------------------
function tryGetLiveLatency(): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/live') as { useLiveStore?: { getState: () => { latencyMs: number } } }
    return mod.useLiveStore?.getState?.()?.latencyMs ?? null
  } catch {
    return null
  }
}

interface ReplayInfo {
  active: boolean
  progress_pct: number
  current_date?: string | null
}

interface StatusBarProps {
  connected?: boolean
  latencyMs?: number
  barsLoaded?: number
  lastUpdate?: string
  version?: string
  replay?: ReplayInfo | null
  liveFeed?: boolean
  liveProvider?: 'rithmic' | 'databento' | null
}

export function StatusBar({
  connected,
  latencyMs = 0,
  barsLoaded = 0,
  lastUpdate = '--:--:--',
  version = '0.1.0',
  replay,
  liveFeed = false,
  liveProvider = null,
}: StatusBarProps) {
  const { wsStatus, symbol, lastBarTs, dataSource } = useMarketStore()

  // Prefer live store latency when data source is live
  const liveLatency = dataSource === 'live' ? tryGetLiveLatency() : null
  const effectiveLatencyMs = liveLatency ?? latencyMs

  const isReplayActive = replay?.active === true

  // Resolve connection from wsStatus if connected prop not explicitly passed
  const isConnected = connected !== undefined ? connected : wsStatus === 'connected'
  const isReconnecting = wsStatus === 'reconnecting'

  // Dot color: green = connected, yellow = reconnecting, red = disconnected
  const dotColor = isConnected
    ? 'bg-[var(--color-profit)]'
    : isReconnecting
    ? 'bg-[var(--color-warning)]'
    : 'bg-[var(--color-loss)]'

  const statusLabel = isConnected
    ? 'Connected'
    : isReconnecting
    ? 'Reconnecting'
    : 'OFFLINE'

  // Status label always muted — only the dot carries the color signal
  const statusTextColor = 'text-[var(--color-text-muted)]'

  // Format last bar timestamp for display
  const lastBarDisplay = lastBarTs != null
    ? new Date(lastBarTs * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/New_York',
      }) + ' ET'
    : lastUpdate

  return (
    <footer
      className={cn(
        'flex items-center h-full w-full px-3',
        'bg-[var(--color-surface-void)]',
        'border-t border-[var(--color-border-subtle)]',
        'font-mono text-[var(--text-2xs,10px)] text-[var(--color-text-muted)]',
      )}
    >
      {/* Left: Connection status or REPLAY badge or LIVE badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isReplayActive ? (
          <>
            <span
              className="px-1.5 py-0.5 rounded font-mono text-[var(--text-2xs,10px)] font-semibold leading-none tracking-wide"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
            >
              REPLAY
            </span>
            {replay?.current_date && (
              <>
                <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
                <span className="leading-none" style={{ color: '#FBBF24' }}>
                  {replay.current_date}
                </span>
              </>
            )}
            <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
            <span className="leading-none" style={{ color: '#FBBF24' }}>
              {Math.round(replay?.progress_pct ?? 0)}%
            </span>
          </>
        ) : liveFeed ? (
          <>
            {/* Provider badge — slightly different style per provider */}
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-semibold leading-none tracking-wide"
              style={{
                fontSize: 10,
                background: liveProvider === 'rithmic'
                  ? 'rgba(92,184,240,0.15)'
                  : liveProvider === 'databento'
                  ? 'rgba(0,135,87,0.12)'
                  : 'rgba(239,65,54,0.12)',
                color: liveProvider === 'rithmic'
                  ? 'var(--color-accent)'
                  : liveProvider === 'databento'
                  ? 'var(--color-profit)'
                  : 'var(--color-loss)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                style={{
                  backgroundColor: liveProvider === 'rithmic'
                    ? 'var(--color-accent)'
                    : liveProvider === 'databento'
                    ? 'var(--color-profit)'
                    : 'var(--color-loss)',
                }}
              />
              {liveProvider === 'rithmic' ? 'RITHMIC' : liveProvider === 'databento' ? 'DATABENTO' : 'LIVE'}
            </span>
            {/* Last tick — shown when we have a live bar timestamp */}
            {lastBarTs != null && (
              <>
                <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
                <span className="leading-none" style={{ color: 'var(--color-accent)', fontSize: 10 }}>
                  Tick: {lastBarDisplay}
                </span>
              </>
            )}
          </>
        ) : (
          <>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
            <span className={cn('leading-none', statusTextColor)}>
              {statusLabel}
            </span>
            <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
            <span className="leading-none text-[var(--color-text-muted)]">
              Latency:{' '}
              <span className="text-[var(--color-text-muted)]">
                {isConnected ? `${effectiveLatencyMs}ms` : '—'}
              </span>
            </span>
          </>
        )}

        {/* Data source indicator — shows LIVE (green pulsing) or DB (amber) */}
        {!isReplayActive && (
          <>
            <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
            {dataSource === 'live' ? (
              <span className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: 'var(--color-profit)' }}
                />
                <span
                  className="font-mono text-[var(--text-2xs,10px)] font-semibold leading-none tracking-wide"
                  style={{ color: 'var(--color-profit)' }}
                >
                  LIVE
                </span>
                {liveLatency !== null && (
                  <span className="text-[var(--color-text-muted)] leading-none text-[var(--text-2xs,10px)]">
                    {liveLatency}ms
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: '#F0A500' }}
                />
                <span
                  className="font-mono text-[var(--text-2xs,10px)] font-semibold leading-none tracking-wide"
                  style={{ color: '#F0A500' }}
                >
                  DB
                </span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Center: Bar count + last bar timestamp */}
      <div className="flex-1 flex items-center justify-center min-w-0 gap-2">
        <span className="leading-none truncate">
          {barsLoaded} bars loaded
          <span className="text-[var(--color-border)] mx-1.5">|</span>
          Last bar: {lastBarDisplay}
        </span>
      </div>

      {/* Right: Version */}
      <div className="shrink-0">
        <span className="leading-none text-[var(--color-text-muted)]">
          Arctis Engine v{version}
        </span>
      </div>
    </footer>
  )
}
