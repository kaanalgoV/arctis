'use client'

import { cn } from '@/lib/utils'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { fadeInUp, scaleIn, slideInLeft, slideInRight, viewportOnce } from '@/lib/animations'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  BarChart2,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Globe,
  Bell,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'chart' | 'bias' | 'session'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
}

// ─── Candlestick Data ─────────────────────────────────────────────────────────

interface Candle {
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Realistic NQ candlestick data (normalized 0–100 for rendering)
const CANDLES: Candle[] = [
  { open: 42, high: 48, low: 39, close: 46, volume: 38 },
  { open: 46, high: 52, low: 44, close: 50, volume: 45 },
  { open: 50, high: 54, low: 47, close: 48, volume: 32 },
  { open: 48, high: 51, low: 43, close: 44, volume: 41 },
  { open: 44, high: 47, low: 40, close: 46, volume: 36 },
  { open: 46, high: 55, low: 45, close: 53, volume: 58 },
  { open: 53, high: 58, low: 51, close: 56, volume: 52 },
  { open: 56, high: 60, low: 53, close: 54, volume: 44 },
  { open: 54, high: 57, low: 50, close: 51, volume: 39 },
  { open: 51, high: 54, low: 47, close: 53, volume: 42 },
  { open: 53, high: 62, low: 52, close: 61, volume: 68 },
  { open: 61, high: 65, low: 58, close: 59, volume: 47 },
  { open: 59, high: 63, low: 55, close: 57, volume: 43 },
  { open: 57, high: 61, low: 54, close: 60, volume: 50 },
  { open: 60, high: 68, low: 59, close: 66, volume: 62 },
  { open: 66, high: 70, low: 63, close: 64, volume: 48 },
  { open: 64, high: 67, low: 60, close: 62, volume: 40 },
  { open: 62, high: 66, low: 59, close: 65, volume: 54 },
  { open: 65, high: 72, low: 64, close: 71, volume: 71 },
  { open: 71, high: 76, low: 69, close: 74, volume: 66 },
  { open: 74, high: 78, low: 70, close: 72, volume: 55 },
  { open: 72, high: 75, low: 67, close: 69, volume: 46 },
  { open: 69, high: 73, low: 66, close: 71, volume: 49 },
  { open: 71, high: 79, low: 70, close: 77, volume: 73 },
]

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: 'chart', label: 'Dein Trading-Screen', icon: <BarChart2 size={14} /> },
  { id: 'bias', label: 'Long oder Short?', icon: <Gauge size={14} /> },
  { id: 'session', label: 'Wo stehst du?', icon: <Clock size={14} /> },
]

// ─── Candlestick Chart ────────────────────────────────────────────────────────

