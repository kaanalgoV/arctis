import { useState } from 'react'
import { TrendingUp, Layers, BarChart3, AlertTriangle, Compass, Info } from 'lucide-react'
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
  /** Optional signal direction — used to colorize signal/bias icons. */
  direction?: 'long' | 'short' | 'bullish' | 'bearish'
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
  { key: 'all',       label: 'All',       matches: ['signal', 'info', 'warning', 'structure', 'volume', 'risk', 'bias'] },
  { key: 'signal',    label: 'Signals',   matches: ['signal', 'info', 'bias'] },
  { key: 'structure', label: 'Structure', matches: ['structure'] },
  { key: 'volume',    label: 'Volume',    matches: ['volume'] },
  { key: 'risk',      label: 'Risk',      matches: ['risk', 'warning'] },
]

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

/** Returns a Lucide icon element sized 10px, colored for the given type. */
function ItemIcon({ type, message }: { type: FeedItem['type']; message: string }) {
  // Derive direction from message — short/bearish signals use red, everything else green
  const isShort = /\bshort\b|bearish|-[1-9]/i.test(message)

  const iconProps = { size: 10, strokeWidth: 2, className: 'flex-shrink-0' }

  switch (type) {
    case 'signal':
      return (
        <TrendingUp
          {...iconProps}
          style={{ color: isShort ? '#EF4444' : '#22C55E' }}
        />
      )
    case 'warning':
      return <AlertTriangle {...iconProps} style={{ color: '#F59E0B' }} />
    case 'structure':
      return <Layers {...iconProps} style={{ color: 'var(--color-accent, #5CB8F0)' }} />
    case 'volume':
      return <BarChart3 {...iconProps} style={{ color: '#EAB308' }} />
    case 'risk':
      return <AlertTriangle {...iconProps} style={{ color: '#EF4444' }} />
    case 'bias':
      return (
        <Compass
          {...iconProps}
          style={{ color: isShort ? '#EF4444' : '#22C55E' }}
        />
      )
    case 'info':
    default:
      return <Info {...iconProps} style={{ color: '#484F58' }} />
  }
}

// ---------------------------------------------------------------------------
// Message color per type
// ---------------------------------------------------------------------------

const messageColor: Record<FeedItem['type'], string> = {
  signal:    '#C9D1D9',
  info:      '#8B949E',
  warning:   '#D97706',
  structure: 'var(--color-accent, #5CB8F0)',
  volume:    '#CA8A04',
  risk:      '#EF4444',
  bias:      '#A8B5C1',
}

// ---------------------------------------------------------------------------
// Format timestamp as HH:MM:SS
// ---------------------------------------------------------------------------

function formatHHMMSS(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  const hh = d.getUTCHours().toString().padStart(2, '0')
  const mm = d.getUTCMinutes().toString().padStart(2, '0')
  const ss = d.getUTCSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-1 border-b border-[#21262D]/60">
          <Skeleton className="h-2 w-14 flex-shrink-0" />
          <Skeleton className="w-2.5 h-2.5 rounded-sm flex-shrink-0" />
          <Skeleton className="flex-1 h-2" />
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
      <div className="flex flex-col gap-2">
        {/* Skeleton tabs */}
        <div className="flex gap-0.5 border-b border-[#21262D]">
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className="px-2 py-1 text-[10px] text-[#484F58]"
            >
              {f.label}
            </span>
          ))}
        </div>
        <FeedSkeleton />
      </div>
    )
  }

  // Error state
  if (error && (items == null || items.length === 0)) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[#EF4444]">{error}</span>
      </div>
    )
  }

  // No data state
  if (items == null || items.length === 0) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[11px] text-[#8B949E]">No events yet</span>
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
    <div className="flex flex-col gap-0">
      {/* Filter tabs — underline style */}
      <div className="flex gap-0.5 border-b border-[#21262D] mb-1">
        {FILTERS.map((filter) => {
          const count = countByFilter(filter)
          const isActive = activeFilter === filter.key
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 relative',
                'text-[10px] font-medium transition-colors leading-none',
                'focus:outline-none',
                isActive
                  ? 'text-[var(--color-accent,#5CB8F0)]'
                  : 'text-[#484F58] hover:text-[#8B949E]',
              )}
            >
              {/* Active underline */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--color-accent,#5CB8F0)]"
                  aria-hidden
                />
              )}
              {filter.label}
              {count > 0 && (
                <span
                  className={cn(
                    'px-1 py-px rounded font-mono tabular-nums text-[9px]',
                    isActive
                      ? 'bg-[var(--color-accent,#5CB8F0)]/15 text-[var(--color-accent,#5CB8F0)]'
                      : 'bg-[#21262D] text-[#484F58]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Event list — scrollable, items separated by 1px dividers */}
      <div
        className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-[#21262D] relative"
        style={{ maxHeight: 200 }}
      >
        {displayItems.length === 0 ? (
          <p className="py-2 text-[11px] text-[#8B949E]">No events</p>
        ) : (
          displayItems.map((item, i) => {
            const isClickable = item.timestamp != null && !!onItemClick
            // Use unix timestamp for HH:MM:SS; fall back to the string time field
            const timeLabel =
              item.timestamp != null ? formatHHMMSS(item.timestamp) : item.time

            return (
              <div
                key={i}
                onClick={() => {
                  if (item.timestamp != null && onItemClick) {
                    onItemClick(item.timestamp)
                  }
                }}
                className={cn(
                  'feed-item', // used by fade-in keyframe
                  'flex items-start gap-2 py-1.5 px-1',
                  'border-b border-[#21262D]/50 last:border-b-0',
                  'transition-colors duration-100',
                  isClickable
                    ? 'cursor-pointer hover:bg-[#161B22]'
                    : 'cursor-default hover:bg-[#0D1117]/40',
                )}
                style={{
                  animationDelay: `${i * 20}ms`,
                }}
              >
                {/* Timestamp — monospace, muted */}
                <span className="font-mono text-[9px] text-[#484F58] pt-[1px] tabular-nums shrink-0 min-w-[46px]">
                  {timeLabel}
                </span>

                {/* Type icon */}
                <span className="pt-[1px] flex-shrink-0">
                  <ItemIcon type={item.type} message={item.message} />
                </span>

                {/* Message */}
                <span
                  className="text-[10px] leading-snug"
                  style={{ color: messageColor[item.type] }}
                >
                  {item.message}
                </span>
              </div>
            )
          })
        )}

        {/* Fade gradient at the bottom when scrollable */}
        {displayItems.length > 6 && (
          <div
            className="sticky bottom-0 left-0 right-0 h-5 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--color-surface-secondary, #161B22))',
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  )
}
