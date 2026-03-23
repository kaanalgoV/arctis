import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

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

// Severity-based dot colors — only actual signals and risk use color
const dotColor: Record<FeedItem['type'], string> = {
  signal: '#22C55E',
  info: '#484F58',
  warning: '#6E7681',
  structure: '#484F58',
  volume: '#6E7681',
  risk: '#EF4444',
  bias: '#484F58',
}

// Severity-based text color for the message — muted by default
const messageColor: Record<FeedItem['type'], string> = {
  signal: '#8B949E',
  info: '#8B949E',
  warning: '#8B949E',
  structure: '#8B949E',
  volume: '#6E7681',
  risk: '#EF4444',
  bias: '#484F58',
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-1.5 py-0.5 px-0.5">
          <Skeleton className="h-2 w-8 mt-1 flex-shrink-0" />
          <Skeleton className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" />
          <Skeleton className="flex-1 h-2 mt-0.5" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FeedPanelProps {
  items?: FeedItem[]
  /** Whether data is currently being fetched (first load). */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
  onItemClick?: (timestamp: number) => void
}

export function FeedPanel({ items, loading, error, onItemClick }: FeedPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  // Loading state (no items yet)
  if (loading && (items == null || items.length === 0)) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className="px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium text-[var(--color-text-muted)] bg-white/[0.02]"
            >
              {f.label}
            </span>
          ))}
        </div>
        <FeedSkeleton />
      </div>
    )
  }

  // Error state (no items)
  if (error && (items == null || items.length === 0)) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-loss)]">{error}</span>
      </div>
    )
  }

  // No data state
  if (items == null || items.length === 0) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[11px] text-[var(--color-text-muted)]">No events yet</span>
      </div>
    )
  }

  // Reverse-chronological order (most recent first) — already sorted by App.tsx
  const allItems = items.slice(0, 50)

  // Count per filter
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

      {/* Event list — reverse-chronological */}
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
              <span
                className="text-[11px] leading-snug"
                style={{ color: messageColor[item.type] }}
              >
                {item.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