function CandlestickChart() {
  const minPrice = 39
  const maxPrice = 79
  const priceRange = maxPrice - minPrice

  // Map price value to Y percentage (inverted: higher price = lower Y)
  const toY = (price: number) =>
    100 - ((price - minPrice) / priceRange) * 100

  // Horizontal grid lines at every 10 units
  const gridLines = [40, 50, 60, 70]

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-frost-border-subtle/30">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          <span className="font-display text-sm font-semibold text-frost-white tracking-tight">
            NQ &mdash; E-mini Nasdaq 100
          </span>
          <span className="text-frost-muted text-xs font-mono">21,847.50</span>
          <span className="text-profit text-xs font-mono">+0.34%</span>
        </div>
        <div className="flex items-center gap-1">
          {['1m', '5m', '15m', '1H'].map((tf, i) => (
            <button
              key={tf}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-display font-medium transition-colors',
                i === 1
                  ? 'bg-ice-muted text-ice border border-ice/20'
                  : 'text-frost-muted hover:text-frost-secondary',
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-2 pr-2 pl-3 w-16 shrink-0">
          {[21880, 21860, 21840, 21820, 21800].map((price) => (
            <span
              key={price}
              className="text-frost-muted/50 text-[10px] font-mono leading-none"
            >
              {price.toLocaleString()}
            </span>
          ))}
        </div>

        {/* Candlestick area */}
        <div className="flex-1 relative overflow-hidden py-2 pr-3">
          {/* Horizontal grid lines */}
          {gridLines.map((price) => (
            <div
              key={price}
              className="absolute left-0 right-0 border-t border-frost-border-subtle/15"
              style={{ top: `${toY(price)}%` }}
            />
          ))}

          {/* VWAP line — diagonal dashed overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="vwapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.08" />
                <stop offset="50%" stopColor="#5CB8F0" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* VWAP line starting from lower-left to upper-right (bullish drift) */}
            <polyline
              points="0,78 15,72 30,68 45,62 55,58 70,50 82,43 100,36"
              fill="none"
              stroke="url(#vwapGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
            {/* VWAP label */}
            <text x="72%" y="30%" fill="#5CB8F0" fontSize="8" opacity="0.6" fontFamily="monospace">
              VWAP
            </text>
          </svg>

          {/* Candles */}
          <div className="absolute inset-0 flex items-stretch gap-px px-1">
            {CANDLES.map((candle, i) => {
              const isUp = candle.close >= candle.open
              const color = isUp ? '#34D399' : '#F87171'
              const bodyTop = Math.min(toY(candle.open), toY(candle.close))
              const bodyBottom = Math.max(toY(candle.open), toY(candle.close))
              const bodyHeight = Math.max(bodyBottom - bodyTop, 0.8)
              const wickTop = toY(candle.high)
              const wickBottom = toY(candle.low)

              return (
                <div key={i} className="flex-1 relative min-w-0">
                  {/* Wick */}
                  <div
                    className="absolute left-1/2 -translate-x-px w-px"
                    style={{
                      top: `${wickTop}%`,
                      height: `${wickBottom - wickTop}%`,
                      background: color,
                      opacity: 0.7,
                    }}
                  />
                  {/* Body */}
                  <div
                    className="absolute inset-x-0.5 rounded-[1px]"
                    style={{
                      top: `${bodyTop}%`,
                      height: `${bodyHeight}%`,
                      background: isUp
                        ? `linear-gradient(180deg, ${color}cc, ${color}99)`
                        : `linear-gradient(180deg, ${color}99, ${color}cc)`,
                      boxShadow: isUp
                        ? `0 0 4px ${color}40`
                        : `0 0 4px ${color}30`,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Volume bars */}
      <div className="flex gap-px px-1 h-8 pb-1 pl-[68px] pr-3 items-end border-t border-frost-border-subtle/20">
        {CANDLES.map((candle, i) => {
          const isUp = candle.close >= candle.open
          return (
            <div
              key={i}
              className="flex-1 rounded-sm min-w-0"
              style={{
                height: `${(candle.volume / 80) * 100}%`,
                background: isUp
                  ? 'rgba(52, 211, 153, 0.35)'
                  : 'rgba(248, 113, 113, 0.35)',
              }}
            />
          )
        })}
      </div>

      {/* X-axis label row */}
      <div className="flex justify-between px-4 pb-2 pt-0.5">
        {['09:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
          <span key={t} className="text-frost-muted/40 text-[10px] font-mono">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── BIAS Dashboard ───────────────────────────────────────────────────────────

function BiasGauge({ value }: { value: number }) {
  // value 0-100; needle angle: -90deg (0) to +90deg (100)
  const angle = -90 + (value / 100) * 180

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Semicircle gauge */}
      <div className="relative w-52 h-28 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full" aria-hidden>
          {/* Background arc track */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Colored arc — clamped to value */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke={`url(#gaugeGrad)`}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 283} 283`}
            opacity="0.9"
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          {/* Needle */}
          <g transform={`rotate(${angle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="100" cy="100" r="5" fill="white" opacity="0.9" />
          </g>
          {/* Center labels */}
          <text
            x="100"
            y="86"
            textAnchor="middle"
            fill="#34D399"
            fontSize="13"
            fontWeight="700"
            fontFamily="Space Grotesk, sans-serif"
          >
            LONG BIAS
          </text>
          <text
            x="100"
            y="100"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="700"
            fontFamily="Space Grotesk, sans-serif"
          >
            {value}%
          </text>
          {/* Arc endpoint labels */}
          <text x="6" y="112" fill="rgba(248,113,113,0.6)" fontSize="8" fontFamily="monospace">
            SHORT
          </text>
          <text x="174" y="112" fill="rgba(52,211,153,0.6)" fontSize="8" fontFamily="monospace">
            LONG
          </text>
        </svg>
      </div>
    </div>
  )
}

function BiasDashboard() {
  const timeframeBiases = [
    { tf: '5min', bias: 'Long', dir: 'up' as const },
    { tf: '15min', bias: 'Long', dir: 'up' as const },
    { tf: '1H', bias: 'Neutral', dir: 'flat' as const },
  ]

  const factors = [
    { label: 'Momentum', value: 'Bullish', score: 82, color: 'profit' },
    { label: 'Volume Delta', value: 'Positive', score: 71, color: 'profit' },
    { label: 'VWAP Position', value: 'Above', score: 68, color: 'profit' },
    { label: 'Session Range', value: 'Expanding', score: 55, color: 'warning' },
    { label: 'Market Structure', value: 'HH / HL', score: 78, color: 'profit' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-frost-border-subtle/30">
        <div className="flex items-center gap-2">
          <Gauge size={13} className="text-ice" />
          <span className="font-display text-sm font-semibold text-frost-white">
            Directional Bias Analysis
          </span>
        </div>
        <span className="text-frost-muted text-xs font-mono">NQ — Live</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column: gauge + timeframe cards */}
        <div className="flex flex-col items-center gap-4 p-4 flex-1">
          <BiasGauge value={73} />

          {/* Timeframe mini-cards */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {timeframeBiases.map(({ tf, bias, dir }) => {
              const isUp = dir === 'up'
              const isFlat = dir === 'flat'
              return (
                <div
                  key={tf}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg',
                    'border transition-colors',
                    isUp
                      ? 'bg-profit/5 border-profit/20'
                      : isFlat
                        ? 'bg-ice-subtle border-ice/15'
                        : 'bg-loss/5 border-loss/20',
                  )}
                >
                  <span className="text-frost-muted text-[10px] font-mono uppercase tracking-wider">
                    {tf}
                  </span>
                  <div className="flex items-center gap-1">
                    {isUp ? (
                      <ArrowUp size={10} className="text-profit" />
                    ) : isFlat ? (
                      <Minus size={10} className="text-ice" />
                    ) : (
                      <ArrowDown size={10} className="text-loss" />
                    )}
                    <span
                      className={cn(
                        'text-xs font-display font-semibold',
                        isUp ? 'text-profit' : isFlat ? 'text-ice' : 'text-loss',
                      )}
                    >
                      {bias}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: factor breakdown */}
        <div className="flex flex-col gap-2 p-4 w-52 border-l border-frost-border-subtle/25 shrink-0">
          <span className="text-frost-muted text-[10px] uppercase tracking-[0.15em] mb-1">
            Factor Breakdown
          </span>
          {factors.map(({ label, value, score, color }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-frost-secondary text-[11px]">{label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono font-medium',
                    color === 'profit'
                      ? 'text-profit'
                      : color === 'warning'
                        ? 'text-warning'
                        : 'text-loss',
                  )}
                >
                  {value}
                </span>
              </div>
              <div className="h-1 rounded-full bg-frost-border-subtle/40 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    color === 'profit'
                      ? 'bg-profit'
                      : color === 'warning'
                        ? 'bg-warning'
                        : 'bg-loss',
                  )}
                  style={{ width: `${score}%`, opacity: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Session View ─────────────────────────────────────────────────────────────

function SessionView() {
  const sessionStats = [
    { label: 'Open', value: '21,748', delta: null },
    { label: 'VWAP', value: '21,821', delta: '+73' },
    { label: 'POC', value: '21,808', delta: null },
  ]

  // Range bar: normalize high/low/current to 0-100
  const sessionLow = 21734
  const sessionHigh = 21892
  const sessionRange = sessionHigh - sessionLow
  const current = 21847
  const currentPct = ((current - sessionLow) / sessionRange) * 100
  const vwapPct = ((21821 - sessionLow) / sessionRange) * 100
  const pocPct = ((21808 - sessionLow) / sessionRange) * 100

  const phases = [
    { label: 'Pre-Market', pct: 17, color: 'bg-frost-border' },
    { label: 'RTH Open', pct: 8, color: 'bg-ice/60' },
    { label: 'Regular Trading Hours', pct: 50, color: 'bg-ice-muted' },
    { label: 'Mid-Day', pct: 15, color: 'bg-ice/30' },
    { label: 'Close', pct: 10, color: 'bg-ice/50' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-frost-border-subtle/30">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-ice" />
          <span className="font-display text-sm font-semibold text-frost-white">
            Session View
          </span>
          <span className="text-frost-muted text-xs">&mdash; RTH Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
          <span className="text-profit text-xs font-mono">10:47 ET</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* Key levels */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Session High', value: '21,892', color: 'text-profit' },
            { label: 'Current', value: '21,847', color: 'text-ice' },
            { label: 'Session Low', value: '21,734', color: 'text-loss' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="glass-card rounded-xl px-3 py-2.5 text-center"
            >
              <div className="text-frost-muted text-[10px] uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className={cn('font-display text-sm font-bold font-mono', color)}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Range indicator */}
        <div className="flex items-center gap-2">
          <div className="glass-card rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Layers size={11} className="text-ice" />
            <span className="text-frost-secondary text-[11px]">Range:</span>
            <span className="text-ice text-[11px] font-mono font-semibold">158 pts</span>
          </div>
          <div className="glass-card rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-profit" />
            <span className="text-frost-secondary text-[11px]">ATR(14):</span>
            <span className="text-profit text-[11px] font-mono font-semibold">203 pts</span>
          </div>
        </div>

        {/* Price range bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-loss/70">21,734</span>
            <span className="text-frost-muted/50">Price Range</span>
            <span className="text-profit/70">21,892</span>
          </div>
          <div className="relative h-5 rounded-full bg-arctic-secondary/80 border border-frost-border-subtle/30 overflow-visible">
            {/* Range fill */}
            <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-loss/20 via-ice/15 to-profit/20" />
            {/* VWAP marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-6 bg-ice/60 rounded-full"
              style={{ left: `${vwapPct}%` }}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-ice/60 font-mono whitespace-nowrap">
                VWAP
              </span>
            </div>
            {/* POC marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-6 bg-warning/50 rounded-full"
              style={{ left: `${pocPct}%` }}
            >
              <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[8px] text-warning/60 font-mono whitespace-nowrap">
                POC
              </span>
            </div>
            {/* Current price marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-ice border-2 border-arctic-base shadow-[0_0_8px_rgba(92,184,240,0.6)]"
              style={{ left: `${currentPct}%` }}
            />
          </div>
        </div>

        {/* Session timeline */}
        <div className="flex flex-col gap-1.5">
          <span className="text-frost-muted text-[10px] uppercase tracking-[0.15em]">
            Session Timeline
          </span>
          <div className="flex rounded-lg overflow-hidden h-6 border border-frost-border-subtle/30">
            {phases.map(({ label, pct, color }) => (
              <div
                key={label}
                className={cn('flex items-center justify-center', color)}
                style={{ width: `${pct}%` }}
                title={label}
              >
                {pct > 20 && (
                  <span className="text-[9px] text-frost-white/50 truncate px-1">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mini stat cards */}
        <div className="grid grid-cols-3 gap-2">
          {sessionStats.map(({ label, value, delta }) => (
            <div
              key={label}
              className="glass-card rounded-xl px-3 py-2 flex flex-col gap-0.5"
            >
              <span className="text-frost-muted text-[10px] uppercase tracking-wider">
                {label}
              </span>
              <span className="font-mono text-xs font-semibold text-frost-white">
                {value}
              </span>
              {delta && (
                <span className="text-[10px] font-mono text-ice/70">{delta}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Floating Annotation Badges ───────────────────────────────────────────────

interface BadgeProps {
  label: string
  icon: React.ReactNode
  className?: string
  parallaxY: ReturnType<typeof useTransform<number, number>>
  delay?: number
}

function FloatingBadge({ label, icon, className, parallaxY, delay = 0 }: BadgeProps) {
  return (
    // Outer layer: parallax scroll offset via MotionValue
    <motion.div
      style={{ y: parallaxY }}
      className={cn('absolute pointer-events-none select-none', className)}
    >
      {/* Entry animation layer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Float animation via CSS so it doesn't interfere with Framer state */}
        <div
          style={{
            animation: `float-slow ${3 + delay}s ease-in-out infinite`,
            animationDelay: `${delay * 0.5}s`,
          }}
          className={cn(
            'glass rounded-xl px-3 py-2',
            'flex items-center gap-2',
            'border border-frost-border/60 shadow-frost-md',
          )}
        >
          <span className="text-ice">{icon}</span>
          <span className="text-frost-secondary text-xs font-display font-medium whitespace-nowrap">
            {label}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── ProductShowcase ──────────────────────────────────────────────────────────

function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('chart')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -3, y: x * 3 })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  // Parallax scroll tracking
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Mockup moves slightly slower than scroll
  const mockupY = useTransform(scrollYProgress, [0, 1], [40, -40])

  // Floating badges at different parallax speeds
  const badge1Y = useTransform(scrollYProgress, [0, 1], [20, -60])
  const badge2Y = useTransform(scrollYProgress, [0, 1], [60, -20])
  const badge3Y = useTransform(scrollYProgress, [0, 1], [10, -50])
  const badge4Y = useTransform(scrollYProgress, [0, 1], [50, -30])

  // Tab content variants
  const tabVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <section
      ref={sectionRef}
      className={cn('section-padding relative overflow-hidden noise-overlay')}
      id="product"
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(92,184,240,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="section-container relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col items-center text-center gap-4 mb-12"
        >
          <span className="text-ice text-sm font-medium uppercase tracking-[0.15em]">
            Platform Overview
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-frost-white leading-tight">
            So sieht dein Morgen
            <br />
            <span className="text-gradient-frost">um 9:29 aus</span>
          </h2>
          <p className="text-frost-secondary text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
            Drei Ansichten. Eine Wahrheit. Du weisst genau was zu tun ist.
          </p>
        </motion.div>

        {/* ── Tab Navigation ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-arctic-secondary/60 border border-frost-border-subtle/40 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative px-5 py-2.5 rounded-xl cursor-pointer text-sm font-display font-medium',
                    'flex items-center gap-2 transition-colors duration-200',
                    isActive
                      ? 'text-frost-white'
                      : 'text-frost-muted hover:text-frost-secondary bg-transparent',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-active-bg"
                      className="absolute inset-0 rounded-xl bg-ice-muted border border-ice/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── Mockup + Floating Badges ── */}
        <div className="relative">
          {/* Floating annotation badges — positioned around the mockup */}
          <FloatingBadge
            label="3 aktive Setups"
            icon={<Zap size={12} />}
            parallaxY={badge1Y}
            delay={0.3}
            className="hidden lg:flex -left-4 top-16"
          />
          <FloatingBadge
            label="BIAS: LONG +7"
            icon={<TrendingUp size={12} />}
            parallaxY={badge2Y}
            delay={0.4}
            className="hidden lg:flex -left-8 bottom-24"
          />
          <FloatingBadge
            label="R:R 3.2"
            icon={<Activity size={12} />}
            parallaxY={badge3Y}
            delay={0.35}
            className="hidden lg:flex -right-4 top-24"
          />
          <FloatingBadge
            label="Confluence: 78"
            icon={<Bell size={12} />}
            parallaxY={badge4Y}
            delay={0.45}
            className="hidden lg:flex -right-8 bottom-16"
          />

          {/* Mockup container with parallax */}
          <motion.div
            ref={containerRef}
            style={{
              y: mockupY,
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
              perspective: '1000px',
            }}
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'glass-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-2',
              'frost-glow-lg',
              'max-w-full overflow-hidden',
              'border border-frost-border/60',
              'shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(92,184,240,0.12)]',
            )}
          >
            {/* Inner chrome bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-frost-border-subtle/30 mb-0">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-loss/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-profit/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="glass rounded-md px-4 py-0.5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ice/40" />
                  <span className="text-frost-muted/50 text-xs font-mono">
                    arctis.app — LIVE
                  </span>
                </div>
              </div>
              <div className="w-[54px]" />
            </div>

            {/* Tab content area */}
            <div className="relative h-[420px] sm:h-[480px] overflow-hidden rounded-2xl bg-arctic-primary/80">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0"
                >
                  {activeTab === 'chart' && <CandlestickChart />}
                  {activeTab === 'bias' && <BiasDashboard />}
                  {activeTab === 'session' && <SessionView />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom feature row ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10"
        >
          {[
            {
              icon: <BarChart2 size={16} className="text-ice" />,
              title: 'Kein Rauschen, nur Signal',
              desc: 'Saubere Charts ohne Ablenkung — sofort einsatzbereit.',
            },
            {
              icon: <Activity size={16} className="text-profit" />,
              title: 'Order Flow in Echtzeit',
              desc: 'Delta, Absorption und Footprint — siehst du wer kauft und wer verkauft.',
            },
            {
              icon: <Layers size={16} className="text-ice-light" />,
              title: 'BIAS ueber alle Timeframes',
              desc: 'Wenn 5m, 15m und 1H uebereinstimmen — dann handelst du.',
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className={cn(
                'glass-card rounded-xl px-5 py-4',
                'flex items-start gap-3',
              )}
            >
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <div className="font-display text-sm font-semibold text-frost-white">
                  {title}
                </div>
                <div className="text-frost-muted text-sm mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export { ProductShowcase }
