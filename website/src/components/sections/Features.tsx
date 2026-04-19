'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  Layers,
  Search,
  Clock,
  ShieldCheck,
  LineChart,
  Gauge,
  Target,
  Repeat,
  Flame,
  Crosshair,
  BarChart3,
} from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────────
// Animated counter — same helper as EngineShowcase
// ────────────────────────────────────────────────────────────────────────────

function TickNumber({
  target,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.4,
}: {
  target: number
  decimals?: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  const mv = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, target, { duration, ease: [0.2, 0.6, 0.2, 1] })
    const unsub = mv.on('change', (v) => {
      if (!ref.current) return
      const rounded = decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals))
      ref.current.textContent = `${prefix}${rounded}${suffix}`
    })
    return () => {
      controls.stop()
      unsub()
    }
  }, [inView, target, decimals, suffix, prefix, duration, mv])

  const initial =
    decimals === 0 ? `${prefix}0${suffix}` : `${prefix}${(0).toFixed(decimals)}${suffix}`
  return <span ref={ref} className="tabular-nums">{initial}</span>
}

// ────────────────────────────────────────────────────────────────────────────
// Setup definitions — the full 7 signals + 2 patterns currently in the engine.
// Stats from engine/src/arctis/analysis/patterns.py (4,398 trade backtest).
// ────────────────────────────────────────────────────────────────────────────

type Tone = 'profit' | 'ice' | 'warning'

interface SetupRow {
  id: string
  name: string
  kind: 'Setup' | 'Pattern'
  direction: 'long' | 'short' | 'both'
  winRate: number | null
  profitFactor: number | null
  sample: number | null
  rr: number | null
  short: string
  tone: Tone
}

