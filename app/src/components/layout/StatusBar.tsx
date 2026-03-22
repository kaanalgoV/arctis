import { cn } from '@/lib/utils'

interface StatusBarProps {
  connected?: boolean
  latencyMs?: number
  barsLoaded?: number
  lastUpdate?: string
  version?: string
}

export function StatusBar({
  connected = true,
  latencyMs = 12,
  barsLoaded = 247,
  lastUpdate = '09:57:42 ET',
  version = '0.1.0',
}: StatusBarProps) {
  return (
    <footer
      className={cn(
        'flex items-center h-full w-full px-3',
        'bg-[var(--color-surface-primary)]',
        'border-t border-[var(--color-border-subtle)]',
        'font-mono text-[10px] text-[var(--color-text-muted)]',
      )}
    >
      {/* Left: Connection status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            connected ? 'bg-[var(--color-profit)]' : 'bg-[var(--color-loss)]',
          )}
        />
        <span
          className={cn(
            'leading-none',
            connected ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]',
          )}
        >
          Connected
        </span>
        <span className="text-[var(--color-border)] mx-0.5 leading-none">|</span>
        <span className="leading-none text-[var(--color-text-muted)]">
          Latency:{' '}
          <span className="text-[var(--color-profit)]">{latencyMs}ms</span>
        </span>
      </div>

      {/* Center: Bar count + last update */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <span className="leading-none truncate">
          {barsLoaded} bars loaded
          <span className="text-[var(--color-border)] mx-1.5">|</span>
          Last update: {lastUpdate}
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
