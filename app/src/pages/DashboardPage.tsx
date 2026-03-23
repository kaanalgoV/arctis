import { motion } from 'framer-motion'
import { ArrowRight, Activity, Layers, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BiasData } from '@/components/panels/BiasPanel'
import type { ConfluenceAPIData } from '@/components/panels/ConfluencePanel'
import type { SessionAPIData } from '@/components/panels/SessionPanel'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigateToChart: () => void
  // Market data
  nqPrice: number | null
  nqChange: number | null
  esPrice: number | null
  esChange: number | null
  // Analysis data
  biasData: BiasData | null
  confluenceData: ConfluenceAPIData | null
  sessionData: SessionAPIData | null
  patternsData: PatternsAPIData | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
}

const EXPECTED_BARS: Record<string, number> = {
  premarket: 78,
  ny_open: 60,
  midday: 210,
  power_hour: 60,
  after_hours: 240,
}

function deriveSessionProgress(sessionData: SessionAPIData | null): number {
  if (!sessionData) return 0
  const key = sessionData.current_session
  const stat = sessionData.session_stats?.[key]
  if (!stat) return 0
  const expected = EXPECTED_BARS[key] ?? 60
  return Math.min(Math.round((stat.bar_count / expected) * 100), 99)
}

function parseBiasVariant(state: string): 'long' | 'range_long' | 'range' | 'range_short' | 'short' {
  const s = state.toLowerCase()
  if (s === 'long') return 'long'
  if (s === 'range_long') return 'range_long'
  if (s === 'range_short') return 'range_short'
  if (s === 'short') return 'short'
  return 'range'
}

const BIAS_CONFIG = {
  long: { label: 'LONG', color: 'var(--color-profit)', bg: 'rgba(0, 135, 87, 0.15)', border: 'rgba(0, 135, 87, 0.3)' },
  range_long: { label: 'RANGE LONG', color: 'var(--color-profit)', bg: 'rgba(0, 135, 87, 0.08)', border: 'rgba(0, 135, 87, 0.2)' },
  range: { label: 'RANGE', color: 'var(--color-text-muted)', bg: 'var(--color-surface-raised)', border: 'var(--color-border)' },
  range_short: { label: 'RANGE SHORT', color: 'var(--color-loss)', bg: 'rgba(239, 65, 54, 0.08)', border: 'rgba(239, 65, 54, 0.2)' },
  short: { label: 'SHORT', color: 'var(--color-loss)', bg: 'rgba(239, 65, 54, 0.15)', border: 'rgba(239, 65, 54, 0.3)' },
} as const

// ── Arctis Mountain Logo (large) ──────────────────────────────────────────────

function ArctisMountainLogoLarge() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Arctis logo"
    >
      <defs>
        <linearGradient id="dp-peak-main" x1="14" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A8DAFF" />
          <stop offset="40%" stopColor="#5CB8F0" />
          <stop offset="100%" stopColor="#1A4A70" />
        </linearGradient>
        <linearGradient id="dp-peak-main-shadow" x1="14" y1="4" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3A8CC4" />
          <stop offset="100%" stopColor="#0E2D48" />
        </linearGradient>
        <linearGradient id="dp-peak-left" x1="5" y1="8" x2="8" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CB8F0" />
          <stop offset="100%" stopColor="#1A3A58" />
        </linearGradient>
        <linearGradient id="dp-peak-right" x1="20" y1="10" x2="23" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4AACE8" />
          <stop offset="100%" stopColor="#1A3A58" />
        </linearGradient>
        <linearGradient id="dp-reflection" x1="14" y1="22" x2="14" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1A4A70" stopOpacity="0" />
        </linearGradient>
        <filter id="dp-star-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="14" cy="20" rx="11" ry="3" fill="#5CB8F0" fillOpacity="0.06" />

      <polygon points="5,19 9,9 13,19" fill="url(#dp-peak-left)" opacity="0.75" />
      <polygon points="9,9 7.5,14 10.5,14" fill="#D6EFFF" fillOpacity="0.55" />

      <polygon points="15,19 19,11 23,19" fill="url(#dp-peak-right)" opacity="0.7" />
      <polygon points="19,11 17.8,15 20.2,15" fill="#C8E8FF" fillOpacity="0.5" />

      <polygon points="14,2 7,22 14,18" fill="url(#dp-peak-main)" filter="url(#dp-glow)" />
      <polygon points="14,2 21,22 14,18" fill="url(#dp-peak-main-shadow)" />

      <polygon points="14,2 11,9 14,8 17,9" fill="#E8F6FF" fillOpacity="0.85" />
      <line x1="14" y1="2" x2="11" y2="9" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.5" />

      <line x1="4" y1="22" x2="24" y2="22" stroke="#5CB8F0" strokeOpacity="0.2" strokeWidth="0.75" />

      <polygon points="14,22 7,28 21,28" fill="url(#dp-reflection)" />
      <line x1="10" y1="24" x2="18" y2="24" stroke="#5CB8F0" strokeOpacity="0.12" strokeWidth="0.5" />
      <line x1="11.5" y1="26" x2="16.5" y2="26" stroke="#5CB8F0" strokeOpacity="0.08" strokeWidth="0.5" />

      <g filter="url(#dp-star-glow)">
        <path
          d="M23 3 L23.5 4.2 L24.7 4.7 L23.5 5.2 L23 6.4 L22.5 5.2 L21.3 4.7 L22.5 4.2 Z"
          fill="#A8DAFF"
          fillOpacity="0.9"
        />
        <circle cx="25.5" cy="2.5" r="0.4" fill="#5CB8F0" fillOpacity="0.7" />
        <circle cx="21" cy="2" r="0.3" fill="#5CB8F0" fillOpacity="0.5" />
      </g>
    </svg>
  )
}

