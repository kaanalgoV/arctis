'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Download, ChevronDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  heroTextReveal,
  heroImageReveal,
  fadeInUp,
  staggerContainer,
  staggerItem,
  blurReveal,
} from '@/lib/animations'
import { FrostParticles } from '@/components/effects/FrostParticles'

// ─── Candlestick data — 30 candles, realistic NQ-like uptrend with pullbacks ──

// Price values are in a 0–220 range for SVG coordinates
const CANDLES = [
  // Initial base / accumulation
  { open: 38, close: 52, high: 56, low: 34, bull: true },
  { open: 52, close: 44, high: 55, low: 41, bull: false },
  { open: 44, close: 58, high: 62, low: 41, bull: true },
  { open: 58, close: 50, high: 61, low: 47, bull: false },
  { open: 50, close: 66, high: 70, low: 48, bull: true },
  // First leg up
  { open: 66, close: 80, high: 84, low: 64, bull: true },
  { open: 80, close: 72, high: 83, low: 69, bull: false },
  { open: 72, close: 88, high: 93, low: 70, bull: true },
  { open: 88, close: 94, high: 98, low: 85, bull: true },
  { open: 94, close: 84, high: 96, low: 81, bull: false },
  // Shallow pullback
  { open: 84, close: 78, high: 86, low: 75, bull: false },
  { open: 78, close: 92, high: 96, low: 76, bull: true },
  { open: 92, close: 86, high: 94, low: 83, bull: false },
  // Second leg up
  { open: 86, close: 104, high: 109, low: 84, bull: true },
  { open: 104, close: 112, high: 116, low: 101, bull: true },
  { open: 112, close: 100, high: 114, low: 97, bull: false },
  { open: 100, close: 118, high: 123, low: 98, bull: true },
  { open: 118, close: 108, high: 120, low: 105, bull: false },
  { open: 108, close: 126, high: 131, low: 106, bull: true },
  { open: 126, close: 120, high: 128, low: 117, bull: false },
  // Strong continuation
  { open: 120, close: 138, high: 143, low: 118, bull: true },
  { open: 138, close: 144, high: 148, low: 135, bull: true },
  { open: 144, close: 132, high: 146, low: 129, bull: false },
  { open: 132, close: 128, high: 134, low: 125, bull: false },
  // Final push to high
  { open: 128, close: 150, high: 155, low: 126, bull: true },
  { open: 150, close: 158, high: 162, low: 147, bull: true },
  { open: 158, close: 148, high: 160, low: 145, bull: false },
  { open: 148, close: 164, high: 169, low: 146, bull: true },
  { open: 164, close: 172, high: 176, low: 161, bull: true },
  // Last candle — slight pullback, still bullish structure
  { open: 172, close: 166, high: 174, low: 163, bull: false },
]

// Volume heights (relative, 0–1)
const VOLUMES = [
  0.35, 0.28, 0.42, 0.31, 0.55,
  0.72, 0.48, 0.65, 0.80, 0.44,
  0.38, 0.61, 0.40, 0.88, 0.75,
  0.52, 0.82, 0.46, 0.79, 0.41,
  0.90, 0.84, 0.56, 0.50, 0.94,
  0.86, 0.60, 0.91, 0.88, 0.52,
]

const CHART_H = 148
const CHART_MAX = 185   // slightly above highest high for padding
const CHART_MIN = 20    // slightly below lowest low

// EMA-like smooth path through the midpoints of each candle (simplified)
const EMA_POINTS = [
  45, 49, 51, 55, 58,
  66, 70, 76, 85, 86,
  82, 84, 86, 94, 105,
  104, 110, 112, 118, 120,
  128, 136, 138, 133, 138,
  148, 151, 154, 162, 166,
]

