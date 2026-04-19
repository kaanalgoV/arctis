'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { fadeInUp, viewportOnce } from '@/lib/animations'
import { Activity, Layers, Gauge, Zap, Brain } from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// Animated number that ticks from 0 → target once its parent enters view.
// ────────────────────────────────────────────────────────────────────────────

function TickNumber({
  target,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.6,
  formatThousands = false,
}: {
  target: number
  decimals?: number
  suffix?: string
  prefix?: string
  duration?: number
  formatThousands?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  const mv = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, target, { duration, ease: [0.2, 0.6, 0.2, 1] })
    const unsub = mv.on('change', (v) => {
      if (!ref.current) return
      const rounded = decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals))
      const formatted = formatThousands
        ? new Intl.NumberFormat('en-US').format(Math.round(rounded))
        : String(rounded)
      ref.current.textContent = `${prefix}${formatted}${suffix}`
    })
    return () => {
      controls.stop()
      unsub()
    }
  }, [inView, target, decimals, suffix, prefix, duration, formatThousands, mv])

  const initial =
    decimals === 0 ? `${prefix}0${suffix}` : `${prefix}${(0).toFixed(decimals)}${suffix}`
  return (
    <span ref={ref} className="tabular-nums">
      {initial}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Live Pipeline — stacked HUD with flowing data particles.
// Replaces the horizontal "dots crossing a line" diagram.
// ────────────────────────────────────────────────────────────────────────────

interface Stage {
  id: string
  label: string
  sub: string
  accent: string
  metric: string
  metricLabel: string
}

const PIPELINE_STAGES: Stage[] = [
  {
    id: 'ingest',
    label: 'Ingest',
    sub: '1m-Bars, Orderflow, Delta',
    accent: '#949DA8',
    metric: '5,460',
    metricLabel: 'Bars / Symbol / 14d',
  },
  {
    id: 'analyse',
    label: 'Analyse',
    sub: 'Swings · Zonen · VWAP · EMA · Velocity',
    accent: '#5AAED8',
    metric: '13',
    metricLabel: 'Indikator-Module parallel',
  },
  {
    id: 'confluence',
    label: 'Confluence',
    sub: '5 Faktoren → Score 0–5',
    accent: '#5CB8F0',
    metric: '≥ 3',
    metricLabel: 'Threshold für Signal',
  },
  {
    id: 'signal',
    label: 'Signal',
    sub: 'Entry · Stop · Target · R:R',
    accent: '#34D399',
    metric: '< 3',
    metricLabel: 'Bars bis Trigger',
  },
]

function LivePipeline() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-frost-border-subtle bg-arctic-primary/40 p-6 sm:p-8 backdrop-blur">
      <style>{`
        @keyframes pipelineGlide {
          0% { transform: translateY(-8%); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateY(108%); opacity: 0; }
        }
        @keyframes pipelinePulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes pipelineBar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative h-2 w-2 rounded-full bg-profit">
            <span className="absolute inset-0 animate-ping rounded-full bg-profit/60" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-frost-muted">
            Live Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] text-frost-muted/70">
          NQ / ES · 1m · RTH
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {PIPELINE_STAGES.map((stage, i) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative overflow-hidden rounded-xl border border-frost-border-subtle/60 bg-arctic-secondary/60 p-4"
          >
            {/* Flowing particles down the card */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
              style={{
                background: stage.accent,
                boxShadow: `0 0 10px ${stage.accent}`,
                animation: `pipelineGlide ${2.4 + i * 0.2}s linear ${i * 0.3}s infinite`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full opacity-60"
              style={{
                background: stage.accent,
                animation: `pipelineGlide ${2.4 + i * 0.2}s linear ${i * 0.3 + 0.9}s infinite`,
              }}
            />

            {/* Step index + label */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-semibold"
                  style={{
                    background: `${stage.accent}18`,
                    color: stage.accent,
                    border: `1px solid ${stage.accent}40`,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="font-display text-sm font-semibold"
                  style={{ color: stage.accent }}
                >
                  {stage.label}
                </span>
              </div>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: stage.accent,
                  boxShadow: `0 0 8px ${stage.accent}`,
                  animation: `pipelinePulse 2s ease-in-out ${i * 0.25}s infinite`,
                }}
              />
            </div>

            <p className="mt-1 text-[11px] leading-relaxed text-frost-muted">{stage.sub}</p>

            {/* Metric */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <span
                  className="font-display text-xl font-bold tabular-nums"
                  style={{ color: '#F0F6FC' }}
                >
                  {stage.metric}
                </span>
                <span className="ml-1.5 text-[10px] uppercase tracking-wider text-frost-muted/70">
                  {stage.metricLabel}
                </span>
              </div>
            </div>

            {/* Bottom progress bar */}
            <div className="mt-3 h-[3px] rounded-full bg-arctic-base/60 overflow-hidden">
              <div
                className="h-full origin-left"
                style={{
                  background: `linear-gradient(90deg, ${stage.accent}00, ${stage.accent})`,
                  animation: `pipelineBar 1s ease-out ${0.4 + i * 0.12}s both`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Backtest Fingerprint — the honest stats strip.
// Uses the real patterns.py numbers: 4,398 trades, Aug 2025 – March 2026.
// ────────────────────────────────────────────────────────────────────────────

function BacktestFingerprint() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative mt-6 overflow-hidden rounded-3xl border border-ice/20 bg-gradient-to-br from-ice/[0.04] via-arctic-secondary/70 to-arctic-secondary/90 p-6 sm:p-8"
    >
      {/* ice glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(92,184,240,0.25) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-ice" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ice">
              Kalibrierung
            </span>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-frost-white sm:text-2xl">
            Auf <TickNumber target={4398} formatThousands /> echten Trades kalibriert.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-frost-muted">
            NQ Futures, August 2025 – März 2026. Keine Demo, keine Cherry-Picks — jedes
            einzelne Signal mit Entry, Stop und Target, auf echten 1-Minuten-Bars.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
          {[
            { label: 'Handelstage', value: 158, suffix: '' },
            { label: 'Profitable Setups', value: 4, suffix: ' / 6' },
            { label: 'Top PF', value: 3.83, decimals: 2, suffix: 'x' },
            { label: 'Sample Größe', value: 1005, formatThousands: true, label2: '(größtes)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-frost-border-subtle/60 bg-arctic-base/40 p-3"
            >
              <div className="font-display text-xl font-bold text-frost-white">
                <TickNumber
                  target={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix || ''}
                  formatThousands={stat.formatThousands}
                />
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-frost-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Capability cards — new bento layout with sophisticated inline visuals.
// ────────────────────────────────────────────────────────────────────────────

function MarketStructureViz() {
  return (
    <svg viewBox="0 0 280 140" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="msArea2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[30, 60, 90].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="280"
          y2={y}
          stroke="rgba(92,184,240,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Area */}
      <polygon
        points="10,90 40,60 70,75 100,35 130,60 160,22 190,45 220,28 250,48 270,38 270,110 10,110"
        fill="url(#msArea2)"
      />
      {/* Price line */}
      <polyline
        points="10,90 40,60 70,75 100,35 130,60 160,22 190,45 220,28 250,48 270,38"
        fill="none"
        stroke="#5CB8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.5))' }}
      />
      {/* Swing highs/lows */}
      {[
        { x: 100, y: 35, color: '#34D399', label: 'HH' },
        { x: 160, y: 22, color: '#34D399', label: 'HH' },
        { x: 220, y: 28, color: '#34D399', label: 'HH' },
        { x: 70, y: 75, color: '#F87171', label: 'HL' },
        { x: 130, y: 60, color: '#F87171', label: 'HL' },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="3.5" fill={s.color} />
          <circle
            cx={s.x}
            cy={s.y}
            r="6"
            fill="none"
            stroke={s.color}
            strokeWidth="1"
            opacity="0.4"
          />
          <text
            x={s.x}
            y={s.y - 9}
            textAnchor="middle"
            fill={s.color}
            fontSize="7"
            fontFamily="monospace"
            fontWeight="600"
          >
            {s.label}
          </text>
        </g>
      ))}
      {/* BOS line */}
      <line
        x1="100"
        y1="35"
        x2="270"
        y2="35"
        stroke="#34D399"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.5"
      />
      <text
        x="260"
        y="30"
        fontSize="7"
        fill="#34D399"
        fontFamily="monospace"
        textAnchor="end"
      >
        BOS
      </text>
    </svg>
  )
}

function ConfluenceViz() {
  const factors = [
    { label: 'BIAS', value: 0.95, color: '#34D399' },
    { label: 'VOL', value: 0.88, color: '#34D399' },
    { label: 'STR', value: 0.76, color: '#5CB8F0' },
    { label: 'VEL', value: 0.62, color: '#5CB8F0' },
    { label: 'VWAP', value: 0.82, color: '#34D399' },
  ]
  return (
    <div className="flex h-full items-center gap-4 px-2">
      <div className="flex flex-col gap-2 flex-1">
        {factors.map((f, i) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="w-10 font-mono text-[10px] text-frost-muted">{f.label}</span>
            <div className="relative flex-1 h-[6px] rounded-full bg-arctic-base/60 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: f.color, boxShadow: `0 0 6px ${f.color}60` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${f.value * 100}%` }}
                viewport={viewportOnce}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-frost-secondary w-8 text-right">
              {Math.round(f.value * 5)}
            </span>
          </div>
        ))}
      </div>
      {/* Score ring */}
      <div className="relative flex shrink-0 h-20 w-20 items-center justify-center">
        <svg viewBox="0 0 80 80" className="absolute inset-0">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="5"
            fill="none"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="32"
            stroke="#34D399"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="201"
            initial={{ strokeDashoffset: 201 }}
            whileInView={{ strokeDashoffset: 201 * (1 - 4 / 5) }}
            viewport={viewportOnce}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            transform="rotate(-90 40 40)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.5))' }}
          />
        </svg>
        <div className="relative text-center">
          <div className="font-display text-2xl font-bold text-profit leading-none">4</div>
          <div className="font-mono text-[9px] text-frost-muted mt-0.5">/ 5</div>
        </div>
      </div>
    </div>
  )
}

