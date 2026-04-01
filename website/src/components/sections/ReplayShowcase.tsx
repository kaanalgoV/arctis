'use client'

import { motion } from 'framer-motion'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'

// ─── Mock Replay Interface ──────────────────────────────────────────────────

const REPLAY_CANDLES = [
  { x: 16, o: 78, c: 58, h: 48, l: 82, bull: true },
  { x: 38, o: 58, c: 62, h: 50, l: 68, bull: false },
  { x: 60, o: 62, c: 48, h: 40, l: 66, bull: true },
  { x: 82, o: 48, c: 54, h: 38, l: 60, bull: false },
  { x: 104, o: 54, c: 42, h: 32, l: 58, bull: true },
  { x: 126, o: 42, c: 50, h: 34, l: 56, bull: false },
  { x: 148, o: 50, c: 38, h: 28, l: 54, bull: true },
  { x: 170, o: 38, c: 44, h: 26, l: 50, bull: false },
  { x: 192, o: 44, c: 34, h: 22, l: 48, bull: true },
  { x: 214, o: 34, c: 40, h: 24, l: 46, bull: false },
  { x: 236, o: 40, c: 30, h: 20, l: 44, bull: true },
  { x: 258, o: 30, c: 36, h: 18, l: 42, bull: false },
  { x: 280, o: 36, c: 26, h: 16, l: 40, bull: true },
]