function CandlestickChart() {
  const CANDLE_W = 9
  const CANDLE_GAP = 3
  const STEP = CANDLE_W + CANDLE_GAP
  const totalW = CANDLES.length * STEP - CANDLE_GAP

  const scaleY = (val: number) => {
    const range = CHART_MAX - CHART_MIN
    return CHART_H - ((val - CHART_MIN) / range) * CHART_H
  }

  // Build smooth EMA SVG path
  const emaPath = EMA_POINTS.reduce((path, val, i) => {
    const x = i * STEP + CANDLE_W / 2
    const y = scaleY(val)
    if (i === 0) return `M ${x} ${y}`
    const prev = i > 0 ? EMA_POINTS[i - 1] : val
    const prevX = (i - 1) * STEP + CANDLE_W / 2
    const prevY = scaleY(prev)
    const cx1 = prevX + STEP * 0.5
    const cx2 = x - STEP * 0.5
    return `${path} C ${cx1} ${prevY}, ${cx2} ${y}, ${x} ${y}`
  }, '')

  return (
    <svg
      viewBox={`0 0 ${totalW} ${CHART_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: CHART_H }}
      aria-hidden="true"
    >
      {/* Horizontal grid lines at 20%, 40%, 60%, 80% */}
      {[0.2, 0.4, 0.6, 0.8].map((frac) => (
        <line
          key={frac}
          x1="0"
          y1={CHART_H * frac}
          x2={totalW}
          y2={CHART_H * frac}
          stroke="rgba(92,184,240,0.04)"
          strokeWidth="1"
        />
      ))}

      {/* EMA line — ice color, subtle */}
      <path
        d={emaPath}
        fill="none"
        stroke="rgba(92,184,240,0.30)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Demand zone highlight */}
      <rect
        x={0}
        y={scaleY(105)}
        width={totalW}
        height={scaleY(88) - scaleY(105)}
        fill="rgba(92,184,240,0.025)"
      />
      <line
        x1="0"
        y1={scaleY(105)}
        x2={totalW}
        y2={scaleY(105)}
        stroke="rgba(92,184,240,0.12)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />

      {/* Candles */}
      {CANDLES.map((c, i) => {
        const x = i * STEP
        const cx = x + CANDLE_W / 2
        const color = c.bull ? '#34D399' : '#F87171'
        const bodyTop = scaleY(Math.max(c.open, c.close))
        const bodyBot = scaleY(Math.min(c.open, c.close))
        const bodyH = Math.max(1.5, bodyBot - bodyTop)
        const wickTop = scaleY(c.high)
        const wickBot = scaleY(c.low)
        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={cx}
              y1={wickTop}
              x2={cx}
              y2={wickBot}
              stroke={color}
              strokeWidth="0.8"
              opacity="0.55"
            />
            {/* Body */}
            <rect
              x={x}
              y={bodyTop}
              width={CANDLE_W}
              height={bodyH}
              rx="1.5"
              fill={color}
              opacity={c.bull ? 0.82 : 0.72}
            />
          </g>
        )
      })}

      {/* Last price marker line */}
      <line
        x1="0"
        y1={scaleY(166)}
        x2={totalW}
        y2={scaleY(166)}
        stroke="rgba(52,211,153,0.35)"
        strokeWidth="0.6"
        strokeDasharray="3 3"
      />
    </svg>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const bgLayerY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const particlesY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, 80])

  return (
    <section
      ref={containerRef}
      className={cn(
        'noise-overlay relative flex min-h-screen flex-col items-center justify-center overflow-hidden',
        'bg-arctic-base pt-24 pb-16',
      )}
    >
      {/* ── Gradient atmosphere (parallax 0.1x) ─────────────────── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0, y: bgLayerY }}
      >
        {/* Top-left bloom */}
        <div
          className="absolute"
          style={{
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 20% 15%, rgba(92,184,240,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Bottom-right accent */}
        <div
          className="absolute"
          style={{
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 50% at 80% 85%, rgba(92,184,240,0.05) 0%, transparent 50%)',
          }}
        />
        {/* Center halo */}
        <div
          className="absolute"
          style={{
            inset: 0,
            background:
              'radial-gradient(ellipse 50% 40% at 50% 42%, rgba(92,184,240,0.03) 0%, transparent 55%)',
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(92,184,240,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(92,184,240,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </motion.div>

      {/* ── Frost particles (parallax 0.15x) ────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, y: particlesY }}
      >
        <FrostParticles />
      </motion.div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl px-6 text-center" style={{ zIndex: 2 }}>
        {/* Badge */}
        <motion.div
          variants={blurReveal}
          initial="hidden"
          animate="visible"
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#272F3A] bg-[rgba(15,19,24,0.8)] px-4 py-2 backdrop-blur-xl"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-ice"
            style={{
              boxShadow: '0 0 6px rgba(92,184,240,0.8)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          <span className="font-sans text-sm font-medium tracking-wide text-frost-secondary">
            Institutional-Grade Analysis Infrastructure
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={heroTextReveal}
          initial="hidden"
          animate="visible"
          className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl xl:text-8xl"
        >
          <span className="text-frost-white block">Market Intelligence,</span>
          <span className="text-gradient-frost block">Engineered.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="font-sans mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-frost-secondary sm:text-xl"
        >
          Real-time analysis infrastructure for futures markets. Pattern detection, directional bias, and confluence scoring — delivered in under 50 milliseconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button
            variants={staggerItem}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'font-display group relative flex cursor-pointer items-center gap-2.5 overflow-hidden',
              'rounded-xl bg-ice px-8 py-4 text-lg font-semibold text-arctic-base',
              'transition-all duration-200 hover:bg-ice-light',
            )}
            style={{ boxShadow: '0 0 0 0 transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 60px rgba(92,184,240,0.2), 0 0 120px rgba(92,184,240,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 transparent'
            }}
          >
            {/* shimmer overlay */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            <Download size={18} strokeWidth={2.2} />
            Download Arctis
            <ArrowRight
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </motion.button>

          <motion.button
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'font-display group flex cursor-pointer items-center gap-2.5',
              'rounded-xl border border-[#353D48] px-8 py-4 text-lg font-medium text-frost-white',
              'transition-all duration-200 hover:border-[rgba(92,184,240,0.3)]',
              'hover:bg-[rgba(92,184,240,0.08)] hover:text-ice-light',
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current opacity-70 transition-opacity duration-200 group-hover:opacity-100">
              <ArrowRight size={12} strokeWidth={2.5} />
            </span>
            View Documentation
          </motion.button>
        </motion.div>

        {/* Trust line */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.55 }}
          className="font-sans mt-6 text-sm text-frost-muted"
        >
          Free tier available&nbsp;&mdash;&nbsp;No credit card required&nbsp;&mdash;&nbsp;macOS and Windows
        </motion.p>
      </div>

      {/* ── Dashboard mockup ────────────────────────────────────── */}
      <motion.div
        variants={heroImageReveal}
        initial="hidden"
        animate="visible"
        className="relative z-10 mt-16 w-full max-w-4xl px-6"
        style={{ zIndex: 2 }}
      >
        <motion.div style={{ y: dashboardY }}>
          {/* Glow halo behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(92,184,240,0.08) 0%, transparent 70%)',
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />

          <div
            className={cn(
              'glass-card group relative overflow-hidden rounded-2xl',
              'shadow-[0_20px_80px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]',
              'transition-shadow duration-500 hover:shadow-[0_24px_100px_rgba(0,0,0,0.65),0_0_60px_rgba(92,184,240,0.06),inset_0_1px_0_rgba(255,255,255,0.05)]',
            )}
          >
            {/* ── Browser chrome top bar ── */}
            <div
              className="flex items-center gap-3 border-b border-[#1E2530] px-4 py-2"
              style={{ background: 'rgba(10,13,18,0.85)' }}
            >
              {/* Traffic lights — smaller, more muted */}
              <div className="flex items-center gap-[5px] shrink-0">
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#BF4B47', opacity: 0.85 }} />
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#A68528', opacity: 0.85 }} />
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#1E8C35', opacity: 0.85 }} />
              </div>
              {/* URL bar */}
              <div
                className="flex flex-1 items-center rounded-md px-3 py-[3px]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  maxWidth: 240,
                }}
              >
                <span className="font-mono text-[10px] tracking-tight" style={{ color: 'rgba(140,160,180,0.6)' }}>
                  arctis://analysis/<span style={{ color: 'rgba(140,160,180,0.9)' }}>NQ</span>
                </span>
              </div>
              {/* Right side: price + live badge */}
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-medium text-frost-muted">NQH5</span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: '#34D399' }}>
                    21,847.25
                  </span>
                  <TrendingUp size={11} style={{ color: '#34D399' }} strokeWidth={2.5} />
                  <span className="font-mono text-[10px]" style={{ color: '#34D399' }}>
                    +1.34%
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded border border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.06)] px-2 py-0.5">
                  <span
                    className="h-[5px] w-[5px] rounded-full"
                    style={{
                      background: '#34D399',
                      boxShadow: '0 0 4px rgba(52,211,153,0.9)',
                      animation: 'pulse-glow 1.5s ease-in-out infinite',
                    }}
                  />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#34D399]">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* ── Timeframe + indicator toolbar ── */}
            <div
              className="flex items-center border-b border-[#1E2530] px-4 py-[5px]"
              style={{ background: 'rgba(8,11,16,0.6)' }}
            >
              <div className="flex items-center gap-px">
                {['1m', '5m', '15m', '1H', '4H', 'D'].map((tf, i) => (
                  <button
                    key={tf}
                    className={cn(
                      'font-mono rounded px-2 py-[3px] text-[10px] transition-colors duration-100',
                      i === 2
                        ? 'bg-[rgba(92,184,240,0.14)] text-ice'
                        : 'text-frost-muted hover:text-frost-secondary',
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div
                className="mx-4 h-3 w-px self-center"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
              <div className="flex items-center gap-3">
                {['EMA', 'VWAP', 'BIAS', 'CVD'].map((ind, i) => (
                  <span
                    key={ind}
                    className="font-mono text-[9px] uppercase tracking-[0.1em]"
                    style={{ color: i === 2 ? 'rgba(92,184,240,0.7)' : 'rgba(140,160,180,0.35)' }}
                  >
                    {ind}
                  </span>
                ))}
              </div>
              <div className="ml-auto font-mono text-[9px]" style={{ color: 'rgba(140,160,180,0.3)' }}>
                09:30 — 12:00 ET
              </div>
            </div>

            {/* ── Main chart area + right sidebar ── */}
            <div className="flex" style={{ background: 'rgba(6,9,14,0.7)' }}>
              {/* Y-axis price scale */}
              <div
                className="flex shrink-0 flex-col justify-between border-r border-[#1E2530] py-3 pr-2 pl-3"
                style={{ width: 52 }}
              >
                {['21,870', '21,848', '21,826', '21,804', '21,782'].map((p, i) => (
                  <span
                    key={p}
                    className="font-mono leading-none"
                    style={{
                      fontSize: '9px',
                      color: i === 1 ? 'rgba(52,211,153,0.8)' : 'rgba(140,160,180,0.4)',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Chart + demand zone label */}
              <div className="relative flex-1 px-2 py-3">
                <CandlestickChart />

                {/* Current price label at ~top-right of chart */}
                <div
                  className="absolute right-3 flex items-center gap-1"
                  style={{ top: '14%' }}
                >
                  <div
                    className="h-px w-8"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5))' }}
                  />
                  <span
                    className="font-mono rounded px-1.5 py-[2px] text-[9px] font-bold"
                    style={{
                      background: 'rgba(52,211,153,0.12)',
                      color: '#34D399',
                      border: '1px solid rgba(52,211,153,0.2)',
                    }}
                  >
                    21,847
                  </span>
                </div>

                {/* Demand zone label */}
                <div
                  className="pointer-events-none absolute right-3"
                  style={{ top: '52%' }}
                >
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(92,184,240,0.4)' }}
                  >
                    DEMAND
                  </span>
                </div>

                {/* X-axis time labels */}
                <div className="mt-1 flex justify-between px-1">
                  {['09:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
                    <span
                      key={t}
                      className="font-mono"
                      style={{ fontSize: '8px', color: 'rgba(140,160,180,0.35)' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Right sidebar ── */}
              <div
                className="flex shrink-0 flex-col justify-between border-l border-[#1E2530] px-2 py-3"
                style={{ width: 44 }}
              >
                {/* DELTA */}
                <div className="flex flex-col gap-1">
                  <span
                    className="font-mono text-center uppercase tracking-[0.08em]"
                    style={{ fontSize: '8px', color: 'rgba(140,160,180,0.4)' }}
                  >
                    DELTA
                  </span>
                  <div
                    className="overflow-hidden rounded-sm"
                    style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{ width: '68%', background: 'rgba(52,211,153,0.7)' }}
                    />
                  </div>
                  <span
                    className="font-mono text-center"
                    style={{ fontSize: '9px', color: 'rgba(52,211,153,0.75)' }}
                  >
                    +2.4k
                  </span>
                </div>

                {/* VOL */}
                <div className="flex flex-col gap-1">
                  <span
                    className="font-mono text-center uppercase tracking-[0.08em]"
                    style={{ fontSize: '8px', color: 'rgba(140,160,180,0.4)' }}
                  >
                    VOL
                  </span>
                  <div
                    className="overflow-hidden rounded-sm"
                    style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{ width: '84%', background: 'rgba(92,184,240,0.65)' }}
                    />
                  </div>
                  <span
                    className="font-mono text-center"
                    style={{ fontSize: '9px', color: 'rgba(92,184,240,0.7)' }}
                  >
                    18.4k
                  </span>
                </div>

                {/* CVD */}
                <div className="flex flex-col gap-1">
                  <span
                    className="font-mono text-center uppercase tracking-[0.08em]"
                    style={{ fontSize: '8px', color: 'rgba(140,160,180,0.4)' }}
                  >
                    CVD
                  </span>
                  {/* Mini sparkline for CVD */}
                  <svg viewBox="0 0 36 14" className="w-full" style={{ height: 14 }} aria-hidden="true">
                    <polyline
                      points="0,12 6,10 12,8 18,9 24,5 30,3 36,2"
                      fill="none"
                      stroke="rgba(92,184,240,0.55)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="font-mono text-center"
                    style={{ fontSize: '9px', color: 'rgba(92,184,240,0.7)' }}
                  >
                    +847
                  </span>
                </div>
              </div>
            </div>

            {/* ── Volume strip ── */}
            <div
              className="flex items-end gap-[2px] border-t border-[#1E2530] px-3 py-1.5"
              style={{ height: 28, background: 'rgba(6,9,14,0.7)' }}
            >
              <div
                className="mr-1.5 shrink-0 self-end font-mono pb-0.5 uppercase tracking-[0.1em]"
                style={{ fontSize: '8px', color: 'rgba(140,160,180,0.3)' }}
              >
                VOL
              </div>
              {VOLUMES.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[1px]"
                  style={{
                    height: `${Math.round(v * 16) + 2}px`,
                    background: CANDLES[i].bull
                      ? 'rgba(52,211,153,0.25)'
                      : 'rgba(248,113,113,0.22)',
                  }}
                />
              ))}
            </div>

            {/* ── Analysis indicator strip ── */}
            <div
              className="flex items-center gap-3 border-t border-[#1E2530] px-4 py-2"
              style={{ background: 'rgba(8,11,16,0.9)' }}
            >
              {/* BIAS: LONG */}
              <div className="flex items-center gap-1.5">
                <span
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: '#34D399', boxShadow: '0 0 5px rgba(52,211,153,0.7)' }}
                />
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.06em]"
                  style={{ color: '#34D399' }}
                >
                  BIAS: LONG
                </span>
              </div>

              <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* CONF: 87 */}
              <div className="flex items-center gap-1.5">
                <span
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: 'rgba(140,160,180,0.5)' }}
                >
                  CONF:
                </span>
                <div
                  className="overflow-hidden rounded-full"
                  style={{ width: 40, height: 3, background: 'rgba(92,184,240,0.12)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: '87%', background: 'rgba(92,184,240,0.7)', boxShadow: '0 0 4px rgba(92,184,240,0.4)' }}
                  />
                </div>
                <span
                  className="font-mono text-[10px] font-bold tracking-[0.04em]"
                  style={{ color: 'rgba(92,184,240,0.85)' }}
                >
                  87
                </span>
              </div>

              <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* PAT: 3 */}
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: 'rgba(140,160,180,0.5)' }}
                >
                  PAT:
                </span>
                <span
                  className="font-mono rounded px-1 text-[9px] font-bold"
                  style={{
                    background: 'rgba(251,191,36,0.1)',
                    color: 'rgba(251,191,36,0.8)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    lineHeight: '14px',
                  }}
                >
                  3
                </span>
              </div>

              <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* LAT: 12ms */}
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: 'rgba(140,160,180,0.5)' }}
                >
                  LAT:
                </span>
                <span
                  className="font-mono text-[10px] font-semibold"
                  style={{ color: 'rgba(140,160,180,0.75)' }}
                >
                  12ms
                </span>
              </div>

              <div
                className="ml-auto font-mono text-[9px]"
                style={{ color: 'rgba(140,160,180,0.28)' }}
              >
                0.3s ago
              </div>
            </div>
          </div>

          {/* Mirror reflection beneath the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none mx-auto"
            style={{
              width: '88%',
              height: 40,
              marginTop: 1,
              background:
                'linear-gradient(180deg, rgba(92,184,240,0.05) 0%, transparent 100%)',
              borderRadius: '0 0 16px 16px',
              opacity: 0.55,
              filter: 'blur(4px)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ zIndex: 10 }}
      >
        <ChevronDown
          size={22}
          className="text-frost-muted"
          style={{ animation: 'float 2.4s ease-in-out infinite' }}
        />
      </motion.div>
    </section>
  )
}
