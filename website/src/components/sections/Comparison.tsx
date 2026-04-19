'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, X, Minus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = 'check' | 'x' | 'minus'

interface ComparisonRow {
  feature: string
  traditional: { status: StatusType; label: string }
  arctis: { status: StatusType; label: string }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROWS: ComparisonRow[] = [
  {
    feature: 'Pre-Market Vorbereitung',
    traditional: { status: 'x', label: '45+ Minuten, ad-hoc' },
    arctis: { status: 'check', label: '14 Minuten, strukturiert' },
  },
  {
    feature: 'Tages-Bias',
    traditional: { status: 'x', label: 'Bauchgefühl' },
    arctis: { status: 'check', label: 'Automatisch, 5 Faktoren' },
  },
  {
    feature: 'Setup-Erkennung',
    traditional: { status: 'x', label: 'Manuell suchen' },
    arctis: { status: 'check', label: 'Entry/Stop/Target berechnet' },
  },
  {
    feature: 'Confluence',
    traditional: { status: 'x', label: 'Subjektive Einschätzung' },
    arctis: { status: 'check', label: 'Score 0-5, objektiv' },
  },
  {
    feature: 'Risiko-Kontrolle',
    traditional: { status: 'x', label: 'Selbstdisziplin' },
    arctis: { status: 'check', label: 'Automatische Limits' },
  },
  {
    feature: 'Replay & Proberun',
    traditional: { status: 'x', label: 'Nicht verfügbar' },
    arctis: { status: 'check', label: 'Historische Setups überprüfen' },
  },
  {
    feature: 'Orderflow / Delta',
    traditional: { status: 'x', label: 'Separate Bookmap-Lizenz nötig' },
    arctis: { status: 'check', label: 'Cumulative Delta integriert' },
  },
]

// ─── Status Cell ──────────────────────────────────────────────────────────────

function StatusCell({ status, label }: { status: StatusType; label: string }) {
  if (status === 'check') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 items-center justify-center rounded-full bg-profit/15 p-1 text-profit">
          <Check size={13} strokeWidth={2} />
        </span>
        <span className="font-sans text-xs text-frost-secondary">{label}</span>
      </div>
    )
  }

  if (status === 'x') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 items-center justify-center rounded-full bg-loss/15 p-1 text-loss/80">
          <X size={13} strokeWidth={2} />
        </span>
        <span className="font-sans text-xs text-frost-secondary">{label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 items-center justify-center rounded-full bg-warning/15 p-1 text-warning">
        <Minus size={13} strokeWidth={2} />
      </span>
      <span className="font-sans text-xs text-frost-secondary">{label}</span>
    </div>
  )
}

// ─── Desktop Table ─────────────────────────────────────────────────────────────