const SETUPS: SetupRow[] = [
  {
    id: 'orb',
    name: 'ORB Breakout',
    kind: 'Setup',
    direction: 'both',
    winRate: 75,
    profitFactor: 4.27,
    sample: 12,
    rr: 2.0,
    short: 'Opening-Range Ausbruch',
    tone: 'profit',
  },
  {
    id: 'mbo',
    name: 'MBO Confluence',
    kind: 'Setup',
    direction: 'both',
    winRate: 40.4,
    profitFactor: 1.59,
    sample: 1005,
    rr: 1.82,
    short: 'Multi-BIAS Confluence',
    tone: 'ice',
  },
  {
    id: 'daily',
    name: 'Daily Breakout',
    kind: 'Setup',
    direction: 'both',
    winRate: 48.4,
    profitFactor: 1.62,
    sample: 188,
    rr: 1.71,
    short: 'Ausbruch über PDH/PDL',
    tone: 'ice',
  },
  {
    id: 'poc',
    name: 'POC Rejection',
    kind: 'Setup',
    direction: 'both',
    winRate: null,
    profitFactor: null,
    sample: null,
    rr: 2.0,
    short: 'Ablehnung am Volume POC',
    tone: 'ice',
  },
  {
    id: 'vwap',
    name: 'VWAP Mean Reversion',
    kind: 'Setup',
    direction: 'both',
    winRate: 60.6,
    profitFactor: 2.11,
    sample: 33,
    rr: 1.0,
    short: 'Rückkehr zur Session-VWAP',
    tone: 'profit',
  },
  {
    id: 'session',
    name: 'Session Fade',
    kind: 'Setup',
    direction: 'both',
    winRate: null,
    profitFactor: null,
    sample: null,
    rr: 1.5,
    short: 'Exhaustion am Session-Ende',
    tone: 'ice',
  },
  {
    id: 'sammel',
    name: 'Sammelzonen-Ausbruch',
    kind: 'Setup',
    direction: 'both',
    winRate: null,
    profitFactor: null,
    sample: null,
    rr: 1.8,
    short: 'Range-Ausbruch nach Kompression',
    tone: 'ice',
  },
  {
    id: 'double',
    name: 'Double Fake',
    kind: 'Pattern',
    direction: 'both',
    winRate: 45.8,
    profitFactor: 1.74,
    sample: 48,
    rr: 1.98,
    short: 'Doppelter Fake-Breakout',
    tone: 'profit',
  },
  {
    id: 'opening',
    name: 'Opening Fake',
    kind: 'Pattern',
    direction: 'both',
    winRate: 16.0,
    profitFactor: 3.83,
    sample: 50,
    rr: 6.72,
    short: 'Opening-Range Fake (Extreme R:R)',
    tone: 'warning',
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Setup table — compact, dense, information-rich.
// ────────────────────────────────────────────────────────────────────────────

function toneToClasses(tone: Tone) {
  switch (tone) {
    case 'profit':
      return { text: 'text-profit', bg: 'bg-profit/10', border: 'border-profit/30' }
    case 'warning':
      return {
        text: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/30',
      }
    default:
      return { text: 'text-ice', bg: 'bg-ice/10', border: 'border-ice/30' }
  }
}

function SetupTable() {
  return (
    <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair size={14} className="text-ice" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ice">
              Setups &amp; Patterns
            </span>
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold text-frost-white sm:text-2xl">
            Sieben Setups, zwei Patterns.
            <span className="text-gradient-frost"> Jedes auf echten Trades kalibriert.</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-frost-muted">
          <span className="inline-flex h-2 w-2 rounded-full bg-profit" aria-hidden="true" />
          profitabel
          <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-ice" aria-hidden="true" />
          verifiziert
          <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
          high-R (selten)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-frost-border-subtle/70">
              <th className="py-3 pl-2 text-left font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                Setup
              </th>
              <th className="py-3 text-left font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                Typ
              </th>
              <th className="py-3 text-right font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                Win-Rate
              </th>
              <th className="py-3 text-right font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                Profit Factor
              </th>
              <th className="py-3 text-right font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                R:R
              </th>
              <th className="py-3 pr-2 text-right font-mono text-[10px] uppercase tracking-wider text-frost-muted">
                Sample
              </th>
            </tr>
          </thead>
          <tbody>
            {SETUPS.map((s, i) => {
              const tc = toneToClasses(s.tone)
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group border-b border-frost-border-subtle/30 transition-colors hover:bg-ice/[0.02]"
                >
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', tc.bg.replace('/10', ''))}
                        style={{
                          boxShadow:
                            s.tone === 'profit'
                              ? '0 0 8px rgba(52,211,153,0.6)'
                              : s.tone === 'warning'
                                ? '0 0 8px rgba(251,191,36,0.5)'
                                : '0 0 8px rgba(92,184,240,0.5)',
                        }}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="font-display font-semibold text-frost-white">
                          {s.name}
                        </div>
                        <div className="font-mono text-[10px] text-frost-muted/70">
                          {s.short}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                        s.kind === 'Pattern'
                          ? 'border-warning/30 bg-warning/5 text-warning'
                          : 'border-ice/20 bg-ice/5 text-ice',
                      )}
                    >
                      {s.kind}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-frost-secondary">
                    {s.winRate != null ? (
                      <span className={tc.text}>{s.winRate.toFixed(1)}%</span>
                    ) : (
                      <span className="text-frost-muted/50">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">
                    {s.profitFactor != null ? (
                      <span className={cn('font-semibold', tc.text)}>
                        {s.profitFactor.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-frost-muted/50">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-frost-secondary">
                    {s.rr != null ? s.rr.toFixed(2) : '—'}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono text-[11px] tabular-nums text-frost-muted">
                    {s.sample != null
                      ? s.sample.toLocaleString('en-US')
                      : 'live-only'}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-frost-border-subtle/60 bg-arctic-base/40 p-4">
        <p className="text-xs leading-relaxed text-frost-muted">
          <span className="font-semibold text-frost-white">Quelle:</span>{' '}
          Arctis-Backtest auf NQ-Futures (NQH6/NQZ5), August 2025 – März 2026.{' '}
          Gesamt-Sample <TickNumber target={4398} suffix="" />{' '}
          Trades über alle Setups. „live-only" = Setup läuft produktiv, aber das
          größere 8-Monats-Sample war zum Kalibrierungs-Zeitpunkt noch nicht erreicht.
        </p>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Capability feature cards — what the engine DOES (not the individual setups).
// Keeps the six bento-style blocks Sara liked, but with fresh visuals.
// ────────────────────────────────────────────────────────────────────────────

function ChartPreview() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="cp1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Mini candles */}
      {[
        { x: 10, o: 65, c: 55, h: 50, l: 70, bull: true },
        { x: 25, o: 55, c: 60, h: 52, l: 65, bull: false },
        { x: 40, o: 60, c: 42, h: 40, l: 62, bull: true },
        { x: 55, o: 42, c: 52, h: 40, l: 58, bull: false },
        { x: 70, o: 52, c: 38, h: 35, l: 55, bull: true },
        { x: 85, o: 38, c: 45, h: 32, l: 50, bull: false },
        { x: 100, o: 45, c: 28, h: 25, l: 48, bull: true },
        { x: 115, o: 28, c: 35, h: 22, l: 40, bull: false },
        { x: 130, o: 35, c: 20, h: 18, l: 38, bull: true },
        { x: 145, o: 20, c: 30, h: 15, l: 35, bull: false },
        { x: 160, o: 30, c: 15, h: 12, l: 32, bull: true },
      ].map((c, i) => (
        <g key={i}>
          <line
            x1={c.x}
            y1={c.h}
            x2={c.x}
            y2={c.l}
            stroke={c.bull ? '#34D399' : '#F87171'}
            strokeWidth="1"
            opacity="0.6"
          />
          <rect
            x={c.x - 4}
            y={Math.min(c.o, c.c)}
            width="8"
            height={Math.abs(c.o - c.c) || 1.5}
            fill={c.bull ? '#34D399' : '#F87171'}
            opacity="0.85"
            rx="1"
          />
        </g>
      ))}
      {/* VWAP dashed */}
      <polyline
        points="8,64 60,55 110,42 160,28 210,18"
        fill="none"
        stroke="#5CB8F0"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      {/* Volume profile right edge */}
      {[10, 20, 45, 35, 30, 50, 28, 15].map((w, i) => (
        <rect
          key={i}
          x={210 - w}
          y={20 + i * 8}
          width={w}
          height="5"
          fill="#5CB8F0"
          opacity={0.18 + (w / 100)}
          rx="1"
        />
      ))}
    </svg>
  )
}

function GaugePreview() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <svg viewBox="0 0 140 80" className="w-full max-w-[180px]" aria-hidden="true">
        <path
          d="M10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d="M10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="189"
          initial={{ strokeDashoffset: 189 }}
          whileInView={{ strokeDashoffset: 189 * (1 - 0.73) }}
          viewport={viewportOnce}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <motion.g
          initial={{ rotate: -90, opacity: 0 }}
          whileInView={{ rotate: 45, opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: '70px 70px' }}
        >
          <line
            x1="70"
            y1="70"
            x2="70"
            y2="20"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="70" cy="70" r="4" fill="#fff" />
        </motion.g>
        <text
          x="70"
          y="60"
          textAnchor="middle"
          fill="#34D399"
          fontSize="9"
          fontWeight="700"
          fontFamily="Space Grotesk"
        >
          LONG
        </text>
        <text
          x="70"
          y="73"
          textAnchor="middle"
          fill="#F0F6FC"
          fontSize="13"
          fontWeight="700"
          fontFamily="Space Grotesk"
        >
          +6
        </text>
      </svg>
    </div>
  )
}

function ConfluenceRing() {
  const score = 4
  const max = 5
  return (
    <div className="flex h-full items-center justify-center gap-5">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-[110px] w-[110px]" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            fill="none"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke="#34D399"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="251"
            initial={{ strokeDashoffset: 251 }}
            whileInView={{ strokeDashoffset: 251 * (1 - score / max) }}
            viewport={viewportOnce}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.45))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-profit">{score}</span>
          <span className="font-mono text-[9px] text-frost-muted">/ {max}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {['BIAS', 'VOL', 'STR', 'VEL', 'VWAP'].map((l, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="flex items-center gap-2"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: i < score ? '#34D399' : 'rgba(255,255,255,0.2)' }}
            />
            <span className="font-mono text-[11px] text-frost-muted">{l}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SessionTimeline() {
  const phases = [
    { label: 'Pre', pct: 17, color: '#4A5568' },
    { label: 'NY Open', pct: 12, color: '#34D399' },
    { label: 'Midday', pct: 34, color: '#5CB8F0' },
    { label: 'PM', pct: 10, color: '#5CB8F0' },
    { label: 'Power', pct: 12, color: '#FBBF24' },
    { label: 'AH', pct: 15, color: '#4A5568' },
  ]
  const current = 2 // midday
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1">
      <div className="flex overflow-hidden rounded-full border border-frost-border-subtle/40">
        {phases.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0.3 }}
            whileInView={{ opacity: i === current ? 1 : 0.55 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative flex h-7 items-center justify-center"
            style={{ width: `${p.pct}%`, background: p.color }}
          >
            {i === current && (
              <span className="font-mono text-[9px] font-semibold text-arctic-base">
                {p.label}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] text-frost-muted">
        <span>04:00 ET</span>
        <span className="flex items-center gap-1 text-profit">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-profit" />
          live: 11:14 ET
        </span>
        <span>20:00 ET</span>
      </div>
    </div>
  )
}

function ShieldViz() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-1">
      {[
        { label: 'Max 10 Trades / Tag', value: '4 / 10', fill: 0.4 },
        { label: 'Daily Loss Limit', value: '−$180 / −$1,000', fill: 0.18 },
        { label: 'Position Size auto', value: '2 Kontrakte', fill: 1 },
      ].map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.35, delay: i * 0.1 }}
          className="rounded-lg border border-frost-border-subtle/50 bg-arctic-base/40 px-3 py-2"
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-frost-muted">
            <span>{r.label}</span>
            <span className="text-frost-white">{r.value}</span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.fill > 0.7 ? '#F87171' : r.fill > 0.3 ? '#FBBF24' : '#34D399' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${r.fill * 100}%` }}
              viewport={viewportOnce}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ReplayViz() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1">
      <div className="flex items-center gap-2 font-mono text-[10px] text-frost-muted">
        <span className="inline-flex items-center gap-1 rounded bg-profit/10 px-1.5 py-0.5 text-profit">
          <span className="h-1.5 w-1.5 rounded-full bg-profit" />
          REPLAY
        </span>
        <span>2026-03-25 · NY Open</span>
        <span className="ml-auto">5x</span>
      </div>
      <div className="relative h-10 overflow-hidden rounded-lg border border-frost-border-subtle/60 bg-arctic-base/50">
        <svg viewBox="0 0 240 40" className="absolute inset-0 h-full w-full">
          <polyline
            points="0,28 20,24 40,27 60,18 80,22 100,12 120,15 140,9 160,13 180,7 200,11 220,5 240,8"
            fill="none"
            stroke="#5CB8F0"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.7"
          />
          <motion.circle
            initial={{ cx: 0 }}
            whileInView={{ cx: 140 }}
            viewport={viewportOnce}
            transition={{ duration: 2, ease: 'easeOut' }}
            cy="9"
            r="3"
            fill="#5CB8F0"
            style={{ filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.7))' }}
          />
        </svg>
      </div>
      <div className="flex h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-ice"
          initial={{ width: 0 }}
          whileInView={{ width: '58%' }}
          viewport={viewportOnce}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] text-frost-muted">
        <span>09:30</span>
        <span>Bar 226 / 390</span>
        <span>16:00</span>
      </div>
    </div>
  )
}

interface Capability {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  kicker: string
  viz: React.ComponentType
  tone: Tone
  span: 'wide' | 'half'
}

const CAPABILITIES: Capability[] = [
  {
    id: 'charts',
    icon: LineChart,
    kicker: 'Chart',
    title: 'Ein Screen statt fünf Tabs.',
    description:
      'ES und NQ in Echtzeit mit Volumenprofil, VWAP und EMA-Ribbon auf einem Chart. Durchschnittlich 28 Minuten Pre-Market gespart — weil du nicht mehr zwischen Tools wechselst.',
    viz: ChartPreview,
    tone: 'ice',
    span: 'wide',
  },
  {
    id: 'bias',
    icon: Gauge,
    kicker: 'BIAS Score',
    title: 'Welche Seite handelst du heute?',
    description:
      'Score von −10 bis +10 aus fünf Faktoren. Über +5 = Long, unter −5 = Short. Um Null — Finger weg.',
    viz: GaugePreview,
    tone: 'profit',
    span: 'half',
  },
  {
    id: 'confluence',
    icon: Layers,
    kicker: 'Confluence',
    title: 'Nur handeln, wenn alles stimmt.',
    description:
      'Fünf unabhängige Faktoren werden zu einem Score von 0–5 verdichtet. Unter 3 kein Signal.',
    viz: ConfluenceRing,
    tone: 'profit',
    span: 'half',
  },
  {
    id: 'sessions',
    icon: Clock,
    kicker: 'Session Awareness',
    title: 'Wisse wo du in der Session stehst.',
    description:
      'Pre-Market, NY Open, Midday, Power Hour — jede Phase hat eigene Volatilitätsmuster. Arctis zeigt dir, wo der Markt gerade ist und wie die Phase historisch läuft.',
    viz: SessionTimeline,
    tone: 'ice',
    span: 'wide',
  },
  {
    id: 'replay',
    icon: Repeat,
    kicker: 'Replay & Proberun',
    title: 'Teste deine Entscheidung — ohne Risiko.',
    description:
      'Jedes vergangene Handels-Setup Bar-für-Bar durchspielen. Sieh dein Entry live, vergleiche mit der Arctis-Signal-Zeit — in 30 Min deckst du deine eigenen Fehler auf.',
    viz: ReplayViz,
    tone: 'ice',
    span: 'half',
  },
  {
    id: 'risk',
    icon: ShieldCheck,
    kicker: 'Risk Framework',
    title: 'Disziplin als eingebautes Limit.',
    description:
      'Max-Trades, Daily-Loss und Position-Size sind nicht Vorsatz — sie sind Limits. Die Engine lässt dich nicht durchrechnen, was du weißt.',
    viz: ShieldViz,
    tone: 'profit',
    span: 'half',
  },
]

function CapabilityCard({ cap }: { cap: Capability }) {
  const Icon = cap.icon
  const Viz = cap.viz
  const tc = toneToClasses(cap.tone)
  const accentHex = cap.tone === 'profit' ? '#34D399' : '#5CB8F0'

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-frost-border-subtle/70 bg-arctic-secondary/40 p-6 transition-colors duration-300 hover:border-ice/30',
        cap.span === 'wide' ? 'lg:col-span-2' : '',
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentHex}70 50%, transparent 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 80% 0%, ${accentHex}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md border',
            tc.bg,
            tc.border,
          )}
        >
          <Icon size={12} className={tc.text} />
        </span>
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-[0.18em]',
            tc.text,
          )}
        >
          {cap.kicker}
        </span>
      </div>

      <h3 className="relative z-10 mt-4 font-display text-lg font-semibold leading-tight text-frost-white sm:text-xl">
        {cap.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-frost-muted">
        {cap.description}
      </p>

      <div className="relative z-10 mt-4 min-h-[120px] flex-1 rounded-2xl border border-frost-border-subtle/40 bg-arctic-primary/40 p-3">
        <Viz />
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main section
// ────────────────────────────────────────────────────────────────────────────

export function Features() {
  return (
    <section id="features" className="section-padding relative">
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[20%] h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(92,184,240,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          className="mb-10 max-w-3xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-frost-border-subtle bg-arctic-secondary/60 px-3 py-1">
            <Flame size={12} className="text-ice" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost-secondary">
              Analyse Module
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            <TickNumber target={9} />{' '}
            <span className="text-frost-white">Werkzeuge.</span>
            <br />
            <span className="text-gradient-frost">Jedes beantwortet eine Frage.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-frost-secondary sm:text-lg">
            7 Setups und 2 Pattern-Detektoren, getestet auf{' '}
            <span className="font-semibold text-frost-white">
              <TickNumber target={4398} /> echten Trades
            </span>{' '}
            über 8 Monate. Kein Hype, keine erfundenen Win-Rates —{' '}
            nur was die Daten sagen.
          </p>
        </motion.div>

        {/* Setup table */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <SetupTable />
        </motion.div>

        {/* Capability bento grid */}
        <motion.div
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.id} cap={c} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
