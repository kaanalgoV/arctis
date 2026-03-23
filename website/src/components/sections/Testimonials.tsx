'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from '@/lib/animations'
import { Star, Quote } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The BIAS module replaced a manual process that took my desk 20 minutes each morning. Multi-factor directional scoring is now part of our standard pre-market workflow.',
    name: 'Marcus Reinhardt',
    role: 'Proprietary Trading — Futures Desk, 11 years',
    initials: 'MR',
  },
  {
    quote:
      'I evaluated NinjaTrader, Sierra Chart, and TradingView before switching. Arctis is the only platform where algorithmic pattern detection consistently aligns with what experienced traders see on the chart.',
    name: 'Sarah Kovac',
    role: 'Independent Futures Trader, CME Member',
    initials: 'SK',
  },
  {
    quote:
      'P95 latency under 50 milliseconds on NQ data changed our execution workflow. The difference between 50ms and 300ms is material when you are trading inside the spread.',
    name: 'James Thornton',
    role: 'Quantitative Scalper — NQ Specialist, 8 years',
    initials: 'JT',
  },
  {
    quote:
      'Session analytics eliminated 20 minutes of manual preparation every morning. Automatic session boundary detection and VWAP tracking are precisely what our desk needed.',
    name: 'Elena Vasquez',
    role: 'Quantitative Analyst — Futures Research',
    initials: 'EV',
  },
  {
    quote:
      'The integrated risk framework was the deciding factor. Position sizing and max loss enforcement are visible in every analysis view. That structural discipline is worth the platform switch alone.',
    name: 'David Liu',
    role: 'Funded Trader — Risk-Managed Strategies',
    initials: 'DL',
  },
  {
    quote:
      'Minimal interface, fast execution, no unnecessary features. After years of working around overbuilt platforms, Arctis delivers exactly what the analysis requires and nothing else.',
    name: 'Alexander Meyer',
    role: 'Independent Swing Trader — ES and NQ',
    initials: 'AM',
  },
]

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={0}
          fill="currentColor"
          className="text-ice"
        />
      ))}
    </div>
  )
}

// ─── TestimonialCard ──────────────────────────────────────────────────────────

function TestimonialCard({
  testimonial,
  floatY,
}: {
  testimonial: Testimonial
  floatY: MotionValue<number>
}) {
  return (
    <motion.article
      variants={staggerItem}
      style={{ y: floatY }}
      className={cn(
        'glass-card',
        'flex flex-col',
        'p-6 lg:p-8 rounded-2xl',
        'transition-transform duration-300 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Quote icon */}
      <Quote
        size={32}
        strokeWidth={1.5}
        className="text-ice/20 mb-4 shrink-0"
        aria-hidden="true"
      />

      {/* Quote text */}
      <p className="text-frost-secondary text-sm sm:text-base leading-relaxed italic flex-1">
        {testimonial.quote}
      </p>

      {/* Attribution */}
      <div
        className={cn(
          'mt-auto pt-4',
          'border-t border-frost-border-subtle/50',
          'flex items-center justify-between gap-4',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={cn(
              'h-10 w-10 shrink-0 rounded-full',
              'flex items-center justify-center',
              'bg-gradient-to-br from-ice-dark to-ice-muted',
            )}
            aria-hidden="true"
          >
            <span className="font-display font-bold text-sm text-frost-white leading-none">
              {testimonial.initials}
            </span>
          </div>

          {/* Name + role */}
          <div className="min-w-0">
            <p className="text-frost-white font-medium text-sm leading-tight truncate">
              {testimonial.name}
            </p>
            <p className="text-frost-muted text-xs leading-tight mt-0.5 truncate">
              {testimonial.role}
            </p>
          </div>
        </div>

        {/* Stars */}
        <StarRating />
      </div>
    </motion.article>
  )
}

// ─── Testimonials Section ─────────────────────────────────────────────────────

function Testimonials() {
  const gridRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ['start end', 'end start'],
  })

  const oddY = useTransform(scrollYProgress, [0, 1], [0, -8])
  const evenY = useTransform(scrollYProgress, [0, 1], [0, 8])

  return (
    <section className="section-padding relative noise-overlay">
      <div className="section-container">

        {/* ── Section header ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-14"
        >
          <p className="text-ice text-sm font-medium uppercase tracking-[0.15em] mb-4">
            User Feedback
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            <span className="text-frost-white">What professional traders</span>
            <br />
            <span className="text-gradient-frost">are reporting.</span>
          </h2>
        </motion.div>

        {/* ── Testimonial grid ── */}
        <motion.div
          ref={gridRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              floatY={index % 2 !== 0 ? oddY : evenY}
            />
          ))}
        </motion.div>

      </div>
    </section>
  )
}

export { Testimonials }