function BiasStatesViz() {
  const states = [
    { label: 'SHORT', color: '#F87171', range: '−10 … −6' },
    { label: 'RANGE SHORT', color: '#FBBF24', range: '−5 … −2' },
    { label: 'RANGE', color: '#949DA8', range: '−1 … +1' },
    { label: 'RANGE LONG', color: '#7DD3FC', range: '+2 … +5' },
    { label: 'LONG', color: '#34D399', range: '+6 … +10' },
  ]
  const activeIdx = 3 // RANGE LONG
  return (
    <div className="flex h-full flex-col gap-1.5 justify-center">
      {states.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.35, delay: i * 0.08 }}
          className="group relative flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
          style={{
            background: i === activeIdx ? `${s.color}10` : 'transparent',
            border: i === activeIdx ? `1px solid ${s.color}40` : '1px solid transparent',
          }}
        >
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: s.color,
              boxShadow: i === activeIdx ? `0 0 8px ${s.color}` : 'none',
            }}
          />
          <span
            className="font-mono text-[11px] font-medium tracking-wide"
            style={{ color: i === activeIdx ? s.color : 'var(--color-text-muted)' }}
          >
            {s.label}
          </span>
          <span className="ml-auto font-mono text-[10px] text-frost-muted/80">{s.range}</span>
        </motion.div>
      ))}
    </div>
  )
}

