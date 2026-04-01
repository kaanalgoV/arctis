'use client'

import { motion } from 'framer-motion'
import {
  fadeInUp,
  viewportOnce,
} from '@/lib/animations'

// ─── Mock Signal Chart ──────────────────────────────────────────────────────

function SignalChart() {
  return (
    <div className="overflow-hidden rounded-xl border border-frost-border-subtle bg-arctic-primary">
      {/* Chart area */}
      <div className="relative px-4 py-5">
        <svg
          width="100%"
          height="160"
          viewBox="0 0 440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Target zone */}
          <rect x="0" y="10" width="440" height="25" rx="0" fill="#34D399" opacity="0.05" />
          <line x1="0" y1="22" x2="440" y2="22" stroke="#34D399" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <text x="430" y="18" fill="#34D399" fontSize="8" fontFamily="monospace" textAnchor="end" opacity="0.7">23,235</text>

          {/* Entry zone */}
          <line x1="0" y1="80" x2="440" y2="80" stroke="#5AAED8" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <text x="430" y="76" fill="#5AAED8" fontSize="8" fontFamily="monospace" textAnchor="end" opacity="0.7">23,180</text>

          {/* Stop zone */}
          <rect x="0" y="115" width="440" height="20" rx="0" fill="#F87171" opacity="0.05" />
          <line x1="0" y1="125" x2="440" y2="125" stroke="#F87171" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <text x="430" y="121" fill="#F87171" fontSize="8" fontFamily="monospace" textAnchor="end" opacity="0.7">23,155</text>

          {/* Price action candles leading to entry */}
          {[
            { x: 40, o: 95, c: 88, bull: true },
            { x: 64, o: 88, c: 100, bull: false },
            { x: 88, o: 100, c: 92, bull: true },
            { x: 112, o: 92, c: 105, bull: false },
            { x: 136, o: 105, c: 90, bull: true },
            { x: 160, o: 90, c: 95, bull: false },
            { x: 184, o: 95, c: 82, bull: true },
          ].map((c, i) => {
            const top = Math.min(c.o, c.c)
            const h = Math.abs(c.o - c.c)
            const color = c.bull ? '#34D399' : '#F87171'
            return (
              <g key={i}>
                <line x1={c.x} y1={top - 5} x2={c.x} y2={top + h + 5} stroke={color} strokeWidth="1" />
                <rect x={c.x - 6} y={top} width="12" height={Math.max(h, 2)} rx="1" fill={color} />
              </g>
            )
          })}

          {/* Entry arrow */}
          <g>
            <line x1="210" y1="100" x2="210" y2="82" stroke="#5AAED8" strokeWidth="2" />
            <polygon points="204,86 210,76 216,86" fill="#5AAED8" />
            <text x="210" y="112" fill="#5AAED8" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ENTRY</text>
          </g>

          {/* Post-entry candles trending up */}
          {[
            { x: 240, o: 80, c: 70, bull: true },
            { x: 264, o: 70, c: 65, bull: true },
            { x: 288, o: 65, c: 55, bull: true },
            { x: 312, o: 55, c: 48, bull: true },
            { x: 336, o: 48, c: 40, bull: true },
            { x: 360, o: 40, c: 30, bull: true },
            { x: 384, o: 30, c: 25, bull: true },
          ].map((c, i) => {
            const top = Math.min(c.o, c.c)
            const h = Math.abs(c.o - c.c)
            return (
              <g key={`post-${i}`}>
                <line x1={c.x} y1={top - 4} x2={c.x} y2={top + h + 4} stroke="#34D399" strokeWidth="1" />
                <rect x={c.x - 6} y={top} width="12" height={Math.max(h, 2)} rx="1" fill="#34D399" opacity={0.6 + (i / 7) * 0.4} />
              </g>
            )
          })}

          {/* R:R line */}
          <line x1="420" y1="22" x2="420" y2="80" stroke="#34D399" strokeWidth="1" opacity="0.3" />
          <line x1="420" y1="80" x2="420" y2="125" stroke="#F87171" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Signal card below chart */}
      <div className="border-t border-frost-border-subtle px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction badge */}
          <span className="rounded border border-profit/30 bg-profit/10 px-2 py-0.5 font-mono text-xs font-semibold text-profit">
            LONG NQ
          </span>

          {/* Price levels */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-frost-muted">Entry</span>
            <span className="text-frost-white">23,180</span>
            <span className="text-frost-muted">|</span>
            <span className="text-frost-muted">Stop</span>
            <span className="text-loss">23,155</span>
            <span className="text-frost-muted">|</span>
            <span className="text-frost-muted">Target</span>
            <span className="text-profit">23,235</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* R:R badge */}
          <span className="rounded border border-frost-border-subtle bg-arctic-secondary px-2 py-0.5 font-mono text-[10px] text-frost-secondary">
            R:R 2.2
          </span>

          {/* Confluence badge */}
          <span className="rounded border border-ice/30 bg-ice/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-ice">
            Confluence 8/14
          </span>

          {/* Bias badge */}
          <span className="rounded border border-profit/20 bg-profit/5 px-2 py-0.5 font-mono text-[10px] text-profit">
            BIAS LONG +5
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── SignalShowcase Section ──────────────────────────────────────────────────

export function SignalShowcase() {
  return (
    <section id="signals" className="section-padding relative">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute right-1/4 top-1/3 -translate-y-1/2"
          style={{
            width: '700px',
            height: '500px',
            background:
              'radial-gradient(ellipse at center, rgba(90,174,216,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="mb-12 text-center lg:mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
            Signals
          </p>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            Signale die
            <br />
            <span className="text-gradient-frost">Sinn machen.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-frost-secondary">
            Kein Rauschen. Kein Repainting. Nur Setups mit Entry, Stop, Target — wenn Confluence, Bias und Struktur uebereinstimmen.
          </p>
        </motion.div>

        {/* Signal mock */}
        <motion.div
          className="mx-auto max-w-3xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="frost-glow rounded-xl">
            <SignalChart />
          </div>
        </motion.div>

        {/* Key point */}
        <motion.div
          className="mx-auto mt-8 max-w-2xl text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="inline-flex items-center gap-3 rounded-xl border border-frost-border-subtle bg-arctic-secondary/50 px-5 py-3">
            <span
              className="size-2 shrink-0 rounded-full bg-ice"
              style={{ boxShadow: '0 0 8px rgba(90,174,216,0.6)' }}
            />
            <span className="text-sm text-frost-secondary">
              Arctis filtert Signale die dem Marktbias widersprechen automatisch heraus.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
