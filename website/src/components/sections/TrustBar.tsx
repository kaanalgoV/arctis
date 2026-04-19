'use client'

import { cn } from '@/lib/utils'
import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { BarChart3, Shield, Zap, Globe } from 'lucide-react'

// ─── Animated Counter Hook ──────────────────────────────────────────────────

type CounterConfig =
  | { type: 'integer'; target: number; prefix?: string; suffix?: string }
  | { type: 'decimal'; target: number; decimals: number; prefix?: string; suffix?: string }
  | { type: 'static'; display: string }

function useAnimatedCounter(
  config: CounterConfig,
  inView: boolean,
): { ref: React.RefObject<HTMLSpanElement | null> } {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    if (config.type === 'static') return

    const target = config.target
    const controls = animate(motionValue, target, {
      duration: 2,
      ease: 'easeOut',
    })

    const unsubscribe = motionValue.on('change', (latest) => {
      if (!ref.current) return

      if (config.type === 'decimal') {
        const formatted = latest.toFixed(config.decimals)
        const prefix = config.prefix ?? ''
        const suffix = config.suffix ?? ''
        ref.current.textContent = `${prefix}${formatted}${suffix}`
      } else {
        // integer — format with locale commas
        const formatted = new Intl.NumberFormat('en-US').format(Math.round(latest))
        const prefix = config.prefix ?? ''
        const suffix = config.suffix ?? ''
        ref.current.textContent = `${prefix}${formatted}${suffix}`
      }
    })

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [inView, config, motionValue])

  // Set initial display value
  useEffect(() => {
    if (!ref.current) return
    if (config.type === 'static') {
      ref.current.textContent = config.display
    } else if (config.type === 'decimal') {
      const prefix = config.prefix ?? ''
      const suffix = config.suffix ?? ''
      ref.current.textContent = `${prefix}0.${'0'.repeat(config.decimals)}${suffix}`
    } else {
      const prefix = config.prefix ?? ''
      const suffix = config.suffix ?? ''
      ref.current.textContent = `${prefix}0${suffix}`
    }
  }, [config])

  return { ref }
}

// ─── Individual Counter Card ─────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode
  counterConfig: CounterConfig
  label: string
  context?: string
  inView: boolean
}

function MetricCard({ icon, counterConfig, label, context, inView }: MetricCardProps) {
  const { ref } = useAnimatedCounter(counterConfig, inView)

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'glass-card group',
        'p-6 rounded-xl text-center',
        'flex flex-col items-center gap-2',
        'transition-colors duration-300',
        'hover:border-ice/40',
      )}
    >
      <div className="text-ice/70 group-hover:text-ice transition-colors">{icon}</div>
      <span
        ref={ref}
        className="font-display text-3xl sm:text-4xl font-bold text-frost-white tabular-nums"
        aria-live="polite"
      />
      <span className="text-frost-muted text-[11px] uppercase tracking-[0.18em] leading-tight">
        {label}
      </span>
      {context ? (
        <span className="text-frost-muted/60 text-[10px] font-mono tracking-wide">
          {context}
        </span>
      ) : null}
    </motion.div>
  )
}

// ─── Logo Marquee ─────────────────────────────────────────────────────────────

const LOGOS = [
  'CME Group',
  'NinjaTrader',
  'Rithmic',
  'Tradovate',
  'AMP Futures',
  'Optimus Futures',
]

function LogoStrip() {
  return (
    <div className="flex items-center gap-12 shrink-0">
      {LOGOS.map((name) => (
        <span
          key={name}
          className={cn(
            'font-display text-lg font-semibold uppercase tracking-wider whitespace-nowrap',
            'text-frost-muted/40',
            'hover:text-frost-secondary transition-colors duration-300',
            'cursor-default select-none',
          )}
        >
          {name}
        </span>
      ))}
    </div>
  )
}

// ─── Marquee Container ────────────────────────────────────────────────────────

function Marquee() {
  return (
    <div className="flex flex-col items-center gap-5 w-full overflow-hidden">
      {/* Label */}
      <p className="text-frost-muted text-xs uppercase tracking-[0.2em]">
        Gebaut für Trader die Ergebnisse wollen, nicht Features.
      </p>

      {/* Scrolling strip — uses mask-image so edges fade fully to transparent, not just to surface color */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, #000 15%, #000 85%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, #000 15%, #000 85%, transparent 100%)',
        }}
      >
        {/* Scrolling content — two identical strips for seamless loop */}
        <div
          data-marquee
          className="flex gap-12 w-max"
          style={{
            animation: 'marquee-scroll 40s linear infinite',
          }}
        >
          <LogoStrip />
          <LogoStrip />
        </div>
      </div>
    </div>
  )
}

// ─── Metric Definitions ───────────────────────────────────────────────────────

const METRICS: Array<{
  icon: React.ReactNode
  config: CounterConfig
  label: string
  context: string
}> = [
  {
    icon: <BarChart3 size={20} />,
    config: { type: 'integer', target: 4398, suffix: '' },
    label: 'Backtest Trades',
    context: 'Aug 2025 – März 2026',
  },
  {
    icon: <Shield size={20} />,
    config: { type: 'decimal', target: 3.83, decimals: 2, prefix: '', suffix: 'x' },
    label: 'Top Profit Factor',
    context: 'Opening Fake Pattern',
  },
  {
    icon: <Zap size={20} />,
    config: { type: 'static', display: '14 Min' },
    label: 'Pre-Market Vorbereitung',
    context: 'Statt 42 Min manuell',
  },
  {
    icon: <Globe size={20} />,
    config: { type: 'integer', target: 9, suffix: '' },
    label: 'Setups & Patterns',
    context: '7 Setups · 2 Patterns',
  },
]

// ─── TrustBar Section ─────────────────────────────────────────────────────────

function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' })

  return (
    <>
      {/* Inline keyframe for the marquee — injected once at runtime */}
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-marquee] { animation: none !important; }
        }
      `}</style>

      <section
        ref={sectionRef}
        className={cn(
          'section-padding relative',
          'border-y border-frost-border-subtle/30',
        )}
      >
        <div className="section-container flex flex-col gap-12">

          {/* ── Part A: Metric Counters ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {METRICS.map((metric) => (
              <MetricCard
                key={metric.label}
                icon={metric.icon}
                counterConfig={metric.config}
                label={metric.label}
                context={metric.context}
                inView={inView}
              />
            ))}
          </motion.div>

          {/* ── Divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-frost-border to-transparent" />

          {/* ── Part B: Logo Marquee ── */}
          <Marquee />

        </div>
      </section>
    </>
  )
}

export { TrustBar }
