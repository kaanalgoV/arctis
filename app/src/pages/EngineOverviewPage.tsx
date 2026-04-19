import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crosshair,
  Activity,
  BarChart3,
  Shield,
  Gauge,
  Layers,
  Radio,
  ChevronRight,
  ChevronDown,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  Check,
  X,
  Hexagon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EngineOverviewPageProps {
  onNavigateToChart?: () => void
}

// ── Data ──────────────────────────────────────────────────────────────────────

interface PatternDef {
  id: string
  name: string
  shortName: string
  category: 'breakout' | 'mean_reversion' | 'fakeout' | 'reversal' | 'fade'
  winRate: number
  profitFactor: number
  riskReward: number
  sampleSize: number
  status: 'tier1' | 'marginal' | 'edge' | 'new'
  description: string
  setup: string
  keyInsight: string
  bestFor: string
  markets: string
  icon: React.ReactNode
}

const PATTERNS: PatternDef[] = [
  // ── 365-Day Backtest Verified (results.json) ──────────────────────────────
  {
    id: 'ib_break',
    name: 'Initial Balance Break',
    shortName: 'IB Extension',
    category: 'breakout',
    winRate: 87.4,
    profitFactor: 204.34,
    riskReward: 26.4,
    sampleSize: 649,
    status: 'tier1',
    description: 'Highest profit factor of any setup. 60-min IB one-sided breakout with 87-91% WR across 649 trades.',
    setup: 'IB extension only one direction. ES: 88.6% WR Long / 90.9% Short. NQ: 86.4% Long / 83.2% Short.',
    keyInsight: 'ES Short IB Break: PF 386.68 (highest single setup). Thursday bonus for higher breakout rates.',
    bestFor: 'Directional days after tight IB',
    markets: 'NQ + ES',
    icon: <ArrowUpDown size={20} strokeWidth={1.5} />,
  },
  {
    id: 'orb',
    name: 'Opening Range Breakout',
    shortName: 'ORB Breakout',
    category: 'breakout',
    winRate: 86.8,
    profitFactor: 113.57,
    riskReward: 12.2,
    sampleSize: 1144,
    status: 'tier1',
    description: 'Largest sample size. 15-min OR break with 82-90% WR across 1,144 trades in 365-day backtest.',
    setup: 'Break above/below 15-min ORH/ORL. Entry 0.5pt beyond trigger. RVOL >= 0.7 required.',
    keyInsight: 'NQ sweet spot: 25-35pt OR range (50% WR live). Avoid >35pt ranges (14% WR live).',
    bestFor: 'Trend days, volatile opens',
    markets: 'NQ + ES',
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
  },
  {
    id: 'mbo_80',
    name: '80% Rule (Value Area)',
    shortName: '80% Rule',
    category: 'mean_reversion',
    winRate: 52.6,
    profitFactor: 55.59,
    riskReward: 3.1,
    sampleSize: 175,
    status: 'tier1',
    description: 'Open outside value area, retreat inside for full VA traverse. 175 trades in 365-day backtest.',
    setup: 'Open above VAH → re-enter VA → target opposite boundary. NQ Short: 67.4% WR, PF 104.22.',
    keyInsight: 'NQ Short 80% Rule is best directional variant (67.4% WR, $1,040 PnL). ES Long weakest (47.2%).',
    bestFor: 'Range-bound sessions, rotational days',
    markets: 'NQ + ES',
    icon: <Target size={20} strokeWidth={1.5} />,
  },
  // ── Live Signal Engine v9 Verified ────────────────────────────────────────
  {
    id: 'vwap_bounce',
    name: 'VWAP Mean Reversion',
    shortName: 'VWAP Bounce',
    category: 'reversal',
    winRate: 60.6,
    profitFactor: 2.11,
    riskReward: 1.5,
    sampleSize: 33,
    status: 'tier1',
    description: 'Price extended >1.5 ATR from VWAP + reversal bar. NQ primary signal with 60.6% WR.',
    setup: 'Reversal bar closes toward VWAP. Bias filter: no long in SHORT bias. Target: 1R quick profit.',
    keyInsight: 'ES DISABLED (38% WR, -$19pt). NQ only. v9 bias filter prevents wrong-direction entries.',
    bestFor: 'Midday + Power Hour, NQ only',
    markets: 'NQ only',
    icon: <TrendingDown size={20} strokeWidth={1.5} />,
  },
  {
    id: 'poc_rejection',
    name: 'POC Rejection',
    shortName: 'POC Reject',
    category: 'reversal',
    winRate: 61.5,
    profitFactor: 6.07,
    riskReward: 2.0,
    sampleSize: 13,
    status: 'tier1',
    description: 'Highest-confidence signal. 3-bar approach to POC + reversal bar. PF 6.07 in March 2026 backtest.',
    setup: '3-bar approach to POC + rejection bar. Volume >= 70% of session avg. Min R:R 2.0 (raised in v7).',
    keyInsight: 'March backtest: 13 trades, 61.5% WR, +1.54R avg. Works as mean-reversion in any bias state.',
    bestFor: 'Any RTH session, high conviction',
    markets: 'NQ + ES',
    icon: <Crosshair size={20} strokeWidth={1.5} />,
  },
  {
    id: 'daily_breakout',
    name: 'Daily Breakout (PDH/PDL)',
    shortName: 'Daily Break',
    category: 'breakout',
    winRate: 66.7,
    profitFactor: 2.77,
    riskReward: 1.5,
    sampleSize: 6,
    status: 'tier1',
    description: 'Intraday break of previous day high/low with VWAP alignment. ES only (NQ disabled).',
    setup: 'Close beyond PDH/PDL. VWAP alignment required. ATR stop. NQ DISABLED (27% WR, -$157pt).',
    keyInsight: 'ES: 66.7% WR, +$92pt in 22 days. Critical: VWAP must confirm direction.',
    bestFor: 'Strong trend continuation, ES only',
    markets: 'ES only',
    icon: <Zap size={20} strokeWidth={1.5} />,
  },
  // ── Playbook Library ─────────────────────────────────────────────────────
  {
    id: 'consolidation_bo',
    name: 'Konsolidierungs-Ausbruch (Sammelzone)',
    shortName: 'Konsol. Break',
    category: 'breakout',
    winRate: 0,
    profitFactor: 0,
    riskReward: 1.5,
    sampleSize: 0,
    status: 'tier1',
    description: 'Konsolidierung nach ausgedehnter Bewegung, dann Breakout mit Volumen.',
    setup: 'Break above/below consolidation range MIT Volumen. Geschwindigkeit gleich oder steigend. Keine uebersprungenen Preise.',
    keyInsight: 'Anti-Signal: Bruch OHNE Volumen = Fake wahrscheinlich. Entschleunigung beim Bruch = Exhaustion.',
    bestFor: 'Nach Trend-Move, Continuation',
    markets: 'NQ + ES',
    icon: <Layers size={20} strokeWidth={1.5} />,
  },
  {
    id: 'exhaustion',
    name: 'Erschoepfung (Exhaustion)',
    shortName: 'Exhaustion',
    category: 'reversal',
    winRate: 0,
    profitFactor: 0,
    riskReward: 1.8,
    sampleSize: 0,
    status: 'tier1',
    description: 'Level bricht wiederholt, kehrt jedes Mal zurueck. Velocity sinkt pro Versuch.',
    setup: '2+ Bruch-Versuche am selben Level. Velocity(N) < Velocity(N-1). Gegenpartei initiiert mit avg+ Velocity.',
    keyInsight: 'Erschoepfung kuendigt Umkehr an (Axiom #4). Gemessen im M1. Basis fuer Double Fake.',
    bestFor: 'Extrempunkte, Session-Highs/Lows',
    markets: 'NQ + ES',
    icon: <Activity size={20} strokeWidth={1.5} />,
  },
  {
    id: 'session_fade',
    name: 'Session Fade (Power Hour)',
    shortName: 'Session Fade',
    category: 'fade',
    winRate: 0,
    profitFactor: 0,
    riskReward: 1.5,
    sampleSize: 0,
    status: 'tier1',
    description: 'Fade dominant session move during Power Hour. Reversal bar + declining volume at session extreme.',
    setup: 'Price within 1.5 ATR of session high/low. Volume declining. Session range > 1.5x ATR. Bias not LONG/SHORT.',
    keyInsight: 'Bypasses RVOL filter (declining volume IS the setup). Only fires in Power Hour on non-trend days.',
    bestFor: 'Power Hour only, rotational days',
    markets: 'NQ + ES',
    icon: <Clock size={20} strokeWidth={1.5} />,
  },
  {
    id: 'double_fake',
    name: 'Double Fake Exhaustion',
    shortName: 'Double Fake',
    category: 'fakeout',
    winRate: 45.8,
    profitFactor: 1.74,
    riskReward: 1.98,
    sampleSize: 48,
    status: 'marginal',
    description: 'Exhaustion an Extrempunkt + zweiter Test mit erneuter Ablehnung.',
    setup: 'Hohes Volumen + erhoehte Geschwindigkeit bei Ablehnungen. Konsolidierung nach Double Fake + Strukturbildung.',
    keyInsight: 'Starke Umkehr-Bias. Feb 17: Double Fake Exhaustion an Tiefs fuehrte zu +443 Tick Recovery.',
    bestFor: 'Exhaustion at key levels',
    markets: 'NQ + ES',
    icon: <AlertTriangle size={20} strokeWidth={1.5} />,
  },
  {
    id: 'opening_fake',
    name: 'Opening Fake (Fakeout Pro v5)',
    shortName: 'Opening Fake',
    category: 'fakeout',
    winRate: 16.0,
    profitFactor: 3.83,
    riskReward: 6.72,
    sampleSize: 50,
    status: 'edge',
    description: 'Bruch Vortageshoch/-tief ohne nachhaltiges Volumen, Rueckkehr zum Eroeffnungskurs.',
    setup: 'Bruch Vortagesextrem + KEIN Follow-Through + Strukturbildung am Eroeffnungskurs. Ziel: Naked POC Vortag.',
    keyInsight: 'PF 3.83. "Je staerker der Fake, desto staerker die echte Richtung" (Axiom #5).',
    bestFor: 'High conviction, small size',
    markets: 'NQ + ES',
    icon: <Eye size={20} strokeWidth={1.5} />,
  },
]

