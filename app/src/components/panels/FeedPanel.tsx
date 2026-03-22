import { useState } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedItem {
  time: string
  message: string
  type: 'signal' | 'info' | 'warning' | 'structure' | 'volume' | 'risk' | 'bias'
  /** Unix timestamp in seconds — used for chart navigation. */
  timestamp?: number
}

type FilterKey = 'all' | 'signal' | 'structure' | 'volume' | 'risk'

interface FilterConfig {
  key: FilterKey
  label: string
  /** Item types that belong to this filter. */
  matches: FeedItem['type'][]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTERS: FilterConfig[] = [
  { key: 'all', label: 'All', matches: ['signal', 'info', 'warning', 'structure', 'volume', 'risk', 'bias'] },
  { key: 'signal', label: 'Signals', matches: ['signal', 'info', 'bias'] },
  { key: 'structure', label: 'Structure', matches: ['structure'] },
  { key: 'volume', label: 'Volume', matches: ['volume'] },
  { key: 'risk', label: 'Risk', matches: ['risk', 'warning'] },
]

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
  risk: 'var(--color-loss)',
  bias: 'var(--color-info)',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FeedPanelProps {
  items?: FeedItem[]
  onItemClick?: (timestamp: number) => void
}

export function FeedPanel({ items, onItemClick }: FeedPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const allItems = (items ?? defaultItems).slice(0, 50)

  // Count per filter (excluding 'all')
  const countByFilter = (filter: FilterConfig): number => {
    if (filter.key === 'all') return allItems.length
    return allItems.filter((item) => filter.matches.includes(item.type)).length
  }

  // Apply active filter
  const displayItems =
    activeFilter === 'all'
      ? allItems
      : allItems.filter((item) => {
          const cfg = FILTERS.find((f) => f.key === activeFilter)
          return cfg ? cfg.matches.includes(item.type) : true
        })

  return (
    <div className="flex flex-col gap-1.5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((filter) => {
          const count = countByFilter(filter)
          const isActive = activeFilter === filter.key
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)]',
                'text-[10px] font-medium transition-colors leading-none',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.03]',
              )}
            >
              {filter.label}
              {count > 0 && (
                <span
                  className={cn(
                    'tabular-nums',
                    isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-px max-h-[200px] overflow-y-auto">
        {displayItems.length === 0 ? (
          <p className="py-2 px-1 text-[11px] text-[var(--color-text-muted)]">
            No events
          </p>
        ) : (
          displayItems.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                if (item.timestamp != null && onItemClick) {
                  onItemClick(item.timestamp)
                }
              }}
              className={cn(
                'flex items-start gap-1.5 py-1 px-1 rounded-[var(--radius-sm)]',
                'hover:bg-white/[0.02] transition-colors',
                item.timestamp != null && onItemClick ? 'cursor-pointer' : 'cursor-default',
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
    </div>
  )
}
