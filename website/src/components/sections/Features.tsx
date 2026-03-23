'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'
import {
  LineChart,
  TrendingUp,
  Layers,
  Search,
  Clock,
  ShieldCheck,
} from 'lucide-react'

// ─── Micro-illustration: Candlestick bars ────────────────────────────────────

function CandlestickIllustration() {
  const bars = [
    { height: 28, wick: 8, bullish: false, delay: 0 },
    { height: 40, wick: 10, bullish: true, delay: 0.05 },
    { height: 22, wick: 6, bullish: false, delay: 0.1 },
    { height: 50, wick: 12, bullish: true, delay: 0.15 },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-6 top-6 flex items-end gap-1.5 opacity-[0.12]"
    >
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          {/* Upper wick */}
          <div
            className={cn(
              'w-px',
              bar.bullish ? 'bg-profit' : 'bg-loss'
            )}
            style={{ height: bar.wick }}
          />
          {/* Body */}
          <div
            className={cn(
              'w-3 rounded-sm',
              bar.bullish ? 'bg-profit' : 'bg-loss'
            )}
            style={{ height: bar.height }}
          />
          {/* Lower wick */}
          <div
            className={cn(
              'w-px',
              bar.bullish ? 'bg-profit' : 'bg-loss'
            )}
            style={{ height: bar.wick * 0.6 }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Micro-illustration: Gradient arrow ─────────────────────────────────────

function ArrowIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-4 opacity-[0.18]"
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="arrow-grad" x1="0" y1="80" x2="80" y2="0">
            <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0" />
            <stop offset="100%" stopColor="#5CB8F0" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M10 70 L70 10 M55 10 L70 10 L70 25"
          stroke="url(#arrow-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ─── Micro-illustration: Overlapping circles ────────────────────────────────

function ConfluenceIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-4 opacity-[0.15]"
    >
      <svg
        width="72"
        height="56"
        viewBox="0 0 72 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="28" r="20" fill="#5CB8F0" fillOpacity="0.5" />
        <circle cx="36" cy="16" r="20" fill="#7DD3FC" fillOpacity="0.4" />
        <circle cx="52" cy="28" r="20" fill="#5CB8F0" fillOpacity="0.45" />
      </svg>
    </div>
  )
}

// ─── Micro-illustration: Zigzag pattern ─────────────────────────────────────

function ZigzagIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-4 opacity-[0.15]"
    >
      <svg
        width="80"
        height="48"
        viewBox="0 0 80 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="0,36 16,12 32,32 48,8 64,28 80,14"
          stroke="#5CB8F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16" cy="12" r="3" fill="#5CB8F0" />
        <circle cx="48" cy="8" r="3" fill="#7DD3FC" />
        <circle cx="64" cy="28" r="3" fill="#5CB8F0" />
      </svg>
    </div>
  )
}

// ─── Micro-illustration: Timeline / session bar ──────────────────────────────

function TimelineIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-4 opacity-[0.15]"
    >
      <svg
        width="88"
        height="40"
        viewBox="0 0 88 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base line */}
        <line x1="4" y1="20" x2="84" y2="20" stroke="#5CB8F0" strokeWidth="2" strokeLinecap="round" />
        {/* Tick marks */}
        {[12, 24, 44, 56, 70].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={i % 2 === 0 ? 12 : 14}
            x2={x}
            y2={i % 2 === 0 ? 28 : 26}
            stroke="#5CB8F0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
        {/* Session highlight bar */}
        <rect x="24" y="15" width="32" height="10" rx="2" fill="#5CB8F0" fillOpacity="0.3" />
        {/* Endpoint dots */}
        <circle cx="4" cy="20" r="3" fill="#5CB8F0" />
        <circle cx="84" cy="20" r="3" fill="#5CB8F0" fillOpacity="0.5" />
      </svg>
    </div>
  )
}

// ─── Micro-illustration: Shield ─────────────────────────────────────────────

function ShieldIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-4 opacity-[0.13]"
    >
      <svg
        width="60"
        height="68"
        viewBox="0 0 60 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 4 L54 14 L54 34 C54 50 42 62 30 66 C18 62 6 50 6 34 L6 14 Z"
          stroke="#5CB8F0"
          strokeWidth="2"
          fill="#5CB8F0"
          fillOpacity="0.06"
          strokeLinejoin="round"
        />
        <polyline
          points="18,34 26,42 42,26"
          stroke="#5CB8F0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