interface SignalDef {
  id: string
  name: string
  confluence: string
  winRate: string
  profitable: boolean
  note: string
}

const SIGNALS: SignalDef[] = [
  { id: 'poc_rejection', name: 'POC Rejection', confluence: '3+', winRate: '50%', profitable: true, note: 'Best signal quality' },
  { id: 'orb_break', name: 'ORB Break', confluence: '2+', winRate: '87%', profitable: true, note: '365-day: 1,144 trades verified' },
  { id: 'vwap_bounce', name: 'VWAP Bounce', confluence: '1+', winRate: '61%', profitable: true, note: 'NQ only, v8 redesign' },
  { id: 'daily_breakout', name: 'Daily Breakout', confluence: 'Med', winRate: '67%', profitable: true, note: 'ES only, VWAP-aligned' },
  { id: 'sammelzone', name: 'Consol. Breakout', confluence: 'Med', winRate: '--', profitable: false, note: 'Sammelzone break, live' },
  { id: 'session_fade', name: 'Session Fade', confluence: '1+', winRate: '--', profitable: true, note: 'Power Hour fade, live' },
  { id: 'bos', name: 'Break of Structure', confluence: 'Med', winRate: '--', profitable: false, note: 'DISABLED - 0% WR' },
]

interface AnalysisModule {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  group: 'core' | 'pattern' | 'risk' | 'context'
}

