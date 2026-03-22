import { cn } from '@/lib/utils'

export interface FeedItem {
  time: string
  message: string
  type: 'signal' | 'info' | 'warning' | 'structure' | 'volume'
}

interface FeedPanelProps {
  items?: FeedItem[]
}

const defaultItems: FeedItem[] = [
  { time: '09:31', message: 'ORB Long triggered - 84%', type: 'signal' },
  { time: '09:30', message: 'NY Open Session', type: 'info' },
  { time: '09:28', message: 'RVOL Spike 3.2x', type: 'volume' },
  { time: '09:25', message: 'EMA Bull Alignment', type: 'signal' },
  { time: '09:22', message: 'Trend: Uptrend HH+HL', type: 'structure' },
  { time: '09:18', message: 'BOS Long confirmed', type: 'structure' },
  { time: '09:15', message: 'ORB Range: 5128-5140', type: 'info' },
  { time: '09:10', message: 'Gap Up +0.3%', type: 'warning' },
]

const dotColor: Record<FeedItem['type'], string> = {
  signal: 'var(--color-profit)',
  info: 'var(--color-accent)',
  warning: 'var(--color-warning)',
  structure: 'var(--color-accent)',
  volume: 'var(--color-warning)',
}

export function FeedPanel({ items }: FeedPanelProps) {
  const displayItems = (items ?? defaultItems).slice(0, 20)

  return (
    <div className="flex flex-col gap-px max-h-[220px] overflow-y-auto">
      {displayItems.length === 0 ? (
        <p className="py-2 px-1 text-[11px] text-[var(--color-text-muted)]">
          No events yet
        </p>
      ) : (
        displayItems.map((item, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-1.5 py-1 px-1 rounded-[var(--radius-sm)]',
              'hover:bg-white/[0.02] transition-colors',
            )}
          >
            <span className="font-mono text-[9px] text-[var(--color-text-muted)] min-w-[32px] pt-[1px] tabular-nums">
              {item.time}
            </span>
            <span
              className="w-1 h-1 rounded-full flex-shrink-0 mt-[5px]"
              style={{ background: dotColor[item.type] }}
            />
            <span className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
              {item.message}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