// ── Market Card ───────────────────────────────────────────────────────────────

interface MarketCardProps {
  symbol: string
  description: string
  price: number | null
  change: number | null
  biasState: string | null
  confluenceScore: number | null
  confluenceMax: number | null
}

function MarketCard({
  symbol,
  description,
  price,
  change,
  biasState,
  confluenceScore,
  confluenceMax,
}: MarketCardProps) {
  const isPositive = change != null ? change >= 0 : null
  const biasVariant = biasState ? parseBiasVariant(biasState) : 'range'
  const biasCfg = BIAS_CONFIG[biasVariant]
  const confluencePct =
    confluenceScore != null && confluenceMax != null && confluenceMax > 0
      ? Math.round((confluenceScore / confluenceMax) * 100)
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-3 p-4',
        'rounded-2xl border border-white/[0.06]',
        'bg-[var(--color-surface-secondary)]',
        'transition-colors duration-200',
        'shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div
            className="font-mono font-bold tracking-wide"
            style={{ fontSize: 15, color: 'var(--color-text-primary)' }}
          >
            {symbol}
          </div>
          <div
            className="font-mono mt-0.5"
            style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
          >
            {description}
          </div>
        </div>

        {/* Bias badge */}
        {biasState && (
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
        )}
      </div>

      {/* Price */}
      <div className="flex items-end gap-2">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: 24, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          {price != null
            ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '--'}
        </span>
        {change != null && (
          <span
            className="font-mono tabular-nums mb-0.5"
            style={{
              fontSize: 12,
              color: isPositive ? 'var(--color-profit)' : 'var(--color-loss)',
              fontWeight: 600,
            }}
          >
            {isPositive ? '+' : ''}{change.toFixed(2)}
          </span>
        )}
      </div>

      {/* Confluence bar */}
      {confluencePct != null && (
        <div className="flex flex-col gap-1">
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
              {confluencePct}%
            </span>
          </div>
          <div
            className="relative overflow-hidden rounded-full"
            style={{ height: 4, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-subtle)' }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
              style={{
                width: `${confluencePct}%`,
                background: 'var(--color-border)',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── Daily Summary Card ─────────────────────────────────────────────────────────

interface DailySummaryCardProps {
  sessionData: SessionAPIData | null
  biasData: BiasData | null
  patternsData: PatternsAPIData | null
  confluenceData: ConfluenceAPIData | null
}

function DailySummaryCard({ sessionData, biasData, patternsData, confluenceData }: DailySummaryCardProps) {
  const sessionName = sessionData
    ? (SESSION_DISPLAY[sessionData.current_session] ?? sessionData.current_session)
    : null
  const sessionProgress = deriveSessionProgress(sessionData)
  const biasState = biasData?.bias_state.state ?? null
  const biasVariant = biasState ? parseBiasVariant(biasState) : 'range'
  const biasCfg = BIAS_CONFIG[biasVariant]
  const activeSignals = confluenceData?.signals.filter((s) => s.strength > 0).length ?? 0
  const keyLevels = biasData?.key_levels.length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-4 p-4',
        'rounded-2xl border border-white/[0.06]',
        'bg-[var(--color-surface-secondary)]',
        'shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
      )}
    >
      <div
        className="font-mono uppercase tracking-widest"
        style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
      >
        Daily Summary
      </div>

      {/* Session row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={12} color="var(--color-text-muted)" strokeWidth={1.75} />
            <span
              className="font-mono"
              style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
            >
              {sessionName ?? 'Unknown Session'}
            </span>
          </div>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
          >
            {sessionProgress}%
          </span>
        </div>
        <div
          className="relative overflow-hidden rounded-full"
          style={{ height: 3, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
            style={{
              width: `${sessionProgress}%`,
              background: 'var(--color-border)',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Bias state */}
        <div
          className="flex flex-col items-center gap-1 p-2.5 rounded-[var(--radius-md)]"
          style={{
            background: biasCfg.bg,
            border: `1px solid ${biasCfg.border}`,
          }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Bias
          </span>
          <span
            className="font-mono font-bold uppercase text-center"
            style={{ fontSize: 10, color: biasCfg.color, letterSpacing: '0.04em', lineHeight: 1.2 }}
          >
            {biasState ? biasCfg.label : '--'}
          </span>
        </div>

        {/* Active signals */}
        <div
          className="flex flex-col items-center gap-1 p-2.5 rounded-[var(--radius-md)] border"
          style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-subtle)' }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Signals
          </span>
          <div className="flex items-center gap-1">
            <TrendingUp size={10} color="var(--color-text-muted)" strokeWidth={2} />
            <span
              className="font-mono font-bold tabular-nums"
              style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1 }}
            >
              {activeSignals}
            </span>
          </div>
        </div>

        {/* Key levels */}
        <div
          className="flex flex-col items-center gap-1 p-2.5 rounded-[var(--radius-md)] border"
          style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-subtle)' }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Levels
          </span>
          <div className="flex items-center gap-1">
            <Layers size={10} color="var(--color-text-muted)" strokeWidth={2} />
            <span
              className="font-mono font-bold tabular-nums"
              style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1 }}
            >
              {keyLevels}
            </span>
          </div>
        </div>
      </div>

      {/* Patterns count */}
      {patternsData && patternsData.annotations.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]"
          style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            Active Patterns
          </span>
          <span
            className="font-mono font-bold tabular-nums"
            style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}
          >
            {patternsData.annotations.length}
          </span>
          {patternsData.day_bias && patternsData.day_bias !== 'unknown' && (
            <>
              <div
                className="w-px self-stretch"
                style={{ background: 'var(--color-border-subtle)' }}
              />
              <span
                className="font-mono uppercase"
                style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
              >
                Day Bias
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600 }}
              >
                {patternsData.day_bias}
              </span>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DashboardPage({
  onNavigateToChart,
  nqPrice,
  nqChange,
  esPrice,
  esChange,
  biasData,
  confluenceData,
  sessionData,
  patternsData,
}: DashboardPageProps) {
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: 'var(--color-surface-base)' }}
    >
      <div className="flex flex-col items-center px-8 py-10 max-w-2xl mx-auto gap-8">

        {/* Hero: Logo + wordmark + tagline */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Atmospheric glow behind logo */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full"
              style={{
                width: 160,
                height: 160,
                background: 'radial-gradient(circle, rgba(92,184,240,0.08) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <ArctisMountainLogoLarge />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: '6px',
                background: 'linear-gradient(135deg, #A8DAFF 0%, #5CB8F0 50%, #3A8CC4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              ARCTIS
            </span>
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 12, color: 'var(--color-text-muted)' }}
            >
              Trading Decision Support
            </span>
          </div>
        </motion.div>

        {/* Market overview — 2-column grid */}
        <div className="w-full flex flex-col gap-3">
          <motion.div
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            Market Overview
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            <MarketCard
              symbol="NQ"
              description="Nasdaq 100"
              price={nqPrice}
              change={nqChange}
              biasState={biasData?.bias_state.state ?? null}
              confluenceScore={confluenceData?.score ?? null}
              confluenceMax={confluenceData?.max_score ?? null}
            />
            <MarketCard
              symbol="ES"
              description="S&P 500"
              price={esPrice}
              change={esChange}
              biasState={null}
              confluenceScore={null}
              confluenceMax={null}
            />
          </div>
        </div>

        {/* Daily summary */}
        <div className="w-full">
          <DailySummaryCard
            sessionData={sessionData}
            biasData={biasData}
            patternsData={patternsData}
            confluenceData={confluenceData}
          />
        </div>

        {/* Open Chart CTA */}
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToChart}
          className="flex items-center gap-2.5 px-6 py-3 rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-dark) 0%, var(--color-accent) 100%)',
            boxShadow: '0 2px 8px rgba(92, 184, 240, 0.10)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              color: 'white',
              letterSpacing: '0.02em',
            }}
          >
            Open Chart
          </span>
          <ArrowRight size={16} color="white" strokeWidth={2} />
        </motion.button>
      </div>
    </div>
  )
}
