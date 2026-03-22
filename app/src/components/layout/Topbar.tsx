import { useState } from 'react'
import { ChevronRight, Settings, Wifi, WifiOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type Timeframe = '1m' | '5m' | '15m' | '1h'

const FALLBACK_MARKETS = ['ES', 'NQ', 'CL', 'GC', '6E']
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h']

// ── Sub-components ────────────────────────────────────────────────────────────

interface PillProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function Pill({ label, isActive, onClick }: PillProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'relative px-2 py-0.5 rounded-[var(--radius-sm)]',
        'font-mono text-[11px] leading-none',
        'transition-colors duration-120',
        'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
        isActive
          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
      )}
    >
      {label}
    </motion.button>
  )
}

interface BreadcrumbProps {
  segments: string[]
}

function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1">
      {segments.map((segment, index) => (
        <span key={segment} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              className="text-[var(--color-text-muted)] shrink-0"
            />
          )}
          <span
            className={cn(
              'font-mono text-[11px] leading-none',
              index === segments.length - 1
                ? 'text-[var(--color-text-secondary)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {segment}
          </span>
        </span>
      ))}
    </div>
  )
}

// ── Connection Badge ──────────────────────────────────────────────────────────

interface ConnectionBadgeProps {
  isConnected: boolean
}

function ConnectionBadge({ isConnected }: ConnectionBadgeProps) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-3 h-3">
          <motion.span
            className="absolute inset-0 rounded-full bg-[var(--color-profit)]"
            animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--color-profit)]" />
        </div>
        <span className="font-mono text-[11px] font-medium text-[var(--color-profit)] leading-none">
          LIVE
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <WifiOff
        size={11}
        strokeWidth={1.75}
        className="text-[var(--color-text-muted)]"
      />
      <span className="font-mono text-[11px] font-medium text-[var(--color-text-muted)] leading-none">
        OFFLINE
      </span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface TopbarProps {
  onSettingsClick?: () => void
  markets?: string[]
  activeMarket?: string
  onMarketChange?: (market: string) => void
  activeTimeframe?: string
  onTimeframeChange?: (tf: string) => void
  currentPrice?: number | null
  priceChange?: number | null
  isConnected?: boolean
}

export function Topbar({
  onSettingsClick,
  markets,
  activeMarket: activeMarketProp,
  onMarketChange,
  activeTimeframe: activeTimeframeProp,
  onTimeframeChange,
  currentPrice,
  priceChange,
  isConnected = false,
}: TopbarProps) {
  // Internal state used only when props are not controlled from outside
  const [internalMarket, setInternalMarket] = useState<string>('ES')
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>('1m')

  const marketList = markets && markets.length > 0 ? markets : FALLBACK_MARKETS
  const activeMarket = activeMarketProp ?? internalMarket
  const activeTimeframe = activeTimeframeProp ?? internalTimeframe

  function handleMarketClick(market: string) {
    if (onMarketChange) {
      onMarketChange(market)
    } else {
      setInternalMarket(market)
    }
  }

  function handleTimeframeClick(tf: string) {
    if (onTimeframeChange) {
      onTimeframeChange(tf)
    } else {
      setInternalTimeframe(tf as Timeframe)
    }
  }

  // Format price with locale separators (e.g. 5142.75 -> "5,142.75")
  const formattedPrice =
    currentPrice != null
      ? currentPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—'

  const formattedChange =
    priceChange != null
      ? (priceChange >= 0 ? '+' : '') +
        priceChange.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null

  const changeIsPositive = priceChange != null && priceChange >= 0

  return (
    <header
      className={cn(
        'flex items-center h-full w-full px-3 gap-4',
        'bg-[var(--color-surface-primary)]',
        'border-b border-[var(--color-border-subtle)]',
      )}
    >
      {/* Left: Breadcrumb */}
      <div className="shrink-0">
        <Breadcrumb segments={['AlgoView', 'Arctis', activeMarket]} />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[var(--color-border-subtle)] shrink-0" />

      {/* Center: Market + Timeframe pills */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Market selector */}
        <div className="flex items-center gap-0.5">
          {marketList.map((market) => (
            <Pill
              key={market}
              label={market}
              isActive={activeMarket === market}
              onClick={() => handleMarketClick(market)}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[var(--color-border-subtle)] shrink-0" />

        {/* Timeframe selector */}
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <Pill
              key={tf}
              label={tf}
              isActive={activeTimeframe === tf}
              onClick={() => handleTimeframeClick(tf)}
            />
          ))}
        </div>
      </div>

      {/* Right: Price, Connection badge, Settings */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Price display */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[13px] font-bold text-[var(--color-text-primary)] leading-none tabular-nums">
            {formattedPrice}
          </span>
          {formattedChange != null ? (
            <span
              className={cn(
                'font-mono text-[11px] font-medium leading-none',
                changeIsPositive
                  ? 'text-[var(--color-profit)]'
                  : 'text-[var(--color-loss)]',
              )}
            >
              {formattedChange}
            </span>
          ) : (
            <span className="font-mono text-[11px] font-medium text-[var(--color-text-muted)] leading-none">
              —
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[var(--color-border-subtle)]" />

        {/* Connection badge */}
        <ConnectionBadge isConnected={isConnected} />

        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)]',
            'text-[var(--color-text-muted)]',
            'hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
            'transition-colors duration-120',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          )}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
