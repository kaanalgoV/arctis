import { useState } from 'react'
import { TrendingUp, Layers, BarChart3, AlertTriangle, Compass, Info, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSettingsStore } from '@/store/settings'

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
          style={{ color: isShort ? 'var(--color-loss, #FF3B3B)' : 'var(--color-profit, #00B775)' }}
        />
      )
    case 'warning':
      return <AlertTriangle {...iconProps} style={{ color: 'var(--color-warning, #F7941D)' }} />
    case 'structure':
      return <Layers {...iconProps} style={{ color: 'var(--color-accent, #5CB8F0)' }} />
    case 'volume':
      return <BarChart3 {...iconProps} style={{ color: 'var(--color-warning, #F7941D)' }} />
    case 'risk':
      return <AlertTriangle {...iconProps} style={{ color: 'var(--color-loss, #FF3B3B)' }} />
    case 'bias':
      return (
        <Compass
          {...iconProps}
          style={{ color: isShort ? 'var(--color-loss, #FF3B3B)' : 'var(--color-profit, #00B775)' }}
        />
      )
    case 'info':
    default:
      return <Info {...iconProps} style={{ color: 'var(--color-text-inactive)' }} />
  }
}

// ---------------------------------------------------------------------------
// Message color per type
// ---------------------------------------------------------------------------

const messageColor: Record<FeedItem['type'], string> = {
  signal:    'var(--color-text-primary, #E6EDF3)',
  info:      'var(--color-text-secondary, #8B949E)',
  warning:   'var(--color-warning, #F7941D)',
  structure: 'var(--color-accent, #5CB8F0)',
  volume:    'var(--color-text-secondary, #8B949E)',
  risk:      'var(--color-loss, #FF3B3B)',
  bias:      'var(--color-text-secondary, #A8B5C1)',
}

// ---------------------------------------------------------------------------
// Format timestamp as HH:MM:SS
// ---------------------------------------------------------------------------