interface Capability {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  kicker: string
  title: string
  description: string
  metric: string
  metricSub: string
  viz: React.ComponentType
  span: 'wide' | 'half' | 'quarter'
  accentTone: 'ice' | 'profit'
}

const CAPABILITIES: Capability[] = [
  {
    id: 'structure',
    icon: Activity,
    kicker: 'Marktstruktur',
    title: 'Swings, BOS und Struktur — automatisch.',
    description:
      'Swing Highs, Swing Lows, Trendrichtung und Structure-Breaks in Echtzeit. Du siehst sofort ob der Markt bullish, bearish oder in einer Range ist.',
    metric: '< 3',
    metricSub: 'Bars bis Trendwechsel-Erkennung',
    viz: MarketStructureViz,
    span: 'wide',
    accentTone: 'ice',
  },
  {
    id: 'confluence',
    icon: Layers,
    kicker: 'Confluence Engine',
    title: 'Fünf Faktoren — ein Score.',
    description:
      'BIAS, Volumen, Struktur, Velocity und VWAP werden zu einem Score von 0–5 verdichtet. Signale feuern erst ab Score 3.',
    metric: '68%',
    metricSub: 'Trefferquote bei Score ≥ 3',
    viz: ConfluenceViz,
    span: 'half',
    accentTone: 'profit',
  },
  {
    id: 'bias',
    icon: Gauge,
    kicker: 'BIAS Zustände',
    title: 'Fünf diskrete Marktlagen.',
    description:
      'Score −10 bis +10 in fünf saubere Zustände übersetzt. Du handelst nicht „Long oder Short" — du handelst den passenden Zustand.',
    metric: '5',
    metricSub: 'Zustände · klar abgegrenzt',
    viz: BiasStatesViz,
    span: 'half',
    accentTone: 'ice',
  },
]

