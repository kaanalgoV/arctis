import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, Activity, Zap, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRadar, type RadarMarket } from '@/hooks/useRadar'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigateToChart: () => void
  onOpenInWorkspace?: (root: string) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SESSION_DISPLAY: Record<string, string> = {
  pre_market: 'Pre-Market',
  premarket: 'Pre-Market',
  ny_open: 'NY Open',
  midday: 'Midday',
  power_hour: 'Power Hour',
  after_hours: 'After Hours',
  overnight: 'Overnight',
  globex: 'Globex',
  closed: 'Closed',
  unknown: 'Unknown',
}

function formatTimestamp(date: Date | null): string {
  if (!date) return '--:--:--'
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  })
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type BiasVariant = 'long' | 'range_long' | 'range' | 'range_short' | 'short' | 'neutral'

function parseBiasVariant(state: string): BiasVariant {
  const s = state.toLowerCase()
  if (s === 'long') return 'long'
  if (s === 'range_long') return 'range_long'
  if (s === 'range_short') return 'range_short'
  if (s === 'short') return 'short'
  if (s === 'neutral') return 'neutral'
  return 'range'
}

const BIAS_CONFIG: Record<BiasVariant, { label: string; color: string; bg: string; border: string }> = {
  long: { label: 'LONG', color: 'var(--color-profit)', bg: 'rgba(0, 135, 87, 0.15)', border: 'rgba(0, 135, 87, 0.35)' },
  range_long: { label: 'RANGE-L', color: 'var(--color-profit)', bg: 'rgba(0, 135, 87, 0.08)', border: 'rgba(0, 135, 87, 0.2)' },
  range: { label: 'RANGE', color: 'var(--color-text-muted)', bg: 'var(--color-surface-raised)', border: 'var(--color-border)' },
  neutral: { label: 'NEUTRAL', color: 'var(--color-text-muted)', bg: 'var(--color-surface-raised)', border: 'var(--color-border)' },
  range_short: { label: 'RANGE-S', color: 'var(--color-loss)', bg: 'rgba(239, 65, 54, 0.08)', border: 'rgba(239, 65, 54, 0.2)' },
  short: { label: 'SHORT', color: 'var(--color-loss)', bg: 'rgba(239, 65, 54, 0.15)', border: 'rgba(239, 65, 54, 0.35)' },
}

// Opportunity score → color
function scoreColor(score: number): string {
  if (score >= 60) return 'var(--color-profit)'
  if (score >= 30) return '#F5A623'
  return 'var(--color-loss)'
}

function scoreGlow(score: number): string {
  if (score >= 60) return 'rgba(0, 135, 87, 0.2)'
  if (score >= 30) return 'rgba(245, 166, 35, 0.15)'
  return 'rgba(239, 65, 54, 0.15)'
}

// ── Radar Card Skeleton ────────────────────────────────────────────────────────

function RadarCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden"
      style={{ background: 'var(--color-surface-secondary)', height: 260 }}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-12 w-14 rounded-lg bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-4 w-full rounded bg-white/[0.04] animate-pulse" />
        <div className="h-16 rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="h-8 rounded-lg bg-white/[0.06] animate-pulse" />
      </div>
    </motion.div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 animate-spin"
      style={{
        borderColor: 'var(--color-border)',
        borderTopColor: 'var(--color-accent)',
      }}
    />
  )
}

// ── Direction Icon ─────────────────────────────────────────────────────────────

function DirectionIcon({ direction }: { direction: string }) {
  const d = direction.toLowerCase()
  if (d === 'long' || d === 'bullish') return <TrendingUp size={12} color="var(--color-profit)" strokeWidth={2.5} />
  if (d === 'short' || d === 'bearish') return <TrendingDown size={12} color="var(--color-loss)" strokeWidth={2.5} />
  return <Minus size={12} color="var(--color-text-muted)" strokeWidth={2.5} />
}

// ── Radar Market Card ──────────────────────────────────────────────────────────

interface RadarCardProps {
  market: RadarMarket
  index: number
  onOpen: () => void
}