function ReplayMockUI() {
  return (
    <div className="overflow-hidden rounded-xl border border-frost-border-subtle bg-arctic-primary">
      {/* Candle reveal keyframes — 15s looping replay */}
      <style>{`
        @keyframes replayReveal {
          0% { clip-path: inset(0 100% 0 0); }
          60% { clip-path: inset(0 0 0 0); }
          80% { clip-path: inset(0 0 0 0); }
          95% { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 100% 0 0); }
        }
        @keyframes datePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.3); }
          50% { box-shadow: 0 0 8px 2px rgba(52,211,153,0.15); }
        }
        @keyframes replayProgress {
          0% { width: 0%; }
          60% { width: 100%; }
          80% { width: 100%; }
          95% { width: 0%; }
          100% { width: 0%; }
        }
        @keyframes replayCursor {
          0% { transform: translateX(0); }
          60% { transform: translateX(210px); }
          80% { transform: translateX(210px); }
          95% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        @keyframes replayBarCount {
          0% { --bar-num: 0; }
          60% { --bar-num: 390; }
          80% { --bar-num: 390; }
          95% { --bar-num: 0; }
          100% { --bar-num: 0; }
        }
        @keyframes replayTimeTick {
          0% { content: '09:30'; }
          15% { content: '10:15'; }
          30% { content: '11:00'; }
          45% { content: '12:00'; }
          60% { content: '13:30'; }
        }
      `}</style>

      {/* Top bar with date + speed */}
      <div className="flex items-center justify-between border-b border-frost-border-subtle px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="size-2.5 rounded-full bg-profit"
            style={{
              boxShadow: '0 0 8px rgba(52,211,153,0.5)',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
            }}
          />
          {/* Pulsing date badge */}
          <span
            className="rounded-md border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] px-2.5 py-1 font-mono text-xs text-frost-white"
            style={{ animation: 'datePulse 3s ease-in-out infinite' }}
          >
            2026-03-25
          </span>
          <span className="rounded border border-frost-border-subtle bg-arctic-secondary px-2 py-0.5 font-mono text-[10px] text-ice">
            NY Open
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {['1x', '5x', '10x', '25x'].map((speed, i) => (
            <button
              key={speed}
              className={`rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
                i === 1
                  ? 'bg-ice/20 text-ice'
                  : 'text-frost-muted hover:text-frost-secondary'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area — bigger */}
      <div className="relative px-4 py-8">
        <svg
          width="100%"
          height="150"
          viewBox="0 0 520 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <line
              key={frac}
              x1="0"
              y1={150 * frac}
              x2="520"
              y2={150 * frac}
              stroke="rgba(92,184,240,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Revealed candles with 15s looping replay */}
          <g style={{ animation: 'replayReveal 15s ease-in-out infinite' }}>
            {REPLAY_CANDLES.map((candle, i) => {
              const top = Math.min(candle.o, candle.c)
              const bodyH = Math.abs(candle.o - candle.c)
              const color = candle.bull ? '#34D399' : '#F87171'
              return (
                <g key={i} opacity={0.5 + (i / REPLAY_CANDLES.length) * 0.5}>
                  {/* Wick */}
                  <line x1={candle.x} y1={candle.h} x2={candle.x} y2={candle.l} stroke={color} strokeWidth="1.2" />
                  {/* Body */}
                  <rect x={candle.x - 6} y={top} width="12" height={Math.max(bodyH, 2)} rx="1.5" fill={color} />
                </g>
              )
            })}
          </g>

          {/* Playback cursor line */}
          <line x1="310" y1="0" x2="310" y2="150" stroke="#5AAED8" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Cursor dot */}
          <circle cx="310" cy="30" r="3" fill="#5AAED8" />

          {/* Hidden candles (right side — ghosted) */}
          {[324, 346, 368, 390, 412, 434, 456, 478, 500].map((x, i) => (
            <rect
              key={i}
              x={x - 6}
              y={28 + Math.sin(i * 1.3) * 12}
              width="12"
              height={14 + Math.cos(i * 0.9) * 6}
              rx="1.5"
              fill="#353D48"
              opacity="0.2"
            />
          ))}

          {/* Zone lines */}
          <line x1="0" y1="28" x2="310" y2="28" stroke="#5AAED8" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
          <text x="6" y="24" fill="#5AAED8" fontSize="9" fontFamily="monospace" opacity="0.5">POC 23,180</text>

          {/* EMA line on revealed portion */}
          <polyline
            points="16,68 38,60 60,52 82,50 104,46 126,48 148,42 170,40 192,36 214,34 236,32 258,30 280,28"
            fill="none"
            stroke="rgba(92,184,240,0.25)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Overlay: current bar info */}
        <div className="absolute bottom-3 left-5 flex items-center gap-3">
          <span className="font-mono text-[10px] text-frost-muted">Bar 187/390</span>
          <span className="font-mono text-[10px] text-profit">+0.42%</span>
        </div>
      </div>

      {/* Progress bar with controls */}
      <div className="flex items-center gap-3 border-t border-frost-border-subtle px-5 py-3.5">
        {/* Play button */}
        <button className="flex size-8 items-center justify-center rounded-md bg-ice/15 text-ice transition-colors hover:bg-ice/25">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
            <path d="M0 0L12 7L0 14V0Z" />
          </svg>
        </button>

        {/* Step buttons */}
        <button className="flex size-8 items-center justify-center rounded-md text-frost-muted transition-colors hover:text-frost-secondary hover:bg-arctic-secondary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 2v10l5-5L2 2zM7 2v10l5-5L7 2z" />
          </svg>
        </button>

        {/* Progress track — animated with 15s loop */}
        <div className="flex-1">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-arctic-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-ice"
              style={{ animation: 'replayProgress 15s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* Time labels */}
        <span className="font-mono text-[10px] text-frost-muted">09:30</span>
        <span className="font-mono text-[10px] text-frost-muted">/</span>
        <span className="font-mono text-[10px] text-frost-muted">16:00</span>
      </div>
    </div>
  )
}

// ─── Bullet Points ──────────────────────────────────────────────────────────

const bullets = [
  'Vergangene Sessions Bar fuer Bar durchspielen',
  'Engine-Signale und Zonen in Echtzeit beobachten',
  'Eigene Entscheidungen gegen die Engine validieren',
]

// ─── ReplayShowcase Section ─────────────────────────────────────────────────

export function ReplayShowcase() {
  return (
    <section id="replay" className="section-padding relative">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/4 top-1/2 -translate-y-1/2"
          style={{
            width: '600px',
            height: '400px',
            background:
              'radial-gradient(ellipse at center, rgba(90,174,216,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
              Replay Mode
            </p>
            <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl">
              Replay — Lerne aus
              <br />
              <span className="text-gradient-frost">echten Maerkten.</span>
            </h2>
            <p className="mt-4 max-w-lg text-lg text-frost-secondary">
              Waehle ein Datum, starte die Simulation, beobachte wie Arctis den Markt in Echtzeit analysiert. Ohne Risiko. Mit vollem Kontext.
            </p>

            {/* Bullet points */}
            <motion.ul
              className="mt-8 space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {bullets.map((text, i) => (
                <motion.li
                  key={i}
                  variants={staggerItem}
                  className="flex items-start gap-3"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ice"
                    style={{ boxShadow: '0 0 6px rgba(90,174,216,0.6)' }}
                  />
                  <span className="text-sm text-frost-secondary">{text}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right: Mock UI — with glow effect */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            transition={{ delay: 0.15 }}
          >
            <div
              className="rounded-xl"
              style={{
                boxShadow:
                  '0 0 40px rgba(90,174,216,0.08), 0 0 80px rgba(90,174,216,0.04), 0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <ReplayMockUI />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