// ─── Feature data ────────────────────────────────────────────────────────────

interface Feature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  illustration: React.ComponentType
  /** lg column span: 1 or 2 */
  colSpan: 1 | 2
  /** Accent top-border strip */
  accent?: boolean
}

const features: Feature[] = [
  {
    id: 'charts',
    icon: LineChart,
    title: 'Real-Time Charts',
    description:
      'Sub-second OHLCV streaming across 21 futures contracts. LightweightCharts rendering engine handles thousands of data points without frame loss. Direct exchange connectivity via Rithmic protocol.',
    illustration: CandlestickIllustration,
    colSpan: 2,
    accent: true,
  },
  {
    id: 'bias',
    icon: TrendingUp,
    title: 'BIAS Analysis',
    description:
      'Multi-factor directional bias computation across configurable timeframes. Synthesizes 7 independent signals including cumulative delta, session structure, and volume profile to produce a single directional score.',
    illustration: ArrowIllustration,
    colSpan: 1,
  },
  {
    id: 'confluence',
    icon: Layers,
    title: 'Confluence Scoring',
    description:
      'Weighted multi-factor scoring engine. Evaluates momentum, volume, VWAP position, session structure, pattern context, time-of-day, and volatility regime. Outputs a 0-100 conviction score.',
    illustration: ConfluenceIllustration,
    colSpan: 1,
  },
  {
    id: 'patterns',
    icon: Search,
    title: 'Pattern Detection',
    description:
      'Algorithmic recognition of engulfing bars, inside bars, exhaustion moves, and double-fake setups. Configurable sensitivity thresholds with real-time alerting.',
    illustration: ZigzagIllustration,
    colSpan: 2,
    accent: true,
  },
  {
    id: 'sessions',
    icon: Clock,
    title: 'Session Analytics',
    description:
      'Automatic detection of session boundaries across RTH, ETH, and overnight sessions. Tracks session high, low, range, VWAP, and POC with millisecond precision.',
    illustration: TimelineIllustration,
    colSpan: 1,
  },
  {
    id: 'risk',
    icon: ShieldCheck,
    title: 'Risk Framework',
    description:
      'Integrated position sizing, maximum loss enforcement, and exposure tracking. Risk parameters are visible in every analysis view — not buried in a settings menu.',
    illustration: ShieldIllustration,
    colSpan: 1,
  },
]

// ─── Feature Card ────────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: Feature
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon
  const Illustration = feature.illustration
  const isWide = feature.colSpan === 2

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'glass-card relative overflow-hidden rounded-2xl p-6 lg:p-8',
        'transition-transform duration-300 ease-out hover:-translate-y-0.5',
        isWide && 'lg:col-span-2',
      )}
      style={{ willChange: 'transform' }}
    >
      {/* Accent top border strip for featured cards */}
      {feature.accent && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 30%, rgba(92,184,240,0.8) 50%, rgba(92,184,240,0.6) 70%, transparent 100%)',
          }}
        />
      )}

      {/* Background radial glow on wide cards */}
      {isWide && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(92,184,240,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Decorative micro-illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Illustration />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon container */}
        <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.15)] p-3">
          <Icon className="size-5 text-ice" />
        </div>

        {/* Title */}
        <h3 className="mt-4 font-display text-xl font-semibold text-frost-white">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-frost-secondary">
          {feature.description}
        </p>

        {/* Subtle data-pill for wide cards */}
        {isWide && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-frost-border-subtle bg-[rgba(92,184,240,0.05)] px-3 py-1">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-ice"
              style={{ boxShadow: '0 0 6px rgba(92,184,240,0.8)' }}
            />
            <span className="text-xs font-medium text-frost-secondary">
              {index === 0 ? '21 markets \u00b7 <100ms latency' : '8 pattern types \u00b7 live detection'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Features Section ────────────────────────────────────────────────────────

export function Features() {
  return (
    <section id="features" className="section-padding relative">
      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: '800px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(92,184,240,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          className="mb-12 text-center lg:mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
            Analysis Modules
          </p>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            Six modules.
            <br />
            <span className="text-gradient-frost">One analysis framework.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-frost-secondary">
            Each module operates independently and feeds data to the others. The result is a unified analysis surface that adapts to current market conditions.
          </p>
        </motion.div>

        {/* ── Bento Grid ── */}
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
