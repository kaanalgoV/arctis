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
    { height: 36, wick: 10, bullish: false, delay: 0 },
    { height: 52, wick: 14, bullish: true, delay: 0.05 },
    { height: 28, wick: 8, bullish: false, delay: 0.1 },
    { height: 60, wick: 16, bullish: true, delay: 0.15 },
    { height: 44, wick: 12, bullish: true, delay: 0.2 },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-6 top-6 flex items-end gap-2 opacity-[0.35]"
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
      className="pointer-events-none absolute right-4 top-4 opacity-[0.4]"
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
      className="pointer-events-none absolute right-4 top-4 opacity-[0.35]"
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
      className="pointer-events-none absolute right-4 top-4 opacity-[0.35]"
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
      className="pointer-events-none absolute right-4 top-4 opacity-[0.35]"
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
      className="pointer-events-none absolute right-4 top-4 opacity-[0.3]"
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
    title: 'Dein Chart. Sauber und klar.',
    description:
      'ES und NQ in Echtzeit mit Volumenprofil, VWAP und EMA auf einem Screen. Trader sparen durchschnittlich 28 Minuten Pre-Market, weil sie nicht zwischen 5 Tabs wechseln müssen.',
    illustration: CandlestickIllustration,
    colSpan: 2,
    accent: true,
  },
  {
    id: 'bias',
    icon: TrendingUp,
    title: 'Welche Seite handelst du heute?',
    description:
      'Arctis berechnet einen Bias-Score von -10 bis +10 aus 7 Faktoren: Overnight-Flow, Globex-Range, VWAP-Lage, Delta, EMA-Slope, Volumen-Trend und Struktur. Über +5 = Long, unter -5 = Short. Um 0 = Finger weg.',
    illustration: ArrowIllustration,
    colSpan: 1,
  },
  {
    id: 'confluence',
    icon: Layers,
    title: 'Nur handeln wenn alles stimmt.',
    description:
      'Confluence misst ob VWAP, EMA, Struktur, Volume und Bias in die gleiche Richtung zeigen. Score über 70 bedeutet ca. 68% Trefferquote historisch. Unter 30? Kein Trade — und das allein spart die meisten Blow-Ups.',
    illustration: ConfluenceIllustration,
    colSpan: 1,
  },
  {
    id: 'patterns',
    icon: Search,
    title: 'Setups die du sonst verpasst.',
    description:
      'ORB Breakout, IB Extension, POC Rejection, VA Edge — automatisch erkannt mit berechnetem Entry, Stop und Target. Durchschnittliches R:R von 3.2 bei gefilterter Confluence. Du siehst den Trade, nicht nur das Muster.',
    illustration: ZigzagIllustration,
    colSpan: 2,
    accent: true,
  },
  {
    id: 'sessions',
    icon: Clock,
    title: 'Wisse wo du in der Session stehst.',
    description:
      'Pre-Market, NY Open, Midday, Power Hour — jede Phase hat eigene Volatilitätsmuster. Arctis zeigt dir welche Session aktiv ist, wie sie historisch performt hat und ob die aktuelle Bewegung typisch oder anomal ist.',
    illustration: TimelineIllustration,
    colSpan: 1,
  },
  {
    id: 'risk',
    icon: ShieldCheck,
    title: 'Nie wieder den Daily-Loss sprengen.',
    description:
      'Max 3 Trades pro Tag, Max Loss bei -$300, Position Size automatisch berechnet. Funded-Trader berichten: Drawdown halbiert sich im ersten Monat. Disziplin ist kein Vorsatz mehr, sondern ein eingebautes Limit.',
    illustration: ShieldIllustration,
    colSpan: 1,
  },
]

// ─── Hero Feature (first feature - big showcase) ────────────────────────────

