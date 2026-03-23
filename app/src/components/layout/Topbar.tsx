import { ChevronRight, Settings, WifiOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketStore } from '@/store/market'
import { TF_DISPLAY, TIMEFRAMES } from '@/types/contracts'
import type { Timeframe } from '@/types/contracts'

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
  /** Market root list (e.g. ['NQ','ES','CL']). Falls back to store market if empty. */
  markets?: string[]
  /** Controlled active market. If omitted reads from store. */
  activeMarket?: string
  onMarketChange?: (market: string) => void
  /** Controlled active timeframe — display label (e.g. "1m"). If omitted reads from store. */
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
  const { market: storeMarket, symbol: storeSymbol, timeframe: storeTf, setMarket, setTimeframe } = useMarketStore()

  // Derive resolved values: prefer controlled props, fall back to store
  const activeMarket = activeMarketProp ?? storeMarket

  // storeTf is an internal Timeframe ('1min', etc.) — convert to display label
  const storeTfDisplay = TF_DISPLAY[storeTf as Timeframe] ?? storeTf
  const activeTimeframe = activeTimeframeProp ?? storeTfDisplay

  // Market list: use prop if provided, else show only the currently active market
  const marketList = markets && markets.length > 0 ? markets : [storeMarket]

  function handleMarketClick(market: string) {
    if (onMarketChange) {
      onMarketChange(market)
    } else {
      setMarket(market)
    }
  }

  function handleTimeframeClick(displayTf: string) {
    if (onTimeframeChange) {
      onTimeframeChange(displayTf)
    } else {
      // Find the internal timeframe key matching the display label
      const entry = (Object.entries(TF_DISPLAY) as [Timeframe, string][]).find(
        ([, label]) => label === displayTf,
      )
      if (entry) {
        setTimeframe(entry[0])
      }
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
      {/* Left: Symbol display */}
      <span className="font-mono text-[13px] font-semibold text-[#E6EDF3] shrink-0 tracking-wide">
        {storeSymbol || activeMarket}
      </span>

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

        {/* Timeframe selector — display labels from TF_DISPLAY */}
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => {
            const label = TF_DISPLAY[tf]
            return (
              <Pill
                key={tf}
                label={label}
                isActive={activeTimeframe === label}
                onClick={() => handleTimeframeClick(label)}
              />
            )
          })}
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
