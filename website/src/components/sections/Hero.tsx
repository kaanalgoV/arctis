'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, LogIn, ChevronDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  heroWordContainer,
  heroWord,
  heroImageReveal,
  fadeInUp,
  staggerContainer,
  staggerItem,
  blurReveal,
} from '@/lib/animations'
import { FrostParticles } from '@/components/effects/FrostParticles'
import { HeroAppMockup } from '@/components/sections/HeroAppMockup'

// ─── Precomputed tick marks for crystal SVG (avoids hydration mismatch) ──
const TICK_MARKS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 15 * Math.PI) / 180
  const r1 = 58, r2 = 54
  return {
    x1: +(70 + r1 * Math.cos(angle)).toFixed(4),
    y1: +(70 + r1 * Math.sin(angle)).toFixed(4),
    x2: +(70 + r2 * Math.cos(angle)).toFixed(4),
    y2: +(70 + r2 * Math.sin(angle)).toFixed(4),
    sw: i % 6 === 0 ? '0.8' : '0.3',
    op: i % 6 === 0 ? '0.3' : '0.12',
  }
})

// ─── Candlestick data — 40 candles, realistic NQ-like uptrend with pullbacks ──

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
  // Last candle — slight pullback
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
const CHART_MAX = 185
const CHART_MIN = 20

// EMA-like smooth path through the midpoints
const EMA_POINTS = [
  45, 49, 51, 55, 58,
  66, 70, 76, 85, 86,
  82, 84, 86, 94, 105,
  104, 110, 112, 118, 120,
  128, 136, 138, 133, 138,
  148, 151, 154, 162, 166,
]

// VWAP line — slightly different from EMA, converges in ranges
const VWAP_POINTS = [
  46, 47, 50, 52, 56,
  62, 67, 74, 82, 84,
  83, 85, 87, 92, 100,
  102, 106, 109, 114, 117,
  124, 130, 135, 132, 136,
  144, 149, 152, 158, 162,
]

// Session separator indices (where new sessions start)
const SESSION_BREAKS = [10, 20]