function formatHHMMSS(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const ss = d.getSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// ---------------------------------------------------------------------------
// Relative timestamp ("2m ago", "15m ago", "1h ago")
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  const nowSec = Math.floor(Date.now() / 1000)
  const deltaSec = nowSec - timestamp
  if (deltaSec < 60) return `${deltaSec}s ago`
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`
  return formatHHMMSS(timestamp)
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-1 border-b border-[var(--color-border)]/60">
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
  /** Show relative timestamps ("2m ago") instead of absolute HH:MM:SS */
  relativeTimestamps?: boolean
}

export function FeedPanel({ items, loading, error, onItemClick, relativeTimestamps = true }: FeedPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [askingTravis, setAskingTravis] = useState<number | null>(null)
  const engineUrl = useSettingsStore((s) => s.engineUrl)

  async function handleAskTravis(item: FeedItem, itemIndex: number) {
    setAskingTravis(itemIndex)
    try {
      const context = `Feed event at ${item.time}: ${item.message}`
      await fetch(`${engineUrl}/api/travis/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: context, context: item }),
      })
    } catch {
      // silently ignore — Travis endpoint may be offline
    } finally {
      setAskingTravis(null)
    }
  }

  // Loading state (no items yet)
  if (loading && (items == null || items.length === 0)) {
    return (
      <div className="flex flex-col gap-2">
        {/* Skeleton tabs */}
        <div className="flex gap-0.5 border-b border-[var(--color-border)]">
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className="px-2 py-1 text-[10px] text-[var(--color-text-inactive)]"
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
        <span className="text-[10px] text-[var(--color-loss,#FF3B3B)]">{error}</span>
      </div>
    )
  }

  // No data state
  if (items == null || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: 'var(--color-text-inactive)', opacity: 0.35 }}
        >
          {/* Signal / wave icon suggesting waiting for events */}
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <path d="M4.5 8C4.5 5.51 6.27 3.5 8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11.5 8C11.5 5.51 9.73 3.5 8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2 8C2 4.13 4.69 1 8 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <path d="M14 8C14 4.13 11.31 1 8 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
        <span className="font-mono text-[10px] text-[var(--color-text-inactive)] tracking-[0.05em]">
          Feed is empty — waiting for market events
        </span>
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
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-1">
        {FILTERS.map((filter) => {
          const count = countByFilter(filter)
          const isActive = activeFilter === filter.key
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 relative',
                'text-[9px] font-medium transition-colors leading-none rounded-full',
                'focus:outline-none',
                isActive
                  ? 'text-[var(--color-accent,#5CB8F0)]'
                  : 'text-[var(--color-text-inactive)] hover:text-[var(--color-text-secondary)]',
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
              <span
                className={cn(
                  'px-1 py-px rounded-full font-mono tabular-nums text-[9px]',
                  isActive && count > 0
                    ? 'bg-[var(--color-accent,#5CB8F0)]/15 text-[var(--color-accent,#5CB8F0)]'
                    : isActive && count === 0
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-inactive)]'
                    : count > 0
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-inactive)]'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-inactive)] opacity-40',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Event list — scrollable, items separated by 1px dividers */}
      <div
        className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-surface-raised)] relative"
        style={{ maxHeight: 'clamp(160px, 30vh, 400px)' }}
      >
        {displayItems.length === 0 ? (
          <p className="py-3 text-[10px] font-mono text-[var(--color-text-inactive)] tracking-[0.04em]">
            No events for this filter
          </p>
        ) : (
          displayItems.map((item, i) => {
            const isClickable = item.timestamp != null && !!onItemClick
            // Relative or absolute timestamp
            const timeLabel = item.timestamp != null
              ? relativeTimestamps
                ? formatRelativeTime(item.timestamp)
                : formatHHMMSS(item.timestamp)
              : item.time

            const isAskingThis = askingTravis === i

            return (
              <div
                key={i}
                className={cn(
                  'feed-item group', // used by fade-in keyframe; group for hover children
                  'flex flex-col gap-0.5 py-1.5 px-1',
                  'rounded-[var(--radius-sm)]',
                  'transition-colors duration-75',
                  isClickable
                    ? 'cursor-pointer hover:bg-[var(--color-surface-raised)]'
                    : 'cursor-default hover:bg-[var(--color-surface-raised)]',
                )}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {/* Main row: timestamp + icon + message */}
                <div
                  className="flex items-start gap-2"
                  onClick={() => {
                    if (item.timestamp != null && onItemClick) {
                      onItemClick(item.timestamp)
                    }
                  }}
                >
                  {/* Timestamp — monospace, muted */}
                  <span
                    className="font-mono text-[9px] tabular-nums pt-[1px] shrink-0 min-w-[46px]"
                    style={{ color: 'var(--color-text-inactive)' }}
                    title={item.timestamp != null ? formatHHMMSS(item.timestamp) : item.time}
                  >
                    {timeLabel}
                  </span>

                  {/* Type icon */}
                  <span className="pt-[1px] flex-shrink-0">
                    <ItemIcon type={item.type} message={item.message} />
                  </span>

                  {/* Message */}
                  <span
                    className="text-[10px] leading-snug flex-1 min-w-0"
                    style={{ color: messageColor[item.type] }}
                  >
                    {item.message}
                  </span>
                </div>

                {/* Ask Travis button — visible on hover */}
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                  <button
                    type="button"
                    disabled={isAskingThis}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleAskTravis(item, i)
                    }}
                    className={cn(
                      'flex items-center gap-1 px-1.5 py-0.5 rounded',
                      'font-mono text-[8px] leading-none tracking-wide',
                      'transition-colors duration-75 outline-none',
                      'focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
                      isAskingThis
                        ? 'opacity-50 cursor-wait'
                        : 'hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
                    )}
                    style={{
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-accent)',
                      opacity: isAskingThis ? 0.5 : undefined,
                    }}
                    title="Ask Travis about this event"
                  >
                    <MessageCircle size={8} strokeWidth={2} />
                    {isAskingThis ? 'Asking...' : 'Ask Travis'}
                  </button>
                </div>
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
