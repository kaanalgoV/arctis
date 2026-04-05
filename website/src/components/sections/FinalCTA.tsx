'use client'

import { motion } from 'framer-motion'
import { LogIn, ArrowRight, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { blurReveal, fadeInUp, scaleIn, viewportOnce } from '@/lib/animations'

// ─── FinalCTA ─────────────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <section
      className={cn(
        'noise-overlay relative overflow-hidden',
        'py-24 lg:py-32',
        'bg-arctic-primary',
      )}
    >
      {/* ── Background atmosphere (distinct from hero) ──────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0 }}
      >
        {/* Centered bottom-up radial — inverted from hero's top-left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center bottom, rgba(92,184,240,0.12) 0%, rgba(92,184,240,0.04) 35%, transparent 70%)',
          }}
        />
        {/* Subtle top vignette to blend with previous section */}
        <div
          className="absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,13,18,0.6) 0%, transparent 100%)',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(92,184,240,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(92,184,240,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Horizontal rule glow at the very top */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.2) 30%, rgba(92,184,240,0.4) 50%, rgba(92,184,240,0.2) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div
        className="section-container relative z-10 flex flex-col items-center text-center"
        style={{ zIndex: 2 }}
      >
        {/* Pre-heading badge */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-frost-border bg-arctic-secondary px-4 py-1.5"
        >
          <BarChart2 size={13} className="text-ice" strokeWidth={2.2} />
          <span className="font-sans text-xs font-medium tracking-wide text-frost-secondary uppercase">
            Für Trader die Ergebnisse wollen
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={blurReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
        >
          <span className="text-frost-white block">Hör auf zu raten.</span>
          <span className="text-gradient-frost block">Fang an zu wissen.</span>
        </motion.h2>

        {/* Subheading */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.1 }}
          className="font-sans mx-auto mt-6 max-w-xl text-lg leading-relaxed text-frost-secondary sm:text-xl"
        >
          In 14 Minuten weißt du: Welche Seite. Welcher Entry. Welches Target.
          Jeden Morgen.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="http://localhost:5174/login"
            variants={scaleIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'font-display group relative flex cursor-pointer items-center gap-2.5 overflow-hidden',
              'rounded-xl bg-ice px-10 py-4 text-lg font-bold text-arctic-base',
              'transition-all duration-200 hover:bg-ice-light',
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 60px rgba(92,184,240,0.2), 0 0 120px rgba(92,184,240,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* shimmer sweep */}
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

        {/* Trust line */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.3 }}
          className="font-sans mt-6 text-sm text-frost-muted"
        >
          Kostenlos testen&nbsp;&middot;&nbsp;Deine Daten bleiben lokal&nbsp;&middot;&nbsp;Web App
        </motion.p>
      </div>
    </section>
  )
}