function HeroFeature({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  const Illustration = feature.illustration

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card relative overflow-hidden rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-0.5"
      style={{ willChange: 'transform' }}
    >
      {/* Accent top border strip */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 30%, rgba(92,184,240,0.8) 50%, rgba(92,184,240,0.6) 70%, transparent 100%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(92,184,240,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:gap-12 p-8 lg:p-12">
        {/* Left: Content */}
        <div className="flex-1 lg:max-w-lg">
          <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.15)] p-3.5">
            <Icon className="size-6 text-ice" />
          </div>

          <h3 className="mt-5 font-display text-2xl font-semibold text-frost-white lg:text-3xl">
            {feature.title}
          </h3>

          <p className="mt-3 text-base leading-relaxed text-frost-secondary">
            {feature.description}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-frost-border-subtle bg-[rgba(92,184,240,0.05)] px-3 py-1">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-ice"
              style={{ boxShadow: '0 0 6px rgba(92,184,240,0.8)' }}
            />
            <span className="text-xs font-medium text-frost-secondary">
              ES & NQ &middot; Echtzeit
            </span>
          </div>
        </div>

        {/* Right: Illustration */}
        <motion.div
          className="mt-8 lg:mt-0 flex-1"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="relative">
            <Illustration />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Alternating Feature Row (left-right / right-left) ──────────────────────

function AlternatingFeature({ feature, index, reversed }: { feature: Feature; index: number; reversed: boolean }) {
  const Icon = feature.icon
  const Illustration = feature.illustration

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card relative overflow-hidden rounded-2xl p-6 lg:p-8 transition-transform duration-300 ease-out hover:-translate-y-0.5"
      style={{ willChange: 'transform' }}
    >
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

      <div className={cn(
        'relative z-10 flex flex-col gap-6',
        reversed ? 'lg:flex-row-reverse' : 'lg:flex-row',
        'lg:items-center lg:gap-8'
      )}>
        {/* Text side */}
        <div className="flex-1">
          <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.15)] p-3">
            <Icon className="size-5 text-ice" />
          </div>

          <h3 className="mt-4 font-display text-xl font-semibold text-frost-white">
            {feature.title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-frost-secondary">
            {feature.description}
          </p>

          {feature.colSpan === 2 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-frost-border-subtle bg-[rgba(92,184,240,0.05)] px-3 py-1">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-ice"
                style={{ boxShadow: '0 0 6px rgba(92,184,240,0.8)' }}
              />
              <span className="text-xs font-medium text-frost-secondary">
                ORB &middot; IB &middot; POC &middot; VA &middot; Live Detection
              </span>
            </div>
          )}
        </div>

        {/* Illustration side */}
        <motion.div
          className="flex-shrink-0 lg:w-2/5"
          initial={{ opacity: 0, x: reversed ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Illustration />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Compact Feature Card (for pair of smaller features) ────────────────────

function CompactFeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  const Illustration = feature.illustration

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card relative overflow-hidden rounded-2xl p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5"
      style={{ willChange: 'transform' }}
    >
      <motion.div
        className="absolute right-4 top-4"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Illustration />
      </motion.div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.15)] p-3">
          <Icon className="size-5 text-ice" />
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold text-frost-white">
          {feature.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-frost-secondary">
          {feature.description}
        </p>
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
          className="mb-12 lg:mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
            Analysis Modules
          </p>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            6 Werkzeuge. Ein Ziel:
            <br />
            <span className="text-gradient-frost">Dein Profit.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-frost-secondary">
            Jedes Modul beantwortet eine Frage die du dir vor jedem Trade stellen solltest.
          </p>
        </motion.div>

        {/* ── Varied layout — not a uniform grid ── */}
        <motion.div
          className="flex flex-col gap-4 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {/* 1. Hero showcase — Charts (full width, side-by-side) */}
          <HeroFeature feature={features[0]} />

          {/* 2-3. Two cards side by side — alternating direction */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <AlternatingFeature feature={features[1]} index={1} reversed={false} />
            <AlternatingFeature feature={features[2]} index={2} reversed={true} />
          </div>

          {/* 4. Full-width alternating — Setups (image left, text right) */}
          <AlternatingFeature feature={features[3]} index={3} reversed={false} />

          {/* 5-6. Two compact cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            <CompactFeatureCard feature={features[4]} />
            <CompactFeatureCard feature={features[5]} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
