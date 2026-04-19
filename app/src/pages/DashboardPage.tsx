import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, Activity, Zap, Lightbulb, Radio, Clock, BarChart3, Gauge } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

// ── Left Sidebar: Session & Watchlist ─────────────────────────────────────────

const SESSIONS = [
  { key: 'premarket', label: 'Pre-Market', startH: 4, endH: 9.5 },
  { key: 'ny_open', label: 'NY Open', startH: 9.5, endH: 10.5 },
  { key: 'midday', label: 'Midday', startH: 10.5, endH: 14 },
  { key: 'afternoon', label: 'Afternoon', startH: 14, endH: 15 },
  { key: 'power_hour', label: 'Power Hour', startH: 15, endH: 16 },
  { key: 'after_hours', label: 'After Hours', startH: 16, endH: 18 },
] as const

function nyDecimalHour(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10)
  return h + m / 60
}

function formatCountdown(hours: number): string {
  if (hours <= 0) return 'now'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function MarketPulsePanel({ markets, isLoading }: { markets: RadarMarket[]; isLoading: boolean }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const nyHour = nyDecimalHour(now)
  const currentSessionIdx = SESSIONS.findIndex(s => nyHour >= s.startH && nyHour < s.endH)
  const nextIdx = currentSessionIdx === -1
    ? SESSIONS.findIndex(s => s.startH > nyHour)
    : currentSessionIdx
  const nextSession = nextIdx === -1 ? SESSIONS[0] : SESSIONS[nextIdx]
  const hoursUntilNext =
    currentSessionIdx >= 0
      ? SESSIONS[currentSessionIdx].endH - nyHour
      : nextIdx >= 0
        ? nextSession.startH - nyHour
        : 24 - nyHour + SESSIONS[0].startH

  const nyTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  })
  const nyDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    timeZone: 'America/New_York',
  })

  const ranked = useMemo(
    () => [...markets].sort((a, b) => b.opportunity_score - a.opportunity_score),
    [markets]
  )

  return (
    <div className="sticky top-8 flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2"
      >
        <Clock size={11} color="var(--color-accent)" strokeWidth={2} />
        <span
          className="font-sans font-semibold uppercase"
          style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.14em' }}
        >
          Session &amp; Watchlist
        </span>
      </motion.div>

      {/* NY Time + Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            NY Time
          </span>
          <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
            {nyDate}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono font-bold tabular-nums"
            style={{ fontSize: 28, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {nyTime}
          </span>
        </div>
        <div
          className="flex items-center justify-between pt-2 mt-1"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            {currentSessionIdx >= 0 ? `${SESSIONS[currentSessionIdx].label} ends in` : `${nextSession.label} in`}
          </span>
          <span
            className="font-mono font-semibold tabular-nums"
            style={{ fontSize: 11, color: 'var(--color-accent)' }}
          >
            {formatCountdown(hoursUntilNext)}
          </span>
        </div>
      </motion.div>

      {/* Session Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2.5 p-4 rounded-2xl"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <span
          className="font-mono uppercase"
          style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
        >
          Session Timeline
        </span>
        <div className="flex flex-col gap-1.5">
          {SESSIONS.map((s, i) => {
            const active = i === currentSessionIdx
            const past = i < currentSessionIdx
            const progress = active
              ? Math.max(0, Math.min(1, (nyHour - s.startH) / (s.endH - s.startH)))
              : past
                ? 1
                : 0
            const color = active ? 'var(--color-accent)' : past ? 'var(--color-text-muted)' : 'var(--color-border)'
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className="font-mono uppercase flex-shrink-0"
                  style={{
                    fontSize: 9,
                    width: 68,
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    letterSpacing: '0.04em',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
                <div
                  className="relative flex-1 overflow-hidden rounded-full"
                  style={{ height: 4, background: 'var(--color-surface-elevated)' }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background: color,
                      opacity: past ? 0.25 : 0.85,
                      boxShadow: active ? `0 0 6px ${color}` : 'none',
                    }}
                  />
                  {active && (
                    <motion.div
                      className="absolute top-1/2 rounded-full -translate-y-1/2"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        left: `calc(${progress * 100}% - 3px)`,
                        width: 6,
                        height: 6,
                        background: color,
                      }}
                    />
                  )}
                </div>
                <span
                  className="font-mono tabular-nums flex-shrink-0"
                  style={{ fontSize: 8, width: 34, color: 'var(--color-text-muted)', textAlign: 'right' }}
                >
                  {s.startH.toString().padStart(2, '0').replace('.5', ':30').replace(/\.(\d)/, ':$1') + (Number.isInteger(s.startH) ? ':00' : '')}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Watchlist */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2.5 p-4 rounded-2xl"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={11} color="var(--color-accent)" strokeWidth={2} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.08em' }}
            >
              Watchlist
            </span>
          </div>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
          >
            {markets.length}
          </span>
        </div>

        {isLoading && ranked.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => <div key={i} className="h-9 rounded bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {ranked.map((m, i) => <WatchlistRow key={m.root} market={m} index={i} />)}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function WatchlistRow({ market, index }: { market: RadarMarket; index: number }) {
  const isLong = market.direction.toLowerCase() === 'long' || market.direction.toLowerCase() === 'bullish'
  const isShort = market.direction.toLowerCase() === 'short' || market.direction.toLowerCase() === 'bearish'
  const clr = isLong ? 'var(--color-profit)' : isShort ? 'var(--color-loss)' : 'var(--color-text-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md"
      style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <DirectionIcon direction={market.direction} />
        <span
          className="font-mono font-bold"
          style={{ fontSize: 11, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}
        >
          {market.root}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
        >
          {formatPrice(market.price)}
        </span>
        <span
          className="font-mono tabular-nums font-semibold px-1 py-[1px] rounded"
          style={{
            fontSize: 9,
            color: clr,
            background: `${clr}1a`,
            minWidth: 22,
            textAlign: 'center',
          }}
        >
          {market.opportunity_score}
        </span>
      </div>
    </motion.div>
  )
}

// ── Right Sidebar: Radar Intelligence ─────────────────────────────────────────

function LiveActivityPanel({
  markets,
  lastScan,
  isLoading,
}: {
  markets: RadarMarket[]
  lastScan: Date | null
  isLoading: boolean
}) {
  const longCount = markets.filter(m => m.bias_state.toLowerCase().includes('long')).length
  const shortCount = markets.filter(m => m.bias_state.toLowerCase().includes('short')).length
  const rangeCount = markets.length - longCount - shortCount
  const total = Math.max(1, markets.length)

  const topMarket = markets.length
    ? markets.reduce((best, m) => m.opportunity_score > best.opportunity_score ? m : best, markets[0])
    : null

  return (
    <div className="sticky top-8 flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2"
      >
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Radio size={11} color="var(--color-accent)" strokeWidth={2} />
        </motion.div>
        <span
          className="font-sans font-semibold uppercase"
          style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.14em' }}
        >
          Radar Intelligence
        </span>
      </motion.div>

      {/* Best Trade Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2.5 p-4 rounded-2xl relative overflow-hidden"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <BestTradeCard market={topMarket} isLoading={isLoading} />
      </motion.div>

      {/* Bias Consensus Donut */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.08em' }}
          >
            Bias Consensus
          </span>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
          >
            {markets.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <BiasDonut longCount={longCount} shortCount={shortCount} rangeCount={rangeCount} total={total} />
          <div className="flex flex-col gap-1.5 flex-1">
            <LegendRow label="LONG" value={longCount} color="var(--color-profit)" pct={(longCount / total) * 100} />
            <LegendRow label="RANGE" value={rangeCount} color="var(--color-text-muted)" pct={(rangeCount / total) * 100} />
            <LegendRow label="SHORT" value={shortCount} color="var(--color-loss)" pct={(shortCount / total) * 100} />
          </div>
        </div>
      </motion.div>

      {/* Confluence Heatmap — bias/momentum per market */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2.5 p-4 rounded-2xl"
        style={{
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.08em' }}
          >
            Signal Strength
          </span>
          <Gauge size={11} color="var(--color-text-muted)" strokeWidth={2} />
        </div>

        {isLoading && markets.length === 0 ? (
          <div className="h-14 rounded bg-white/[0.03] animate-pulse" />
        ) : (
          <div className="flex flex-col gap-2">
            {markets.map((m, i) => <ConfluenceHeatRow key={m.root} market={m} index={i} />)}
          </div>
        )}
      </motion.div>

      {/* Last scan footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between px-1"
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full"
            style={{ width: 5, height: 5, background: 'var(--color-profit)', boxShadow: '0 0 6px var(--color-profit)' }}
          />
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Last scan
          </span>
        </div>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}
        >
          {formatTimestamp(lastScan)} ET
        </span>
      </motion.div>
    </div>
  )
}

function BestTradeCard({ market, isLoading }: { market: RadarMarket | null; isLoading: boolean }) {
  if (isLoading && !market) {
    return <div className="h-28 rounded bg-white/[0.03] animate-pulse" />
  }
  if (!market) {
    return (
      <div className="flex flex-col items-center gap-1 py-4">
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          No opportunity detected
        </span>
      </div>
    )
  }
  const scoreClr = scoreColor(market.opportunity_score)
  const sig = market.top_signal
  const isLongDir = market.direction.toLowerCase() === 'long' || market.direction.toLowerCase() === 'bullish'
  const dirClr = isLongDir ? 'var(--color-profit)' : market.direction.toLowerCase() === 'short' ? 'var(--color-loss)' : 'var(--color-text-muted)'

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} color="var(--color-accent)" strokeWidth={2} />
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.08em' }}
          >
            Best Opportunity
          </span>
        </div>
        <span
          className="font-mono font-bold tabular-nums px-1.5 py-[1px] rounded"
          style={{ fontSize: 10, color: scoreClr, background: `${scoreClr}1a` }}
        >
          {market.opportunity_score}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-mono font-bold"
            style={{ fontSize: 18, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}
          >
            {market.root}
          </span>
          <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
            {market.symbol}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DirectionIcon direction={market.direction} />
          <span
            className="font-mono font-semibold uppercase"
            style={{ fontSize: 9, color: dirClr, letterSpacing: '0.06em' }}
          >
            {market.direction}
          </span>
        </div>
      </div>

      <span
        className="font-mono font-bold tabular-nums"
        style={{ fontSize: 16, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
      >
        {formatPrice(market.price)}
      </span>

      {sig && (
        <div
          className="grid grid-cols-3 gap-1 pt-2 mt-1"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <MiniKV label="Entry" value={formatPrice(sig.entry)} />
          <MiniKV label="R:R" value={sig.rr.toFixed(1)} accent={dirClr} />
          <MiniKV label="Conf." value={sig.confidence} />
        </div>
      )}
    </>
  )
}

function MiniKV({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="font-mono uppercase"
        style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
      >
        {label}
      </span>
      <span
        className="font-mono tabular-nums font-semibold"
        style={{ fontSize: 10, color: accent ?? 'var(--color-text-secondary)' }}
      >
        {value}
      </span>
    </div>
  )
}

function BiasDonut({
  longCount,
  shortCount,
  rangeCount,
  total,
}: {
  longCount: number
  shortCount: number
  rangeCount: number
  total: number
}) {
  const size = 72
  const stroke = 9
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const longLen = (longCount / total) * circ
  const rangeLen = (rangeCount / total) * circ
  const shortLen = (shortCount / total) * circ

  const dominant = Math.max(longCount, rangeCount, shortCount)
  const label = dominant === longCount ? 'LONG' : dominant === shortCount ? 'SHORT' : 'RANGE'
  const labelClr = dominant === longCount ? 'var(--color-profit)' : dominant === shortCount ? 'var(--color-loss)' : 'var(--color-text-muted)'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-surface-elevated)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-profit)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${longLen} ${circ}` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ strokeDashoffset: 0 }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-text-muted)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${rangeLen} ${circ}` }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ strokeDashoffset: -longLen, opacity: 0.4 }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-loss)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${shortLen} ${circ}` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ strokeDashoffset: -(longLen + rangeLen) }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold uppercase"
          style={{ fontSize: 10, color: labelClr, letterSpacing: '0.06em', lineHeight: 1 }}
        >
          {label}
        </span>
        <span
          className="font-mono uppercase"
          style={{ fontSize: 7, color: 'var(--color-text-muted)', letterSpacing: '0.06em', marginTop: 2 }}
        >
          Majority
        </span>
      </div>
    </div>
  )
}

function LegendRow({ label, value, color, pct }: { label: string; value: number; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-sm flex-shrink-0" style={{ width: 8, height: 8, background: color, opacity: 0.85 }} />
      <span
        className="font-mono uppercase flex-1"
        style={{ fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }}
      >
        {label}
      </span>
      <span
        className="font-mono tabular-nums font-semibold"
        style={{ fontSize: 10, color: 'var(--color-text-primary)' }}
      >
        {value}
      </span>
      <span
        className="font-mono tabular-nums"
        style={{ fontSize: 9, color: 'var(--color-text-muted)', width: 30, textAlign: 'right' }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

function ConfluenceHeatRow({ market, index }: { market: RadarMarket; index: number }) {
  // Build 14 cells where filled count = confluence_score, colored by direction
  const filled = Math.max(0, Math.min(14, market.confluence_score))
  const isLong = market.direction.toLowerCase() === 'long' || market.direction.toLowerCase() === 'bullish'
  const isShort = market.direction.toLowerCase() === 'short' || market.direction.toLowerCase() === 'bearish'
  const clr = isLong ? 'var(--color-profit)' : isShort ? 'var(--color-loss)' : 'var(--color-text-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="flex items-center gap-2"
    >
      <span
        className="font-mono font-bold flex-shrink-0"
        style={{ fontSize: 10, color: 'var(--color-text-primary)', width: 26, letterSpacing: '0.02em' }}
      >
        {market.root}
      </span>
      <div className="flex items-center gap-[2px] flex-1">
        {Array.from({ length: 14 }).map((_, i) => {
          const active = i < filled
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-[1px]"
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: active ? 0.9 : 0.2, scaleY: 1 }}
              transition={{ delay: index * 0.06 + i * 0.015, duration: 0.3 }}
              style={{
                height: 14,
                background: active ? clr : 'var(--color-surface-elevated)',
                boxShadow: active ? `0 0 4px ${clr}40` : 'none',
              }}
            />
          )
        })}
      </div>
      <span
        className="font-mono tabular-nums font-semibold flex-shrink-0"
        style={{ fontSize: 10, color: clr, width: 18, textAlign: 'right' }}
      >
        {market.confluence_score}
      </span>
    </motion.div>
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
      className="h-full overflow-y-auto relative"
      style={{ background: 'var(--color-surface-base)' }}
    >
      {/* Ambient background — subtle, spans full viewport */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Left orb */}
        <motion.div
          className="absolute top-[20%] -left-40"
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 520,
            height: 520,
            background: 'radial-gradient(circle at center, rgba(92,184,240,0.08) 0%, transparent 60%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Right orb */}
        <motion.div
          className="absolute bottom-[15%] -right-40"
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{
            width: 560,
            height: 560,
            background: 'radial-gradient(circle at center, rgba(92,184,240,0.07) 0%, transparent 60%)',
            filter: 'blur(24px)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(92,184,240,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(92,184,240,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Scanning beam — vertical, moves left→right */}
        <motion.div
          className="absolute top-0 bottom-0 w-[220px]"
          initial={{ left: '-20%' }}
          animate={{ left: '110%' }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.04) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes radar-sweep {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[280px_minmax(0,760px)_300px] gap-6 px-6 py-8 max-w-[1400px] mx-auto">

        {/* Left Sidebar — Market Pulse */}
        <div className="order-2 xl:order-1">
          <MarketPulsePanel markets={markets} isLoading={isLoading} />
        </div>

        {/* Center Column */}
        <div className="order-1 xl:order-2 flex flex-col gap-6">

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
              ARCTIS RADAR
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
        {/* /Center Column */}

        {/* Right Sidebar — Live Activity */}
        <div className="order-3">
          <LiveActivityPanel markets={markets} lastScan={lastScan} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