function CandlestickChart() {
  const CANDLE_W = 9
  const CANDLE_GAP = 3
  const STEP = CANDLE_W + CANDLE_GAP
  const totalW = CANDLES.length * STEP - CANDLE_GAP
  const VOL_H = 28

  const scaleY = (val: number) => {
    const range = CHART_MAX - CHART_MIN
    return CHART_H - ((val - CHART_MIN) / range) * CHART_H
  }

  // Build smooth path for a set of data points
  const buildPath = (points: number[]) =>
    points.reduce((path, val, i) => {
      const x = i * STEP + CANDLE_W / 2
      const y = scaleY(val)
      if (i === 0) return `M ${x} ${y}`
      const prevY = scaleY(points[i - 1])
      const prevX = (i - 1) * STEP + CANDLE_W / 2
      const cx1 = prevX + STEP * 0.5
      const cx2 = x - STEP * 0.5
      return `${path} C ${cx1} ${prevY}, ${cx2} ${y}, ${x} ${y}`
    }, '')

  const emaPath = buildPath(EMA_POINTS)
  const vwapPath = buildPath(VWAP_POINTS)

  // Supply and demand zone bands
  const demandZoneTop = 105
  const demandZoneBot = 88
  const supplyZoneTop = 170
  const supplyZoneBot = 155

  return (
    <svg
      viewBox={`0 0 ${totalW} ${CHART_H + VOL_H + 6}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: CHART_H + VOL_H + 6 }}
      aria-hidden="true"
    >
      <defs>
        {/* Gradient for demand zone */}
        <linearGradient id="demandZoneGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(92,184,240,0.06)" />
          <stop offset="100%" stopColor="rgba(92,184,240,0.01)" />
        </linearGradient>
        {/* Gradient for supply zone */}
        <linearGradient id="supplyZoneGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(248,113,113,0.01)" />
          <stop offset="100%" stopColor="rgba(248,113,113,0.05)" />
        </linearGradient>
        {/* Candle fade-in mask */}
        <clipPath id="chartArea">
          <rect x="0" y="0" width={totalW} height={CHART_H} />
        </clipPath>
      </defs>

      {/* ── Grid lines at 20%, 40%, 60%, 80% ── */}
      {[0.2, 0.4, 0.6, 0.8].map((frac, i) => (
        <line
          key={frac}
          x1="0"
          y1={CHART_H * frac}
          x2={totalW}
          y2={CHART_H * frac}
          stroke="rgba(92,184,240,0.05)"
          strokeWidth="1"
          style={{ animation: `gridPulse 5s ease-in-out ${i * 0.5}s infinite` }}
        />
      ))}

      {/* ── Session separators ── */}
      {SESSION_BREAKS.map((idx) => {
        const x = idx * STEP - CANDLE_GAP / 2
        return (
          <g key={`session-${idx}`}>
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={CHART_H + VOL_H + 6}
              stroke="rgba(92,184,240,0.08)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            {/* Session label */}
            <text
              x={x + 4}
              y={8}
              fill="rgba(92,184,240,0.18)"
              fontSize="6"
              fontFamily="monospace"
            >
              SESSION
            </text>
          </g>
        )
      })}

      {/* ── Supply zone (resistance) ── */}
      <rect
        x={0}
        y={scaleY(supplyZoneTop)}
        width={totalW}
        height={scaleY(supplyZoneBot) - scaleY(supplyZoneTop)}
        fill="url(#supplyZoneGrad)"
        style={{ animation: 'zoneFlicker 4s ease-in-out infinite' }}
      />
      <line
        x1="0"
        y1={scaleY(supplyZoneTop)}
        x2={totalW}
        y2={scaleY(supplyZoneTop)}
        stroke="rgba(248,113,113,0.1)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />
      <line
        x1="0"
        y1={scaleY(supplyZoneBot)}
        x2={totalW}
        y2={scaleY(supplyZoneBot)}
        stroke="rgba(248,113,113,0.08)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />

      {/* ── Demand zone (support) ── */}
      <rect
        x={0}
        y={scaleY(demandZoneTop)}
        width={totalW}
        height={scaleY(demandZoneBot) - scaleY(demandZoneTop)}
        fill="url(#demandZoneGrad)"
        style={{ animation: 'zoneFlicker 4s ease-in-out 2s infinite' }}
      />
      <line
        x1="0"
        y1={scaleY(demandZoneTop)}
        x2={totalW}
        y2={scaleY(demandZoneTop)}
        stroke="rgba(92,184,240,0.12)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />
      <line
        x1="0"
        y1={scaleY(demandZoneBot)}
        x2={totalW}
        y2={scaleY(demandZoneBot)}
        stroke="rgba(92,184,240,0.08)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />

      {/* ── VWAP line — purple-tinted with draw animation + glow ── */}
      <path
        d={vwapPath}
        fill="none"
        stroke="rgba(168,130,240,0.45)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="300"
        style={{
          animation: 'drawLine 2s ease-out 0.8s both',
          filter: 'drop-shadow(0 0 3px rgba(168,130,240,0.3))',
        }}
      />

      {/* ── EMA line — ice color with draw animation + glow ── */}
      <path
        d={emaPath}
        fill="none"
        stroke="rgba(92,184,240,0.45)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="300"
        style={{
          animation: 'drawLine 2.2s ease-out 0.6s both',
          filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.3))',
        }}
      />

      {/* ── Candlesticks with staggered build-up animation ── */}
      <g clipPath="url(#chartArea)">
        {CANDLES.map((c, i) => {
          const x = i * STEP
          const cx = x + CANDLE_W / 2
          const color = c.bull ? '#34D399' : '#F87171'
          const bodyTop = scaleY(Math.max(c.open, c.close))
          const bodyBot = scaleY(Math.min(c.open, c.close))
          const bodyH = Math.max(1.5, bodyBot - bodyTop)
          const wickTop = scaleY(c.high)
          const wickBot = scaleY(c.low)
          const isLivePulse = i >= CANDLES.length - 4
          const staggerDelay = 0.3 + i * 0.05
          return (
            <g
              key={i}
              style={{
                transformOrigin: `${cx}px ${CHART_H}px`,
                animation: isLivePulse
                  ? `candleBuild 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${staggerDelay}s both, candlePulse 3s ease-in-out ${i * 0.3}s infinite`
                  : `candleBuild 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${staggerDelay}s both`,
              }}
            >
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
                opacity={c.bull ? 0.88 : 0.75}
                style={isLivePulse && c.bull ? { filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.4))' } : undefined}
              />
            </g>
          )
        })}
      </g>

      {/* ── Volume bars at bottom ── */}
      <g transform={`translate(0, ${CHART_H + 4})`}>
        {/* Volume separator line */}
        <line
          x1="0"
          y1="0"
          x2={totalW}
          y2="0"
          stroke="rgba(92,184,240,0.06)"
          strokeWidth="0.5"
        />
        {VOLUMES.map((v, i) => {
          const x = i * STEP
          const h = Math.round(v * (VOL_H - 4)) + 2
          const color = CANDLES[i].bull
            ? 'rgba(52,211,153,0.30)'
            : 'rgba(248,113,113,0.25)'
          return (
            <rect
              key={i}
              x={x}
              y={VOL_H - h}
              width={CANDLE_W}
              height={h}
              rx="1"
              fill={color}
              style={{
                animation: `candleFadeIn 0.2s ease-out ${0.8 + i * 0.03}s both`,
              }}
            />
          )
        })}
      </g>

      {/* ── Last price marker line ── */}
      <line
        x1="0"
        y1={scaleY(166)}
        x2={totalW}
        y2={scaleY(166)}
        stroke="rgba(52,211,153,0.35)"
        strokeWidth="0.6"
        strokeDasharray="3 3"
      />

      {/* ── Live price pulsing indicator (last candle) ── */}
      <circle
        cx={29 * STEP + CANDLE_W / 2}
        cy={scaleY(166)}
        r="3"
        fill="#34D399"
        opacity="0.9"
        style={{
          animation: 'liveDot 1.5s ease-in-out infinite',
          filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.8))',
        }}
      />
      <circle
        cx={29 * STEP + CANDLE_W / 2}
        cy={scaleY(166)}
        r="6"
        fill="none"
        stroke="#34D399"
        strokeWidth="0.8"
        opacity="0.4"
        style={{
          animation: 'liveDot 1.5s ease-in-out 0.3s infinite',
        }}
      />
      <circle
        cx={29 * STEP + CANDLE_W / 2}
        cy={scaleY(166)}
        r="10"
        fill="none"
        stroke="#34D399"
        strokeWidth="0.4"
        opacity="0.15"
        style={{
          animation: 'liveDot 1.5s ease-in-out 0.6s infinite',
        }}
      />
      {/* ── Blinking live dot next to last candle ── */}
      <circle
        cx={29 * STEP + CANDLE_W + 6}
        cy={scaleY(CANDLES[CANDLES.length - 1].close)}
        r="2"
        fill="#34D399"
        style={{
          animation: 'liveDot 1.5s ease-in-out infinite',
          filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.8))',
        }}
      />

      {/* ── Signal arrow indicator — bullish signal on candle 24 (demand zone bounce) ── */}
      <g>
        {/* Signal arrow with pop animation */}
        <g
          style={{
            transformOrigin: `${24 * STEP + CANDLE_W / 2}px ${scaleY(125)}px`,
            animation: 'signalPop 0.5s cubic-bezier(0.25,0.46,0.45,0.94) 2.2s both',
          }}
        >
          <polygon
            points={`${24 * STEP + CANDLE_W / 2 - 5},${scaleY(120)} ${24 * STEP + CANDLE_W / 2 + 5},${scaleY(120)} ${24 * STEP + CANDLE_W / 2},${scaleY(132)}`}
            fill="#34D399"
            opacity="0.85"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.6))',
            }}
          />
          {/* Signal label */}
          <text
            x={24 * STEP + CANDLE_W / 2}
            y={scaleY(116)}
            fill="#34D399"
            fontSize="5"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            LONG
          </text>
        </g>

        {/* Entry line — fades in after signal */}
        <line
          x1={24 * STEP}
          y1={scaleY(128)}
          x2={29 * STEP + CANDLE_W}
          y2={scaleY(128)}
          stroke="rgba(92,184,240,0.35)"
          strokeWidth="0.8"
          strokeDasharray="120"
          style={{
            animation: 'drawLine 1.2s ease-out 2.6s both',
          }}
        />
        {/* Entry label */}
        <text
          x={29 * STEP + CANDLE_W + 3}
          y={scaleY(128) + 3}
          fill="rgba(92,184,240,0.5)"
          fontSize="5"
          fontFamily="monospace"
          style={{ animation: 'profitCount 0.4s ease-out 3.2s both' }}
        >
          ENTRY
        </text>

        {/* Stop loss line */}
        <line
          x1={24 * STEP}
          y1={scaleY(115)}
          x2={29 * STEP + CANDLE_W}
          y2={scaleY(115)}
          stroke="rgba(248,113,113,0.25)"
          strokeWidth="0.6"
          strokeDasharray="120"
          style={{
            animation: 'drawLine 1s ease-out 2.8s both',
          }}
        />
        {/* SL label */}
        <text
          x={29 * STEP + CANDLE_W + 3}
          y={scaleY(115) + 3}
          fill="rgba(248,113,113,0.4)"
          fontSize="5"
          fontFamily="monospace"
          style={{ animation: 'profitCount 0.4s ease-out 3.4s both' }}
        >
          SL
        </text>

        {/* Target line */}
        <line
          x1={24 * STEP}
          y1={scaleY(165)}
          x2={29 * STEP + CANDLE_W}
          y2={scaleY(165)}
          stroke="rgba(52,211,153,0.30)"
          strokeWidth="0.8"
          strokeDasharray="120"
          style={{
            animation: 'drawLine 1s ease-out 3.0s both',
          }}
        />
        {/* TP label */}
        <text
          x={29 * STEP + CANDLE_W + 3}
          y={scaleY(165) + 3}
          fill="rgba(52,211,153,0.5)"
          fontSize="5"
          fontFamily="monospace"
          style={{ animation: 'profitCount 0.4s ease-out 3.6s both' }}
        >
          TP1
        </text>

        {/* Profit indicator — counting up badge */}
        <g style={{ animation: 'profitCount 0.6s ease-out 3.8s both' }}>
          <rect
            x={27 * STEP}
            y={scaleY(172)}
            width="36"
            height="14"
            rx="3"
            fill="rgba(52,211,153,0.15)"
            stroke="rgba(52,211,153,0.3)"
            strokeWidth="0.5"
          />
          <text
            x={27 * STEP + 18}
            y={scaleY(172) + 10}
            fill="#34D399"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
            style={{ animation: 'profitGlow 2s ease-in-out 4.2s infinite' }}
          >
            +3.2R
          </text>
        </g>
      </g>
    </svg>
  )
}

// ─── Word-by-word animated text line ─────────────────────

function AnimatedWords({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const words = text.split(' ')
  return (
    <motion.span
      variants={heroWordContainer}
      initial="hidden"
      animate="visible"
      className={cn('block', className)}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={heroWord}
          className="inline-block"
          style={{ marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
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
      {/* ── Candle fade-in keyframes + Crystal glow ── */}
      <style>{`
        @keyframes candleFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes candleBuild {
          0% { transform: scaleY(0); opacity: 0; }
          60% { transform: scaleY(1.05); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes candlePulse {
          0%, 100% { opacity: 0.75; filter: drop-shadow(0 0 0 transparent); }
          50% { opacity: 1; filter: drop-shadow(0 0 4px rgba(52,211,153,0.3)); }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes lineReveal {
          from { stroke-dashoffset: 100%; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes signalPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes profitCount {
          from { opacity: 0; transform: translateY(6px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes profitGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(52,211,153,0.5)); }
          50% { filter: drop-shadow(0 0 14px rgba(52,211,153,0.9)); }
        }
        @keyframes zoneFlicker {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
        @keyframes crystalRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crystalGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(92,184,240,0.4)) drop-shadow(0 0 60px rgba(92,184,240,0.15)); }
          50% { filter: drop-shadow(0 0 35px rgba(92,184,240,0.7)) drop-shadow(0 0 100px rgba(92,184,240,0.25)); }
        }
        @keyframes crystalFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes crystalCenterPulse {
          0%, 100% { opacity: 0.7; r: 1.8; }
          50% { opacity: 1; r: 2.5; }
        }
        @keyframes crystalOuterRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crystalSparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes crystalShockwave {
          0% { transform: scale(0.3); opacity: 0.8; }
          60% { opacity: 0.3; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes crystalEntranceSpin {
          0% { transform: rotate(-180deg) scale(0); opacity: 0; }
          40% { transform: rotate(20deg) scale(1.15); opacity: 1; }
          60% { transform: rotate(-8deg) scale(0.95); }
          80% { transform: rotate(3deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes crystalRayPulse {
          0%, 100% { opacity: 0.15; transform: scaleY(1); }
          50% { opacity: 0.4; transform: scaleY(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      {/* ── Gradient atmosphere (parallax 0.1x) ── */}
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
        {/* Grid lines — subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              radial-gradient(circle 1px, rgba(92,184,240,1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Cross-hatch grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(92,184,240,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(92,184,240,1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </motion.div>

      {/* ── Frost particles (parallax 0.15x) ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, y: particlesY }}
      >
        <FrostParticles />
      </motion.div>

      {/* ── Main content ── */}
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
            Von Prop-Tradern für Prop-Trader
          </span>
        </motion.div>

        {/* ── Large Arctis Crystal — dramatic entrance with shockwave ── */}
        <div
          className="relative mb-8 flex justify-center"
          style={{ width: 140, height: 140, margin: '0 auto 2rem' }}
        >
          {/* Shockwave ring — expands outward on load */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 80,
              height: 80,
              border: '2px solid rgba(92,184,240,0.6)',
              animation: 'crystalShockwave 1.2s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s forwards',
              opacity: 0,
            }}
          />
          {/* Second shockwave — delayed */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 80,
              height: 80,
              border: '1px solid rgba(92,184,240,0.35)',
              animation: 'crystalShockwave 1.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.5s forwards',
              opacity: 0,
            }}
          />

          {/* Ambient glow behind crystal */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(92,184,240,0.12) 0%, rgba(92,184,240,0.04) 40%, transparent 70%)',
              animation: 'crystalGlow 3s ease-in-out infinite',
            }}
          />

          {/* Layer 1: Outer rings — counter-rotating */}
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="absolute inset-0"
            style={{ animation: 'crystalOuterRotate 30s linear infinite' }}
          >
            <circle cx="70" cy="70" r="68" stroke="#5CB8F0" strokeWidth="0.3" fill="none" opacity="0.08" />
            <circle cx="70" cy="70" r="62" stroke="#5CB8F0" strokeWidth="0.4" fill="none" opacity="0.12" strokeDasharray="3 8" />
            {/* Tick marks around the ring — precomputed to avoid hydration mismatch */}
            {TICK_MARKS.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#5CB8F0"
                strokeWidth={t.sw}
                opacity={t.op}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Layer 2: Inner crystal — entrance spin + glow */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'crystalEntranceSpin 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
          >
            <div style={{ animation: 'crystalFloat 4s ease-in-out infinite' }}>
              <div style={{ animation: 'crystalGlow 3s ease-in-out infinite' }}>
                <svg
                  width="90"
                  height="90"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={{ animation: 'crystalRotate 50s linear infinite' }}
                >
                  <defs>
                    <radialGradient id="crystalCenter" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Center glow fill */}
                  <circle cx="14" cy="14" r="6" fill="url(#crystalCenter)" />
                  {/* Vertical axis */}
                  <line x1="14" y1="1" x2="14" y2="27" stroke="#5CB8F0" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                  {/* Horizontal axis */}
                  <line x1="1" y1="14" x2="27" y2="14" stroke="#5CB8F0" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                  {/* Diagonal axes */}
                  <line x1="5" y1="5" x2="23" y2="23" stroke="#5CB8F0" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
                  <line x1="23" y1="5" x2="5" y2="23" stroke="#5CB8F0" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
                  {/* Inner hexagonal ring */}
                  <circle cx="14" cy="14" r="4" stroke="#5CB8F0" strokeWidth="1" fill="none" opacity="0.8" />
                  {/* Secondary ring */}
                  <circle cx="14" cy="14" r="7.5" stroke="#5CB8F0" strokeWidth="0.5" fill="none" opacity="0.3" strokeDasharray="2 3" />
                  {/* Branch tips — vertical */}
                  <line x1="14" y1="1" x2="10.5" y2="5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="14" y1="1" x2="17.5" y2="5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="14" y1="27" x2="10.5" y2="23" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="14" y1="27" x2="17.5" y2="23" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  {/* Branch tips — horizontal */}
                  <line x1="1" y1="14" x2="5" y2="10.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="1" y1="14" x2="5" y2="17.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="27" y1="14" x2="23" y2="10.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  <line x1="27" y1="14" x2="23" y2="17.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                  {/* Outer ring */}
                  <circle cx="14" cy="14" r="12.5" stroke="#5CB8F0" strokeWidth="0.6" fill="none" opacity="0.2" />
                  {/* Center bright dot */}
                  <circle cx="14" cy="14" r="2" fill="#5CB8F0" opacity="0.95" style={{ animation: 'crystalCenterPulse 2.5s ease-in-out infinite' }} />
                  <circle cx="14" cy="14" r="1" fill="#ffffff" opacity="0.85" />
                  {/* Tiny accent dots on axis tips */}
                  <circle cx="14" cy="1" r="0.8" fill="#5CB8F0" opacity="0.5" />
                  <circle cx="27" cy="14" r="0.8" fill="#5CB8F0" opacity="0.5" />
                  <circle cx="14" cy="27" r="0.8" fill="#5CB8F0" opacity="0.4" />
                  <circle cx="1" cy="14" r="0.8" fill="#5CB8F0" opacity="0.4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Layer 3: Sparkle particles — bigger, more visible */}
          {[
            { x: 4, y: 10, size: 3, delay: 0 },
            { x: 130, y: 20, size: 2, delay: 1.2 },
            { x: 10, y: 120, size: 2.5, delay: 2.5 },
            { x: 125, y: 115, size: 2, delay: 3.8 },
            { x: 70, y: 0, size: 2.5, delay: 1.8 },
            { x: 70, y: 135, size: 2, delay: 4.2 },
            { x: 0, y: 70, size: 2, delay: 0.8 },
            { x: 138, y: 70, size: 2.5, delay: 3.0 },
          ].map((spark, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: spark.x,
                top: spark.y,
                width: spark.size,
                height: spark.size,
                background: '#5CB8F0',
                boxShadow: '0 0 6px rgba(92,184,240,0.9), 0 0 12px rgba(92,184,240,0.4)',
                animation: `crystalSparkle 2.5s ease-in-out ${spark.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Headline — editorial typography with varied weights */}
        <h1 className="font-display mb-6 leading-[1.05] tracking-tight">
          <AnimatedWords
            text="Wisse welche Seite"
            className="text-frost-white text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-light"
          />
          <AnimatedWords
            text="du handelst."
            className="text-frost-white text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold"
          />
          <span className="block h-2 sm:h-3" />
          <AnimatedWords
            text="Bevor die Glocke läutet."
            className="text-gradient-frost text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-medium italic"
          />
        </h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="font-sans mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-frost-secondary sm:text-xl"
        >
          Arctis analysiert NQ und ES in Echtzeit — BIAS, Confluence, Setups — und sagt dir genau: Entry, Stop, Target. In 14 Minuten bist du bereit für den Trade.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.a
            href="http://localhost:5174/login"
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
            <LogIn size={18} strokeWidth={2.2} />
            Jetzt starten
            <ArrowRight
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </motion.a>

        </motion.div>

        {/* Trust line — more prominent */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.55 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            'Kostenlos testen',
            'Web App',
            'Deine Daten bleiben lokal',
          ].map((text, i) => (
            <span key={i} className="flex items-center gap-2 font-sans text-sm text-frost-muted">
              <span
                className="h-1 w-1 rounded-full bg-ice/40"
              />
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Dashboard — animated app mockup ── */}
      <motion.div
        variants={heroImageReveal}
        initial="hidden"
        animate="visible"
        className="relative z-10 mt-16 w-full max-w-5xl px-6"
        style={{ zIndex: 2 }}
      >
        <motion.div style={{ y: dashboardY }}>
          {/* Glow halo behind the mockup */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(92,184,240,0.08) 0%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: -1,
            }}
          />

          <HeroAppMockup />

          {/* Bottom reflection glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none mx-auto"
            style={{
              width: '88%',
              height: 40,
              marginTop: 1,
              background: 'linear-gradient(180deg, rgba(92,184,240,0.05) 0%, transparent 100%)',
              borderRadius: '0 0 16px 16px',
              opacity: 0.55,
              filter: 'blur(4px)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
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