const ANALYSIS_MODULES: AnalysisModule[] = [
  { id: 'bias', name: 'Bias Engine', description: '5-state directional classification', icon: <Gauge size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'confluence', name: 'Confluence', description: 'Multi-indicator score -10..+10', icon: <Layers size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'structure', name: 'Structure', description: 'Swing detection, BOS/CHoCH', icon: <Activity size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'volume_profile', name: 'Volume Profile', description: 'POC, VAH, VAL, session levels', icon: <BarChart3 size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'vwap', name: 'VWAP', description: 'VWAP + 1/2 sigma deviation bands', icon: <TrendingUp size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'velocity', name: 'Velocity', description: 'Auction speed 1-10 scale', icon: <Zap size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'indicators', name: 'Indicators', description: 'EMA ribbon 9/21/50, RSI', icon: <TrendingDown size={14} strokeWidth={1.75} />, group: 'core' },
  { id: 'sessions', name: 'Sessions', description: 'RTH phase classification', icon: <Clock size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'patterns', name: 'Patterns', description: 'Day-type & pattern detection', icon: <Crosshair size={14} strokeWidth={1.75} />, group: 'pattern' },
  { id: 'signals', name: 'Signal Engine v9', description: '6 signal types, min 2 confluence', icon: <Radio size={14} strokeWidth={1.75} />, group: 'pattern' },
  { id: 'setup_engine', name: 'Setup Lifecycle', description: 'State machine: candidate -> exited', icon: <Target size={14} strokeWidth={1.75} />, group: 'pattern' },
  { id: 'double_fake', name: 'Double Fake', description: 'Exhaustion pattern detector', icon: <AlertTriangle size={14} strokeWidth={1.75} />, group: 'pattern' },
  { id: 'opening_fake', name: 'Opening Fake', description: 'Fakeout Pro v5', icon: <Eye size={14} strokeWidth={1.75} />, group: 'pattern' },
  { id: 'naked_poc', name: 'Naked POC', description: 'Untested POC tracking', icon: <Crosshair size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'volume', name: 'Volume Analysis', description: 'RVOL, spike detection', icon: <BarChart3 size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'auction', name: 'Auction Quality', description: 'Move cleanliness scoring', icon: <Activity size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'key_levels', name: 'Key Levels', description: 'Multi-day respected levels', icon: <Layers size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'probability', name: 'Probability', description: 'Historical nearest-neighbor forecast', icon: <Gauge size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'risk', name: 'Risk Management', description: 'Position sizing, daily P&L limits', icon: <Shield size={14} strokeWidth={1.75} />, group: 'risk' },
  { id: 'discipline', name: 'Discipline', description: 'Rule violations & warnings', icon: <Shield size={14} strokeWidth={1.75} />, group: 'risk' },
  { id: 'zones', name: 'Trading Zones', description: 'VA, ORB, key zone rendering', icon: <Layers size={14} strokeWidth={1.75} />, group: 'context' },
  { id: 'cum_delta', name: 'Cum Delta', description: 'Cumulative buy/sell pressure + divergence', icon: <BarChart3 size={14} strokeWidth={1.75} />, group: 'core' },
]

