import { Settings, WifiOff, PanelRightOpen, PanelRightClose, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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
        'relative px-2 py-1 min-h-[28px] rounded-[var(--radius-sm)] cursor-pointer',
        'font-mono text-[11px] leading-none',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
        isActive
          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/25'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)]',
      )}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="tf-indicator"
          className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-[var(--color-accent)]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </motion.button>
  )
}


// ── Connection Badge ──────────────────────────────────────────────────────────

type ConnectionStatus = 'connected' | 'reconnecting' | 'offline'

interface ConnectionBadgeProps {
  /** Accepts boolean (legacy) or a three-state string. Live = actual live feed active. */
  liveFeed?: boolean
  isConnected: boolean | ConnectionStatus
}

function ConnectionBadge({ isConnected, liveFeed }: ConnectionBadgeProps) {
  // Normalise to three-state
  const status: ConnectionStatus =
    isConnected === true || isConnected === 'connected'
      ? 'connected'
      : isConnected === 'reconnecting'
      ? 'reconnecting'
      : 'offline'

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-3 h-3">
          <motion.span
            className={`absolute inset-0 rounded-full ${liveFeed ? 'bg-[var(--color-profit)]' : 'bg-[var(--color-accent)]'}`}
            animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <span
            className={`relative w-1.5 h-1.5 rounded-full ${liveFeed ? 'bg-[var(--color-profit)]' : 'bg-[var(--color-accent)]'}`}
            style={{ boxShadow: liveFeed ? '0 0 8px var(--color-profit)' : '0 0 8px var(--color-accent)' }}
          />
        </div>
        <span className={`font-mono text-[11px] font-medium leading-none ${liveFeed ? 'text-[var(--color-profit)]' : 'text-[var(--color-accent)]'}`}>
          {liveFeed ? 'LIVE' : 'ONLINE'}
        </span>
      </div>
    )
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-3 h-3">
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: 'var(--color-warning, #F7941D)' }}
            animate={{ scale: [1, 1.6], opacity: [0.45, 0] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: 'easeOut' }}
          />
          <span
            className="relative w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--color-warning, #F7941D)',
              boxShadow: '0 0 6px var(--color-warning, #F7941D)',
            }}
          />
        </div>
        <span
          className="font-mono text-[11px] font-medium leading-none"
          style={{ color: 'var(--color-warning, #F7941D)' }}
        >
          RECONNECTING
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
  /** Previous session close price to determine up/down color */
  prevSessionClose?: number | null
  isConnected?: boolean | ConnectionStatus
  liveFeed?: boolean
  rightPanelOpen?: boolean
  onToggleRightPanel?: () => void
  hudVisible?: boolean
  onToggleHud?: () => void
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
  prevSessionClose,
  isConnected = 'offline',
  liveFeed = false,
  rightPanelOpen,
  onToggleRightPanel,
  hudVisible,
  onToggleHud,
}: TopbarProps) {
  const { market: storeMarket, symbol: storeSymbol, timeframe: storeTf, setMarket, setTimeframe } = useMarketStore()

  // Track tick direction for arrow animation
  const prevPriceRef = useRef<number | null>(null)
  const [tickDir, setTickDir] = useState<'up' | 'down' | null>(null)
  const [tickFlash, setTickFlash] = useState(false)

  useEffect(() => {
    if (currentPrice != null && prevPriceRef.current != null && currentPrice !== prevPriceRef.current) {
      setTickDir(currentPrice > prevPriceRef.current ? 'up' : 'down')
      setTickFlash(true)
      const t = setTimeout(() => setTickFlash(false), 600)
      prevPriceRef.current = currentPrice
      return () => clearTimeout(t)
    }
    if (currentPrice != null) prevPriceRef.current = currentPrice
  }, [currentPrice])

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

  // Color price vs. previous close: ice-blue/green = above, red = below, default if no prev
  const priceVsClose =
    currentPrice != null && prevSessionClose != null
      ? currentPrice >= prevSessionClose
        ? 'above'
        : 'below'
      : null

  const priceDisplayColor =
    tickFlash
      ? tickDir === 'up' ? 'var(--color-profit)' : 'var(--color-loss)'
      : priceVsClose === 'above'
        ? 'var(--color-accent)'
        : priceVsClose === 'below'
          ? 'var(--color-loss)'
          : 'var(--color-text-primary)'

  return (
    <header
      className={cn(
        'flex items-center h-full w-full px-3 gap-4',
        'bg-[var(--color-surface-primary)]/80 backdrop-blur-md',
        'border-b border-[var(--color-border-subtle)]',
      )}
    >
      {/* Left: Symbol + Price as unified group */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[13px] font-semibold text-[var(--color-text-primary)] tracking-wide">
          {storeSymbol || activeMarket}
        </span>

        {/* Price with tick-animation arrow */}
        <div className="flex items-center gap-1">
          <span
            className="font-mono text-[18px] font-bold leading-none tabular-nums transition-colors duration-150"
            style={{ color: priceDisplayColor, letterSpacing: '-0.02em' }}
          >
            {formattedPrice}
          </span>

          {/* Animated tick direction indicator */}
          <AnimatePresence mode="wait">
            {tickDir && (
              <motion.span
                key={tickDir + String(tickFlash)}
                initial={{ opacity: 0, y: tickDir === 'up' ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[11px] leading-none"
                style={{ color: tickDir === 'up' ? 'var(--color-profit)' : 'var(--color-loss)' }}
              >
                {tickDir === 'up' ? '▲' : '▼'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

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
        ) : null}
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

      {/* Right: Connection badge, Settings */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Connection badge */}
        <ConnectionBadge isConnected={isConnected} liveFeed={liveFeed} />

        {/* Divider */}
        <div className="w-px h-4 bg-[var(--color-border-subtle)]" />

        {/* HUD toggle */}
        {onToggleHud && (
          <button
            onClick={onToggleHud}
            title={hudVisible ? 'HUD ausblenden' : 'HUD einblenden'}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] cursor-pointer',
              'transition-colors duration-150',
              'outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
              hudVisible
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)]',
            )}
            aria-label={hudVisible ? 'Hide HUD' : 'Show HUD'}
          >
            <BarChart3 size={14} strokeWidth={1.75} />
          </button>
        )}

        {/* Right panel toggle */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            title={rightPanelOpen ? 'Panel schliessen' : 'Panel oeffnen'}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] cursor-pointer',
              'transition-colors duration-150',
              'outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
              rightPanelOpen
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)]',
            )}
            aria-label={rightPanelOpen ? 'Close panel' : 'Open panel'}
          >
            {rightPanelOpen ? (
              <PanelRightClose size={14} strokeWidth={1.75} />
            ) : (
              <PanelRightOpen size={14} strokeWidth={1.75} />
            )}
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          title="Settings"
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] cursor-pointer',
            'text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)]',
            'transition-colors duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
          )}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