function DesktopTable({ inView }: { inView: boolean }) {
  return (
    <div className="hidden md:block">
      {/* Outer container with subtle outer glow on the Arctis column */}
      <div className="relative overflow-hidden rounded-2xl border border-frost-border-subtle">

        {/* Arctis column highlight — positioned behind cells */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0"
          style={{ width: '33.333%' }}
        >
          <div
            className="absolute inset-0 border-l border-ice/20"
            style={{
              background:
                'linear-gradient(180deg, rgba(92,184,240,0.06) 0%, rgba(92,184,240,0.02) 100%)',
            }}
          />
        </div>

        {/* Header row */}
        <div className="relative grid grid-cols-3 border-b border-frost-border-subtle/70">
          {/* Feature header */}
          <div className="px-6 py-4">
            <span className="font-sans text-sm uppercase tracking-[0.12em] text-frost-muted">
              Bereich
            </span>
          </div>

          {/* Traditional header */}
          <div className="border-l border-frost-border-subtle/50 bg-arctic-secondary/60 px-6 py-4">
            <span className="font-sans text-sm uppercase tracking-[0.12em] text-frost-muted">
              Andere Tools
            </span>
          </div>

          {/* Arctis header */}
          <div className="relative border-l border-ice/20 px-6 py-4">
            {/* Top accent border */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-ice">Arctis</span>
              <span
                className="inline-flex h-1.5 w-1.5 rounded-full bg-ice"
                style={{ boxShadow: '0 0 6px rgba(92,184,240,0.7)' }}
              />
            </div>
          </div>
        </div>

        {/* Data rows */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="divide-y divide-frost-border-subtle/40"
        >
          {ROWS.map((row, i) => (
            <motion.div
              key={row.feature}
              variants={staggerItem}
              className={cn(
                'group grid grid-cols-3 transition-colors duration-200',
                'hover:bg-arctic-secondary/40',
                i % 2 === 0 ? 'bg-arctic-primary/40' : 'bg-transparent',
              )}
            >
              {/* Feature name */}
              <div className="px-6 py-4">
                <span className="font-sans text-sm font-medium text-frost-white">
                  {row.feature}
                </span>
              </div>

              {/* Traditional */}
              <div className="border-l border-frost-border-subtle/50 px-6 py-4">
                <StatusCell status={row.traditional.status} label={row.traditional.label} />
              </div>

              {/* Arctis */}
              <div className="border-l border-ice/20 px-6 py-4">
                <StatusCell status={row.arctis.status} label={row.arctis.label} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Mobile Cards ──────────────────────────────────────────────────────────────

function MobileCards({ inView }: { inView: boolean }) {
  return (
    <div className="block md:hidden">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="flex flex-col gap-3"
      >
        {ROWS.map((row) => (
          <motion.div
            key={row.feature}
            variants={staggerItem}
            className="glass-card rounded-xl overflow-hidden"
          >
            {/* Feature label bar */}
            <div className="border-b border-frost-border-subtle/50 px-4 py-3">
              <span className="font-sans text-sm font-medium text-frost-white">{row.feature}</span>
            </div>

            {/* Two-column comparison */}
            <div className="grid grid-cols-2">
              {/* Traditional */}
              <div className="border-r border-frost-border-subtle/50 px-4 py-3">
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.12em] text-frost-muted">
                  Andere Tools
                </p>
                <StatusCell status={row.traditional.status} label={row.traditional.label} />
              </div>

              {/* Arctis */}
              <div
                className="px-4 py-3"
                style={{ background: 'rgba(92,184,240,0.04)' }}
              >
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.12em] text-ice">
                  Arctis
                </p>
                <StatusCell status={row.arctis.status} label={row.arctis.label} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Bottom Callout ────────────────────────────────────────────────────────────

function BottomCallout() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={cn(
        'glass-card mt-10 mx-auto max-w-xl rounded-2xl px-8 py-6',
        'flex flex-col items-center gap-3 text-center',
      )}
    >
      <div
        className="flex items-center justify-center rounded-full bg-ice-subtle p-2.5 text-ice"
        style={{ boxShadow: '0 0 20px rgba(92,184,240,0.15)' }}
      >
        <Clock size={18} strokeWidth={2} />
      </div>
      <p className="font-sans text-base text-frost-secondary leading-relaxed">
        Trader die Arctis nutzen brauchen{' '}
        <span className="font-semibold text-frost-white">14 statt 42 Minuten</span>{' '}
        Pre-Market Vorbereitung — und handeln mit Setups, die auf{' '}
        <span className="font-semibold text-frost-white">4,398 echten Trades über 8 Monate</span>{' '}
        kalibriert sind.
      </p>
    </motion.div>
  )
}

// ─── Comparison ───────────────────────────────────────────────────────────────

function Comparison() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' })

  return (
    <section
      ref={sectionRef}
      className="section-padding relative"
    >
      {/* Subtle background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(92,184,240,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">

        {/* ── Section Header ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-12 flex flex-col items-center gap-4 text-center"
        >
          <motion.p
            variants={staggerItem}
            className="text-ice text-sm font-medium uppercase tracking-[0.15em]"
          >
            Warum Trader wechseln
          </motion.p>

          <motion.h2
            variants={staggerItem}
            className="font-display text-3xl font-bold sm:text-4xl"
          >
            Der Unterschied zwischen{' '}
            <span className="text-gradient-frost">hoffen und wissen.</span>
          </motion.h2>
        </motion.div>

        {/* ── Table (desktop) / Cards (mobile) ── */}
        <DesktopTable inView={inView} />
        <MobileCards inView={inView} />

        {/* ── Bottom Callout ── */}
        <BottomCallout />

      </div>
    </section>
  )
}

export { Comparison }