// ── Animations ────────────────────────────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  breakout: '#5CB8F0',
  mean_reversion: '#34D399',
  reversal: '#A78BFA',
  fakeout: '#F7941D',
  fade: '#F472B6',
}

const CAT_LABELS: Record<string, string> = {
  breakout: 'BREAKOUT',
  mean_reversion: 'MEAN REVERSION',
  reversal: 'REVERSAL',
  fakeout: 'FAKEOUT',
  fade: 'FADE',
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; glow: string }> = {
  tier1: { label: 'TIER 1', bg: 'rgba(52,211,153,0.06)', text: '#34D399', glow: 'rgba(52,211,153,0.15)' },
  marginal: { label: 'MARGINAL', bg: 'rgba(247,148,29,0.06)', text: '#F7941D', glow: 'rgba(247,148,29,0.15)' },
  edge: { label: 'R:R EDGE', bg: 'rgba(167,139,250,0.06)', text: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
  new: { label: 'PLANNED', bg: 'rgba(148,163,184,0.06)', text: '#94A3B8', glow: 'rgba(148,163,184,0.15)' },
}

// ── Mini ring chart for win rate ──────────────────────────────────────────────

function WinRateRing({ value, size = 52, color }: { value: number; size?: number; color: string }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-elevated)" strokeWidth={3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="font-mono tabular-nums font-bold" style={{ fontSize: 12, color }}>
        {Math.round(value)}%
      </span>
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function Stat({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono uppercase tracking-[0.14em]" style={{ fontSize: 7, color: 'var(--color-text-muted)', opacity: 0.7 }}>
        {label}
      </span>
      <span
        className={cn('font-mono tabular-nums', large ? 'font-bold' : 'font-semibold')}
        style={{ fontSize: large ? 18 : 13, color: color ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

// ── Pattern Card (redesigned) ─────────────────────────────────────────────────

function PatternCard({ pattern, index, isExpanded, onToggle }: {
  pattern: PatternDef; index: number; isExpanded: boolean; onToggle: () => void
}) {
  const catColor = CAT_COLORS[pattern.category]
  const status = STATUS_STYLES[pattern.status]

  return (
    <motion.div
      variants={fadeUp}
      layout
      className="group relative overflow-hidden cursor-pointer"
      onClick={onToggle}
      style={{
        background: isExpanded ? 'var(--color-surface-secondary)' : 'var(--color-surface-primary)',
        borderRadius: 10,
        border: `1px solid ${isExpanded ? catColor + '35' : 'var(--color-border-subtle)'}`,
        boxShadow: isExpanded ? `0 0 20px ${status.glow}, 0 4px 12px rgba(0,0,0,0.3)` : '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${catColor}80, transparent)` }} />

      <div className="p-4 pb-3">
        {/* Row 1: icon + name + status + chevron */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, ${catColor}10, ${catColor}05)`,
              border: `1px solid ${catColor}20`,
              color: catColor,
            }}
          >
            {pattern.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold truncate" style={{ fontSize: 15, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                {pattern.shortName}
              </span>
              <span
                className="shrink-0 inline-flex items-center px-1.5 py-[2px] rounded-[4px] font-mono uppercase font-extrabold"
                style={{ fontSize: 7, letterSpacing: '0.12em', background: status.bg, color: status.text, border: `1px solid ${status.text}25` }}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: catColor }} />
                <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: 8, color: catColor, opacity: 0.8 }}>
                  {CAT_LABELS[pattern.category]}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', opacity: 0.5 }}>
                {pattern.markets}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
            style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}
          >
            <ChevronRight size={14} />
          </motion.div>
        </div>

        {/* Row 2: stats with ring */}
        <div className="flex items-center gap-4">
          {pattern.winRate > 0 ? (
            <WinRateRing
              value={pattern.winRate}
              color={pattern.winRate >= 45 ? '#34D399' : catColor}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 52, height: 52, border: `2px dashed ${catColor}30`, background: `${catColor}05` }}
            >
              <span className="font-mono uppercase font-extrabold" style={{ fontSize: 8, color: catColor, letterSpacing: '0.1em' }}>n/a</span>
            </div>
          )}
          <div className="flex items-center gap-5 flex-1">
            <Stat
              label="Profit Factor"
              value={pattern.profitFactor > 0 ? (pattern.profitFactor > 100 ? `${Math.round(pattern.profitFactor)}` : pattern.profitFactor.toFixed(2)) : 'n/a'}
              color={pattern.profitFactor >= 1.5 ? '#34D399' : 'var(--color-text-muted)'}
            />
            <Stat
              label="Risk:Reward"
              value={`${pattern.riskReward.toFixed(1)}x`}
              color={pattern.riskReward >= 1.5 ? '#5CB8F0' : 'var(--color-text-secondary)'}
            />
            <Stat
              label="Trades"
              value={pattern.sampleSize > 0 ? pattern.sampleSize.toLocaleString() : 'n/a'}
              color={pattern.sampleSize > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)'}
            />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5" style={{ borderTop: `1px solid ${catColor}15` }}>
              <p className="pt-3 font-sans" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {pattern.description}
              </p>

              {/* Setup rules box */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}>
                <span className="font-mono uppercase tracking-[0.12em] font-bold" style={{ fontSize: 8, color: catColor }}>
                  Setup Rules
                </span>
                <p className="mt-1.5 font-mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {pattern.setup}
                </p>
              </div>

              {/* Key insight + best for */}
              <div className="flex gap-2">
                <div className="flex-1 p-2.5 rounded-lg" style={{ background: `${catColor}06`, border: `1px solid ${catColor}12` }}>
                  <span className="font-mono uppercase tracking-[0.12em] font-bold" style={{ fontSize: 7, color: catColor }}>Key Insight</span>
                  <p className="mt-1 font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {pattern.keyInsight}
                  </p>
                </div>
                <div className="shrink-0 p-2.5 rounded-lg" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)', minWidth: 120 }}>
                  <span className="font-mono uppercase tracking-[0.12em] font-bold" style={{ fontSize: 7, color: 'var(--color-text-muted)' }}>Best For</span>
                  <p className="mt-1 font-mono" style={{ fontSize: 9, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {pattern.bestFor}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Signal row (redesigned) ───────────────────────────────────────────────────

function SignalRow({ signal }: { signal: SignalDef }) {
  return (
    <motion.div
      variants={fadeUp}
      className="grid items-center gap-3 px-4 py-3"
      style={{
        gridTemplateColumns: '8px 140px 50px 50px 1fr 80px',
        background: 'var(--color-surface-primary)',
        borderRadius: 8,
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: signal.profitable ? '#34D399' : '#F7941D' }} />
      <span className="font-sans font-semibold truncate" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
        {signal.name}
      </span>
      <span
        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-bold"
        style={{ fontSize: 9, background: 'rgba(92,184,240,0.08)', color: '#5CB8F0', border: '1px solid rgba(92,184,240,0.15)' }}
      >
        {signal.confluence}
      </span>
      <span className="font-mono tabular-nums font-semibold" style={{ fontSize: 11, color: signal.winRate !== '--' ? '#34D399' : 'var(--color-text-muted)' }}>
        {signal.winRate}
      </span>
      <span className="font-mono truncate" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
        {signal.note}
      </span>
      <div className="flex items-center justify-end gap-1">
        {signal.profitable ? <Check size={10} strokeWidth={2.5} style={{ color: '#34D399' }} /> : <X size={10} strokeWidth={2.5} style={{ color: '#F7941D' }} />}
        <span className="font-mono uppercase font-extrabold" style={{ fontSize: 7, letterSpacing: '0.1em', color: signal.profitable ? '#34D399' : '#F7941D' }}>
          {signal.profitable ? 'PROFITABLE' : 'MARGINAL'}
        </span>
      </div>
    </motion.div>
  )
}

// ── Module grid (redesigned) ──────────────────────────────────────────────────

const GROUP_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  core: { label: 'Core Analysis', color: '#5CB8F0', icon: <Hexagon size={10} strokeWidth={2} /> },
  pattern: { label: 'Pattern Detection', color: '#34D399', icon: <Crosshair size={10} strokeWidth={2} /> },
  context: { label: 'Market Context', color: '#F7941D', icon: <Layers size={10} strokeWidth={2} /> },
  risk: { label: 'Risk & Discipline', color: '#F87171', icon: <Shield size={10} strokeWidth={2} /> },
}

function ModuleGrid({ modules }: { modules: AnalysisModule[] }) {
  const groups = ['core', 'pattern', 'context', 'risk'] as const
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {groups.map((group) => {
        const items = modules.filter((m) => m.group === group)
        if (items.length === 0) return null
        const g = GROUP_CONFIG[group]
        return (
          <motion.div key={group} variants={fadeUp}>
            <div className="flex items-center gap-2 mb-2.5 ml-1">
              <div style={{ color: g.color }}>{g.icon}</div>
              <span className="font-mono uppercase tracking-[0.14em] font-bold" style={{ fontSize: 9, color: g.color }}>
                {g.label}
              </span>
              <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(90deg, ${g.color}20, transparent)` }} />
              <span className="font-mono tabular-nums" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{items.length}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-[var(--color-surface-secondary)]"
                  style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${g.color}08`, color: g.color }}>
                    {mod.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="font-sans font-semibold block truncate" style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>
                      {mod.name}
                    </span>
                    <span className="font-mono block truncate" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                      {mod.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Lifecycle pipeline (redesigned) ───────────────────────────────────────────

const LIFECYCLE_ACTIVE = [
  { id: 'candidate', label: 'Candidate', desc: 'New signal detected', color: 'var(--color-text-muted)' },
  { id: 'qualified', label: 'Qualified', desc: 'Passes filters', color: '#5CB8F0' },
  { id: 'armed', label: 'Armed', desc: 'Within 0.2% entry', color: '#F7941D' },
  { id: 'triggered', label: 'Triggered', desc: 'Entry hit', color: '#34D399' },
  { id: 'in_position', label: 'In Position', desc: 'Managing trade', color: '#34D399' },
  { id: 'exited', label: 'Exited', desc: 'Full exit', color: 'var(--color-text-muted)' },
]

const LIFECYCLE_TERMINAL = [
  { id: 'stopped', label: 'Stopped', desc: 'Stop loss hit', color: '#F87171' },
  { id: 'invalidated', label: 'Invalidated', desc: 'Pre-entry stop violated', color: '#F87171' },
  { id: 'expired', label: 'Expired', desc: 'Too old / session ended', color: 'var(--color-text-muted)' },
]

function LifecycleView() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Pipeline visualization */}
      <motion.div variants={fadeUp} className="p-5 rounded-xl" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
        <span className="font-mono uppercase tracking-[0.14em] font-bold block mb-4" style={{ fontSize: 9, color: '#5CB8F0' }}>
          Setup State Machine
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {LIFECYCLE_ACTIVE.map((state, i) => (
            <div key={state.id} className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex flex-col items-center px-3 py-2.5 rounded-lg min-w-[90px]"
                style={{ background: `${state.color}08`, border: `1px solid ${state.color}20` }}
              >
                <span className="font-mono uppercase font-extrabold" style={{ fontSize: 8, letterSpacing: '0.1em', color: state.color }}>
                  {state.label}
                </span>
                <span className="font-mono mt-0.5" style={{ fontSize: 8, color: 'var(--color-text-muted)', opacity: 0.6 }}>
                  {state.desc}
                </span>
              </div>
              {i < LIFECYCLE_ACTIVE.length - 1 && (
                <div className="flex items-center shrink-0">
                  <div className="w-3 h-px" style={{ background: 'var(--color-border-subtle)' }} />
                  <ChevronRight size={8} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Terminal states */}
      <motion.div variants={fadeUp} className="p-5 rounded-xl" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
        <span className="font-mono uppercase tracking-[0.14em] font-bold block mb-3" style={{ fontSize: 9, color: '#F87171' }}>
          Terminal States
        </span>
        <div className="flex items-center gap-3">
          {LIFECYCLE_TERMINAL.map((state) => (
            <div key={state.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${state.color}06`, border: `1px solid ${state.color}15` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: state.color, opacity: 0.6 }} />
              <div>
                <span className="font-mono font-semibold" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{state.label}</span>
                <span className="font-mono ml-1.5" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{state.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Chart artifacts */}
      <motion.div variants={fadeUp} className="p-5 rounded-xl" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
        <span className="font-mono uppercase tracking-[0.14em] font-bold block mb-3" style={{ fontSize: 9, color: '#5CB8F0' }}>
          Chart Artifacts
        </span>
        <div className="flex items-center gap-5">
          {[
            { name: 'Entry Zone', color: '#5CB8F0', type: 'band' },
            { name: 'Entry Line', color: '#5CB8F0', type: 'line' },
            { name: 'Stop Loss', color: '#F87171', type: 'dash' },
            { name: 'Target 1', color: '#34D399', type: 'line' },
            { name: 'Target 2', color: '#34D399', type: 'dash' },
          ].map((a) => (
            <div key={a.name} className="flex items-center gap-2">
              <div className="w-5" style={{ height: a.type === 'band' ? 6 : 2, borderRadius: a.type === 'band' ? 2 : 1, background: a.type === 'band' ? a.color + '30' : a.color, borderTop: a.type === 'dash' ? `1px dashed ${a.color}` : 'none' }} />
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{a.name}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Hero stats bar ────────────────────────────────────────────────────────────

function HeroStats() {
  const stats = [
    { label: 'Setups', value: '11', sub: 'calibrated', color: '#5CB8F0' },
    { label: 'Signals', value: '7', sub: 'active types', color: '#34D399' },
    { label: 'Modules', value: '22', sub: 'analysis', color: '#F7941D' },
    { label: 'Backtest', value: '1,968', sub: '365-day verified', color: 'var(--color-text-primary)' },
    { label: 'Top WR', value: '91%', sub: 'ES IB Short', color: '#34D399' },
    { label: 'Top PF', value: '387', sub: 'ES IB Short', color: '#5CB8F0' },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-6 gap-3 mb-5"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={scaleIn}
          className="flex flex-col items-center py-3 rounded-lg"
          style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}
        >
          <span className="font-mono uppercase tracking-[0.14em]" style={{ fontSize: 7, color: 'var(--color-text-muted)' }}>
            {s.label}
          </span>
          <span className="font-mono tabular-nums font-bold mt-0.5" style={{ fontSize: 20, color: s.color, letterSpacing: '-0.02em' }}>
            {s.value}
          </span>
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', opacity: 0.5 }}>
            {s.sub}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Tab indicator ─────────────────────────────────────────────────────────────

type TabId = 'patterns' | 'signals' | 'modules' | 'lifecycle'

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'patterns', label: 'Setups', count: PATTERNS.length, icon: <Crosshair size={12} strokeWidth={1.75} /> },
    { id: 'signals', label: 'Signals', count: SIGNALS.length, icon: <Radio size={12} strokeWidth={1.75} /> },
    { id: 'modules', label: 'Modules', count: 22, icon: <Hexagon size={12} strokeWidth={1.75} /> },
    { id: 'lifecycle', label: 'Lifecycle', icon: <Activity size={12} strokeWidth={1.75} /> },
  ]

  return (
    <div className="flex items-center gap-1 mb-5 p-1 rounded-lg" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 rounded-md font-mono uppercase tracking-[0.08em] transition-all duration-200 flex-1 justify-center',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
            active === tab.id
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]',
          )}
          style={{ fontSize: 10 }}
        >
          {active === tab.id && (
            <motion.div
              layoutId="engine-tab-bg"
              className="absolute inset-0 rounded-md"
              style={{ background: 'var(--color-accent-muted)', border: '1px solid rgba(92,184,240,0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span className="tabular-nums font-bold" style={{ fontSize: 9, opacity: active === tab.id ? 1 : 0.5 }}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function EngineOverviewPage({ onNavigateToChart }: EngineOverviewPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('patterns')
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-surface-base)' }}>
      {/* Header */}
      <div className="shrink-0 px-5 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(92,184,240,0.12), rgba(92,184,240,0.04))',
              border: '1px solid rgba(92,184,240,0.18)',
              boxShadow: '0 0 12px rgba(92,184,240,0.08)',
            }}
          >
            <Crosshair size={16} strokeWidth={1.75} style={{ color: '#5CB8F0' }} />
          </div>
          <div>
            <h1 className="font-sans font-bold" style={{ fontSize: 20, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
              Engine Overview
            </h1>
            <p className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
              365-day backtest verified &middot; NQ + ES &middot; Arctis Engine calibrated
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <HeroStats />
        <TabBar active={activeTab} onChange={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === 'patterns' && (
            <motion.div key="patterns" variants={stagger} initial="hidden" animate="show" exit="hidden">
              {/* Category legend */}
              <div className="flex items-center gap-5 mb-4">
                {Object.entries(CAT_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: CAT_COLORS[key] + '25', border: `1px solid ${CAT_COLORS[key]}40` }} />
                    <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: 8, color: CAT_COLORS[key] }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {PATTERNS.map((p, i) => (
                  <PatternCard
                    key={p.id}
                    pattern={p}
                    index={i}
                    isExpanded={expandedPattern === p.id}
                    onToggle={() => setExpandedPattern(expandedPattern === p.id ? null : p.id)}
                  />
                ))}
              </div>

              {/* Key insight banner */}
              <motion.div
                variants={fadeUp}
                className="mt-4 p-4 rounded-xl flex items-start gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.04), rgba(92,184,240,0.04))',
                  border: '1px solid rgba(52,211,153,0.12)',
                }}
              >
                <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)' }}>
                  <Zap size={12} strokeWidth={2} style={{ color: '#34D399' }} />
                </div>
                <div>
                  <span className="font-sans font-semibold" style={{ fontSize: 12, color: '#34D399' }}>
                    Win Rate is NOT the Primary Metric
                  </span>
                  <p className="mt-1 font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                    The 80% Rule at 40.4% WR with 1.82 R:R produces PF 1.59 from 1,005 trades. The Opening Fake
                    at 16% WR achieves PF 3.83 with 6.72 R:R. Focus on <span style={{ color: '#34D399' }}>Profit Factor</span> and <span style={{ color: '#5CB8F0' }}>R:R ratio</span>, not win rate alone.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'signals' && (
            <motion.div key="signals" variants={stagger} initial="hidden" animate="show" exit="hidden">
              {/* Signal config bar */}
              <motion.div
                variants={fadeUp}
                className="grid grid-cols-6 gap-2 p-4 rounded-xl mb-4"
                style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}
              >
                {[
                  { label: 'Min Confluence', value: '2', color: '#5CB8F0' },
                  { label: 'Min R:R', value: '1.5:1', color: '#5CB8F0' },
                  { label: 'Max Stop', value: '60pts', color: 'var(--color-text-primary)' },
                  { label: 'Entry Offset', value: '2 ticks', color: 'var(--color-text-primary)' },
                  { label: 'BE Trigger', value: '35%', color: 'var(--color-text-primary)' },
                  { label: 'Expires', value: '10 bars', color: 'var(--color-text-primary)' },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col items-center">
                    <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 7, color: 'var(--color-text-muted)' }}>{c.label}</span>
                    <span className="font-mono tabular-nums font-bold mt-0.5" style={{ fontSize: 14, color: c.color }}>{c.value}</span>
                  </div>
                ))}
              </motion.div>

              {/* Signal header */}
              <div
                className="grid items-center gap-3 px-4 py-2 mb-2 rounded-md"
                style={{ gridTemplateColumns: '8px 140px 50px 50px 1fr 80px' }}
              >
                {['', 'Signal', 'Confl.', 'WR', 'Note', 'Status'].map((h) => (
                  <span key={h} className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 7, color: 'var(--color-text-muted)' }}>
                    {h}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5">
                {SIGNALS.map((s) => (
                  <SignalRow key={s.id} signal={s} />
                ))}
              </div>

              {/* Suppressed */}
              <motion.div variants={fadeUp} className="mt-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
                <span className="font-mono uppercase tracking-[0.12em] font-bold" style={{ fontSize: 9, color: '#F87171' }}>
                  Suppressed Signals
                </span>
                <div className="flex items-center gap-5 mt-2.5">
                  {[
                    { name: 'Low Confidence', reason: 'Caused bad trades' },
                    { name: 'VA Edge', reason: '0% WR in backtests' },
                    { name: 'Pre-Market', reason: 'Low volume' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <X size={10} strokeWidth={2} style={{ color: '#F87171', opacity: 0.5 }} />
                      <span className="font-mono font-medium" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.name}</span>
                      <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-inactive)' }}>({s.reason})</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'modules' && (
            <motion.div key="modules" initial="hidden" animate="show" exit="hidden">
              <ModuleGrid modules={ANALYSIS_MODULES} />
            </motion.div>
          )}

          {activeTab === 'lifecycle' && (
            <LifecycleView key="lifecycle" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
