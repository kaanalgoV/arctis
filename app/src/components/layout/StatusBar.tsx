import { cn } from '@/lib/utils'
import { useMarketStore } from '@/store/market'

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
}

export function StatusBar({
  connected,
  latencyMs = 0,
  barsLoaded = 0,
  lastUpdate = '--:--:--',
  version = '0.1.0',
  replay,
}: StatusBarProps) {
  const { wsStatus, symbol, lastBarTs } = useMarketStore()

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
    : 'Disconnected'

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
        'bg-[var(--color-surface-primary)]',
        'border-t border-[var(--color-border-subtle)]',
        'font-mono text-[10px] text-[var(--color-text-muted)]',
      )}
    >
      {/* Left: Connection status or REPLAY badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isReplayActive ? (
          <>
            <span
              className="px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold leading-none tracking-wide"
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
                {latencyMs}ms
              </span>
            </span>
          </>
        )}
      </div>

      {/* Center: Symbol + bar count + last bar timestamp */}
      <div className="flex-1 flex items-center justify-center min-w-0 gap-2">
        <span className="leading-none text-[var(--color-text-muted)]">
          {symbol}
        </span>
        <span className="text-[var(--color-border)]">|</span>
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