function RadarCard({ market, index, onOpen }: RadarCardProps) {
  const biasVariant = parseBiasVariant(market.bias_state)
  const biasCfg = BIAS_CONFIG[biasVariant]
  const scoreClr = scoreColor(market.opportunity_score)
  const scoreG = scoreGlow(market.opportunity_score)
  const sessionLabel = SESSION_DISPLAY[market.session] ?? market.session

  return (
    <motion.div
      key={market.root}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-0',
        'rounded-2xl border border-white/[0.07]',
        'bg-[var(--color-surface-secondary)]',
        'overflow-hidden',
        'shadow-[0_4px_24px_rgba(0,0,0,0.45)]',
      )}
    >
      {/* Top accent bar — color-coded by score */}
      <div
        className="h-0.5 w-full"
        style={{ background: scoreClr, opacity: 0.7 }}
      />

      <div className="flex flex-col gap-4 p-5">
        {/* Header row: market info + opportunity score */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: symbol + name + session */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-mono font-bold tracking-wide"
                style={{ fontSize: 18, color: 'var(--color-text-primary)' }}
              >
                {market.root}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
              >
                {market.symbol}
              </span>
            </div>
            <span
              className="font-mono truncate"
              style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
            >
              {market.name}
            </span>
          </div>

          {/* Right: opportunity score ring */}
          <div
            className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl px-3 py-2"
            style={{
              background: scoreG,
              border: `1px solid ${scoreClr}`,
              minWidth: 64,
            }}
          >
            <span
              className="font-mono font-bold tabular-nums leading-none"
              style={{ fontSize: 24, color: scoreClr }}
            >
              {market.opportunity_score}
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 8, color: scoreClr, letterSpacing: '0.08em', opacity: 0.8 }}
            >
              Score
            </span>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono font-bold tabular-nums"
            style={{ fontSize: 22, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
          >
            {formatPrice(market.price)}
          </span>
          <div className="flex items-center gap-1.5">
            <DirectionIcon direction={market.direction} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
            >
              {sessionLabel}
            </span>
          </div>
        </div>

        {/* Bias + signals row */}
        <div className="flex items-center gap-2">
          {/* Bias badge */}
          <div
            className="flex items-center px-2 py-0.5 rounded"
            style={{
              background: biasCfg.bg,
              border: `1px solid ${biasCfg.border}`,
            }}
          >
            <span
              className="font-mono font-bold uppercase"
              style={{ fontSize: 9, color: biasCfg.color, letterSpacing: '0.08em' }}
            >
              {biasCfg.label}
            </span>
          </div>

          {/* Active signals pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Zap size={9} color="var(--color-text-muted)" strokeWidth={2} />
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}
            >
              {market.active_signals} signal{market.active_signals !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Session pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Activity size={9} color="var(--color-text-muted)" strokeWidth={2} />
            <span
              className="font-mono"
              style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
            >
              {sessionLabel}
            </span>
          </div>
        </div>

        {/* Confluence bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className="font-mono uppercase"
              style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
            >
              Confluence
            </span>
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600 }}
            >
              {market.confluence_score}
            </span>
          </div>
          <div
            className="relative overflow-hidden rounded-full"
            style={{
              height: 4,
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (market.confluence_score / 14) * 100)}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: scoreClr, opacity: 0.7 }}
            />
          </div>
        </div>

        {/* Top signal (if available) */}
        {market.top_signal && (
          <div
            className="flex flex-col gap-1.5 p-3 rounded-[var(--radius-md)]"
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono uppercase"
                style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
              >
                Top Signal
              </span>
              <div className="flex items-center gap-1">
                <DirectionIcon direction={market.top_signal.direction} />
                <span
                  className="font-mono uppercase font-semibold"
                  style={{
                    fontSize: 9,
                    color: market.top_signal.direction.toLowerCase() === 'long' ? 'var(--color-profit)' : 'var(--color-loss)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {market.top_signal.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
                >
                  Entry
                </span>
                <span
                  className="font-mono tabular-nums font-semibold"
                  style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
                >
                  {formatPrice(market.top_signal.entry)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
                >
                  R:R
                </span>
                <span
                  className="font-mono tabular-nums font-bold"
                  style={{ fontSize: 10, color: 'var(--color-text-primary)' }}
                >
                  {market.top_signal.rr.toFixed(1)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
                >
                  Conf.
                </span>
                <span
                  className="font-mono uppercase font-semibold"
                  style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
                >
                  {market.top_signal.confidence}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Open in Workspace button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpen}
          className="flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-md)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-dark) 0%, var(--color-accent) 100%)',
            boxShadow: '0 2px 8px rgba(92, 184, 240, 0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 12,
              color: 'white',
              letterSpacing: '0.03em',
            }}
          >
            Open in Workspace
          </span>
          <ArrowRight size={13} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── "What's important now?" Card ─────────────────────────────────────────────

interface WhatsMattersBullet {
  text: string
  type: 'signal' | 'warning' | 'info'
}

function deriveWhatsImportant(markets: RadarMarket[]): WhatsMattersBullet[] {
  const bullets: WhatsMattersBullet[] = []

  if (markets.length === 0) return bullets

  // Best opportunity
  const top = markets.reduce((best, m) => m.opportunity_score > best.opportunity_score ? m : best, markets[0])
  if (top.opportunity_score >= 60) {
    bullets.push({
      text: `${top.root} is the highest-opportunity market right now (score ${top.opportunity_score})`,
      type: 'signal',
    })
  }

  // Active signals summary
  const totalSignals = markets.reduce((sum, m) => sum + m.active_signals, 0)
  const longCount = markets.filter(m => m.bias_state.toLowerCase().includes('long')).length
  const shortCount = markets.filter(m => m.bias_state.toLowerCase().includes('short')).length
  if (totalSignals > 0) {
    const dir = longCount > shortCount ? 'long-biased' : shortCount > longCount ? 'short-biased' : 'mixed'
    bullets.push({
      text: `${totalSignals} active signal${totalSignals !== 1 ? 's' : ''} across ${markets.length} markets — ${dir}`,
      type: totalSignals > 3 ? 'signal' : 'info',
    })
  }

  // Warning: high-score market with short bias
  const shortBiasHigh = markets.find(
    m => m.opportunity_score >= 50 && (m.bias_state === 'short' || m.bias_state === 'range_short'),
  )
  if (shortBiasHigh) {
    bullets.push({
      text: `${shortBiasHigh.root} has a short bias with elevated opportunity — watch for downside setups`,
      type: 'warning',
    })
  }

  // Session context
  const activeSessions = [...new Set(markets.map(m => m.session))].filter(s => s !== 'closed' && s !== 'unknown')
  if (activeSessions.length > 0) {
    const sessionMap: Record<string, string> = {
      ny_open: 'NY Open (high volatility)',
      midday: 'Midday (reduced volatility)',
      power_hour: 'Power Hour (closing momentum)',
      premarket: 'Pre-Market (limited liquidity)',
      after_hours: 'After Hours (thin market)',
    }
    const desc = sessionMap[activeSessions[0]] ?? activeSessions[0]
    bullets.push({ text: `Current session: ${desc}`, type: 'info' })
  }

  // Low opportunity: nothing actionable
  if (top.opportunity_score < 30 && totalSignals === 0) {
    bullets.push({ text: 'No high-probability setups detected — stand aside', type: 'info' })
  }

  return bullets.slice(0, 4)
}

const BULLET_ICON_COLOR: Record<WhatsMattersBullet['type'], string> = {
  signal: 'var(--color-profit)',
  warning: '#F5A623',
  info: 'var(--color-accent)',
}

function WhatsImportantCard({ markets }: { markets: RadarMarket[] }) {
  const bullets = deriveWhatsImportant(markets)
  if (bullets.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 p-4 rounded-2xl"
      style={{
        background: 'var(--color-surface-secondary)',
        border: '1px solid rgba(92,184,240,0.15)',
        boxShadow: '0 2px 16px rgba(92,184,240,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 24,
            height: 24,
            background: 'rgba(92,184,240,0.12)',
            border: '1px solid rgba(92,184,240,0.25)',
          }}
        >
          <Lightbulb size={12} color="var(--color-accent)" strokeWidth={2} />
        </div>
        <span
          className="font-sans font-semibold uppercase tracking-[0.08em]"
          style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}
        >
          What's important now
        </span>
      </div>

      {/* Bullet list */}
      <div className="flex flex-col gap-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="rounded-full flex-shrink-0 mt-[5px]"
              style={{ width: 5, height: 5, background: BULLET_ICON_COLOR[b.type] }}
            />
            <span
              className="font-mono leading-snug"
              style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
            >
              {b.text}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ isLoading, error }: { isLoading: boolean; error: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      {isLoading ? (
        <>
          <Spinner />
          <span
            className="font-mono"
            style={{ fontSize: 12, color: 'var(--color-text-muted)' }}
          >
            Scanning markets...
          </span>
        </>
      ) : error ? (
        <>
          <span
            className="font-mono text-center"
            style={{ fontSize: 12, color: 'var(--color-loss)' }}
          >
            Scan failed: {error}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
          >
            Backend may be offline
          </span>
        </>
      ) : (
        <span
          className="font-mono"
          style={{ fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          No market data available
        </span>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DashboardPage({ onNavigateToChart, onOpenInWorkspace }: DashboardPageProps) {
  const { markets, isLoading, error, lastScan, refresh } = useRadar(10000)
  const isStale = lastScan ? (Date.now() - lastScan.getTime()) > 30000 : true

  function handleOpenInWorkspace(root: string) {
    if (onOpenInWorkspace) {
      onOpenInWorkspace(root)
    } else {
      // Fallback: just navigate to chart
      onNavigateToChart()
    }
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: 'var(--color-surface-base)' }}
    >
      <div className="flex flex-col px-6 py-6 max-w-2xl mx-auto gap-5">

        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '4px',
                background: 'linear-gradient(135deg, #A8DAFF 0%, #5CB8F0 50%, #3A8CC4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.1,
              }}
            >
              ALGOVIEW RADAR
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}
            >
              Market Opportunity Scanner
            </span>
          </div>

          {/* Scan status + refresh */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-0.5">
              <span
                className="font-mono"
                style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
              >
                Last scan
              </span>
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
              >
                {formatTimestamp(lastScan)} ET
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92, rotate: 180 }}
              onClick={() => void refresh()}
              disabled={isLoading}
              className="flex items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-40"
              style={{
                width: 30,
                height: 30,
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
              title="Refresh scan"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <RefreshCw size={13} color="var(--color-text-muted)" strokeWidth={2} />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Auto-refresh indicator */}
        <motion.div
          className="flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: isStale ? 'var(--color-text-muted)' : 'var(--color-profit)',
              boxShadow: isStale ? 'none' : '0 0 6px var(--color-profit)',
            }}
          />
          <span
            className="font-mono"
            style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
          >
            Auto-refresh every 10s — 15min bars
          </span>
        </motion.div>

        {/* What's important now */}
        {!isLoading && markets.length > 0 && (
          <WhatsImportantCard markets={markets} />
        )}

        {/* Market cards or empty state */}
        <AnimatePresence mode="wait">
          {!isLoading && markets.length === 0 ? (
            <EmptyState isLoading={isLoading} error={error} />
          ) : isLoading && markets.length === 0 ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map(i => <RadarCardSkeleton key={i} index={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {markets.map((market, i) => (
                <RadarCard
                  key={market.root}
                  market={market}
                  index={i}
                  onOpen={() => handleOpenInWorkspace(market.root)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Score legend */}
        <motion.div
          className="flex items-center gap-4 pt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Score Legend:
          </span>
          {[
            { label: '60-100 High', color: 'var(--color-profit)' },
            { label: '30-59 Medium', color: '#F5A623' },
            { label: '0-29 Low', color: 'var(--color-loss)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="rounded-full"
                style={{ width: 6, height: 6, background: color }}
              />
              <span
                className="font-mono"
                style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}
              >
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