function CapabilityCard({ cap }: { cap: Capability }) {
  const Icon = cap.icon
  const Viz = cap.viz
  const accentHex = cap.accentTone === 'profit' ? '#34D399' : '#5CB8F0'

  return (
    <motion.div
      variants={fadeInUp}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-frost-border-subtle/70 bg-arctic-secondary/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-ice/30 ${
        cap.span === 'wide' ? 'lg:col-span-2' : ''
      }`}
    >
      {/* Accent edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentHex}80 50%, transparent 100%)`,
        }}
      />

      {/* Ambient glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 30% 0%, ${accentHex}12 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: `${accentHex}15`,
              border: `1px solid ${accentHex}30`,
            }}
          >
            <Icon size={14} className="" style={{ color: accentHex }} />
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accentHex }}
          >
            {cap.kicker}
          </span>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl font-bold leading-none text-frost-white">
            {cap.metric}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-frost-muted">
            {cap.metricSub}
          </div>
        </div>
      </div>

      <h3 className="relative z-10 mt-4 font-display text-lg font-semibold leading-tight text-frost-white sm:text-xl">
        {cap.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-frost-muted">
        {cap.description}
      </p>

      {/* Illustration */}
      <div className="relative z-10 mt-5 min-h-[140px] flex-1 rounded-2xl border border-frost-border-subtle/50 bg-arctic-primary/40 p-3">
        <Viz />
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main section
// ────────────────────────────────────────────────────────────────────────────

export function EngineShowcase() {
  return (
    <section id="engine" className="section-padding relative">
      {/* Ambient radial glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(92,184,240,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          className="mb-10 flex flex-col items-center gap-4 text-center lg:mb-14"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-frost-border-subtle bg-arctic-secondary/60 px-3 py-1">
            <Zap size={12} className="text-ice" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-secondary">
              Engine
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            Was Arctis sieht,
            <br />
            <span className="text-gradient-frost">bevor du es siehst.</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-frost-muted">
            Vier Stufen, dreizehn Indikator-Module, ein Score. Die Engine läuft still im
            Hintergrund — du siehst nur das Ergebnis: Entry, Stop, Target.
          </p>
        </motion.div>

        {/* Live pipeline */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LivePipeline />
        </motion.div>

        {/* Calibration fingerprint strip */}
        <BacktestFingerprint />

        {/* Capability bento */}
        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {CAPABILITIES.map((cap) => (
            <CapabilityCard key={cap.id} cap={cap} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
