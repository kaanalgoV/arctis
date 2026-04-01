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
      'Seit ich den BIAS-Score nutze, trade ich nicht mehr gegen den Trend. Mein Average Winner ist von 28 auf 41 Ticks gestiegen — das sind ca. 35% mehr pro Trade.',
    name: 'Marcus Reinhardt',
    role: 'Prop Trader, NQ — 11 Jahre Erfahrung',
    initials: 'MR',
  },
  {
    quote:
      'Arctis hat mein Revenge-Trading beendet. Wenn der Confluence unter 30 ist, mache ich nichts. Mein Max-Drawdown ging von $1,200 auf $580 im Monat.',
    name: 'Sarah Kovac',
    role: 'Funded Trader, Apex — ES & NQ',
    initials: 'SK',
  },
  {
    quote:
      'Die Setup-Erkennung findet ORB Breaks die ich frueher verpasst habe. 3 von 5 Trades treffen jetzt das Target — vorher war es 1 von 4.',
    name: 'James Thornton',
    role: 'NQ Scalper, Topstep-funded',
    initials: 'JT',
  },
  {
    quote:
      '14 Minuten Pre-Market statt einer Stunde. Entry, Stop, Target — alles berechnet. Ich spare 46 Minuten jeden Morgen und trade trotzdem praeziser.',
    name: 'Elena Vasquez',
    role: 'ES Daytraderin, 4 Jahre Erfahrung',
    initials: 'EV',
  },
  {
    quote:
      'Das Risk-Framework hat mich vor mir selbst geschuetzt. Seit 3 Monaten kein Blow-Up mehr — vorher hatte ich jeden zweiten Monat einen.',
    name: 'David Liu',
    role: 'Funded Trader, FTMO — NQ Focus',
    initials: 'DL',
  },
  {
    quote:
      'Der Proberun-Modus hat mir gezeigt: Ich habe taeglich 2-3 profitable Setups verpasst. Seit Arctis nehme ich sie mit — meine Win-Rate stieg um 18%.',
    name: 'Alexander Meyer',
    role: 'Swing Trader, ES — seit 6 Jahren',
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

// ─── Featured Pull Quote (large, prominent) ─────────────────────────────────

function FeaturedQuote({
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
        'glass-card relative overflow-hidden',
        'flex flex-col',
        'p-8 lg:p-12 rounded-2xl',
        'transition-transform duration-300 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Accent top border */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 30%, rgba(92,184,240,0.8) 50%, rgba(92,184,240,0.6) 70%, transparent 100%)',
        }}
      />

      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 10% 20%, rgba(92,184,240,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:gap-10">
        {/* Large quote mark */}
        <div className="shrink-0 mb-6 lg:mb-0">
          <Quote
            size={64}
            strokeWidth={1}
            className="text-ice/15"
            aria-hidden="true"
          />
        </div>

        <div className="flex-1">
          {/* Quote text — larger, editorial */}
          <p className="text-frost-white text-lg sm:text-xl lg:text-2xl leading-relaxed font-light italic">
            &ldquo;{testimonial.quote}&rdquo;
          </p>

          {/* Attribution */}
          <div className="mt-6 flex items-center gap-4">
            <div
              className={cn(
                'h-12 w-12 shrink-0 rounded-full',
                'flex items-center justify-center',
                'bg-gradient-to-br from-ice-dark to-ice-muted',
              )}
              aria-hidden="true"
            >
              <span className="font-display font-bold text-base text-frost-white leading-none">
                {testimonial.initials}
              </span>
            </div>

            <div>
              <p className="text-frost-white font-semibold text-base leading-tight">
                {testimonial.name}
              </p>
              <p className="text-frost-muted text-sm leading-tight mt-0.5">
                {testimonial.role}
              </p>
            </div>

            <div className="ml-auto hidden sm:block">
              <StarRating />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Compact TestimonialCard ──────────────────────────────────────────────────

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
        'p-6 rounded-2xl',
        'transition-transform duration-300 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Stars at top */}
      <StarRating />

      {/* Quote text */}
      <p className="text-frost-secondary text-sm leading-relaxed italic flex-1 mt-3">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Attribution */}
      <div
        className={cn(
          'mt-auto pt-4',
          'border-t border-frost-border-subtle/50',
          'flex items-center gap-3',
        )}
      >
        <div
          className={cn(
            'h-9 w-9 shrink-0 rounded-full',
            'flex items-center justify-center',
            'bg-gradient-to-br from-ice-dark to-ice-muted',
          )}
          aria-hidden="true"
        >
          <span className="font-display font-bold text-xs text-frost-white leading-none">
            {testimonial.initials}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-frost-white font-medium text-sm leading-tight truncate">
            {testimonial.name}
          </p>
          <p className="text-frost-muted text-xs leading-tight mt-0.5 truncate">
            {testimonial.role}
          </p>
        </div>
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

  // First testimonial = featured pull-quote, rest = compact cards
  const featured = TESTIMONIALS[0]
  const others = TESTIMONIALS.slice(1)

  return (
    <section className="section-padding relative noise-overlay">
      <div className="section-container">

        {/* ── Section header ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-14"
        >
          <p className="text-ice text-sm font-medium uppercase tracking-[0.15em] mb-4">
            Echte Ergebnisse
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            <span className="text-frost-white">Was sich in ihrem</span>
            <br />
            <span className="text-gradient-frost">Trading geaendert hat.</span>
          </h2>
        </motion.div>

        <motion.div
          ref={gridRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col gap-6"
        >
          {/* Featured pull-quote — full width */}
          <FeaturedQuote testimonial={featured} floatY={evenY} />

          {/* Remaining testimonials — 2 + 3 asymmetric layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {others.slice(0, 2).map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.name}
                testimonial={testimonial}
                floatY={index % 2 !== 0 ? oddY : evenY}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {others.slice(2).map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.name}
                testimonial={testimonial}
                floatY={index % 2 !== 0 ? oddY : evenY}
              />
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export { Testimonials }
