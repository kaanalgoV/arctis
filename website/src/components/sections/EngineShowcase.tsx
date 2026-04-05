'use client'

import { motion } from 'framer-motion'
import {
  fadeInUp,
  engineStaggerContainer,
  engineCardItem,
  viewportOnce,
} from '@/lib/animations'

// ─── Mini Chart Illustrations ───────────────────────────────────────────────

function MarktstrukturIllustration() {
  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
    >
      <style>{`
        @keyframes msDrawLine {
          from { stroke-dashoffset: 500; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes msGlowGreen {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(52,211,153,0.3)); opacity: 0.7; }
          50% { filter: drop-shadow(0 0 8px rgba(52,211,153,0.8)); opacity: 1; }
        }
        @keyframes msGlowRed {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(248,113,113,0.3)); opacity: 0.7; }
          50% { filter: drop-shadow(0 0 8px rgba(248,113,113,0.8)); opacity: 1; }
        }
        @keyframes msBosSlide {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes msFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <defs>
        <linearGradient id="msAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      <line x1="0" y1="20" x2="240" y2="20" stroke="rgba(92,184,240,0.06)" strokeWidth="1" />
      <line x1="0" y1="40" x2="240" y2="40" stroke="rgba(92,184,240,0.06)" strokeWidth="1" />
      <line x1="0" y1="60" x2="240" y2="60" stroke="rgba(92,184,240,0.06)" strokeWidth="1" />
      <line x1="0" y1="80" x2="240" y2="80" stroke="rgba(92,184,240,0.06)" strokeWidth="1" />
      <line x1="60" y1="0" x2="60" y2="95" stroke="rgba(92,184,240,0.04)" strokeWidth="1" />
      <line x1="120" y1="0" x2="120" y2="95" stroke="rgba(92,184,240,0.04)" strokeWidth="1" />
      <line x1="180" y1="0" x2="180" y2="95" stroke="rgba(92,184,240,0.04)" strokeWidth="1" />

      {/* Area fill under price line */}
      <polygon
        points="10,80 35,50 55,65 80,30 105,50 130,18 155,38 180,22 205,42 230,32 230,92 10,92"
        fill="url(#msAreaGrad)"
        style={{ animation: 'msFadeIn 1.5s ease-out forwards' }}
      />

      {/* Price action zigzag with draw animation */}
      <polyline
        points="10,80 35,50 55,65 80,30 105,50 130,18 155,38 180,22 205,42 230,32"
        stroke="#5CB8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="500"
        style={{
          animation: 'msDrawLine 2s ease-out forwards',
          filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.4))',
        }}
      />

      {/* Swing High markers — green glow pulse */}
      <circle cx="80" cy="30" r="5.5" fill="rgba(52,211,153,0.15)" stroke="#34D399" strokeWidth="1.5"
        style={{ animation: 'msGlowGreen 2.5s ease-in-out 0.8s infinite' }} />
      <circle cx="130" cy="18" r="5.5" fill="rgba(52,211,153,0.15)" stroke="#34D399" strokeWidth="1.5"
        style={{ animation: 'msGlowGreen 2.5s ease-in-out 1.2s infinite' }} />
      <circle cx="180" cy="22" r="5.5" fill="rgba(52,211,153,0.15)" stroke="#34D399" strokeWidth="1.5"
        style={{ animation: 'msGlowGreen 2.5s ease-in-out 1.6s infinite' }} />

      {/* Swing Low markers — red glow pulse */}
      <circle cx="55" cy="65" r="5.5" fill="rgba(248,113,113,0.15)" stroke="#F87171" strokeWidth="1.5"
        style={{ animation: 'msGlowRed 2.5s ease-in-out 1s infinite' }} />
      <circle cx="105" cy="50" r="5.5" fill="rgba(248,113,113,0.15)" stroke="#F87171" strokeWidth="1.5"
        style={{ animation: 'msGlowRed 2.5s ease-in-out 1.4s infinite' }} />

      {/* Trend line */}
      <line
        x1="55" y1="65" x2="230" y2="32"
        stroke="#5CB8F0" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
      />

      {/* Labels */}
      <text x="80" y="20" fill="#34D399" fontSize="8" fontFamily="monospace" textAnchor="middle"
        style={{ filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.5))' }}>SH</text>
      <text x="55" y="80" fill="#F87171" fontSize="8" fontFamily="monospace" textAnchor="middle"
        style={{ filter: 'drop-shadow(0 0 3px rgba(248,113,113,0.5))' }}>SL</text>

      {/* BOS label with arrow — animated entrance */}
      <g style={{ animation: 'msBosSlide 0.8s ease-out 1.8s both' }}>
        <text x="155" y="100" fill="#5CB8F0" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.9"
          style={{ filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.5))' }}>BOS</text>
        <line x1="130" y1="95" x2="180" y2="95" stroke="#5CB8F0" strokeWidth="1.5" opacity="0.6" />
        <polygon points="180,92.5 180,97.5 185,95" fill="#5CB8F0" opacity="0.7" />
      </g>
    </svg>
  )
}

function ConfluenceIllustration() {
  const factors = [
    { label: 'VWAP', value: 0.85 },
    { label: 'EMA', value: 0.72 },
    { label: 'RSI', value: 0.60 },
    { label: 'VOL', value: 0.90 },
    { label: 'SES', value: 0.45 },
    { label: 'STR', value: 0.80 },
    { label: 'BIAS', value: 0.95 },
  ]

  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
    >
      <style>{`
        @keyframes cfBarGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes cfShineSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes cfScoreGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(92,184,240,0.2)); }
          50% { filter: drop-shadow(0 0 12px rgba(92,184,240,0.8)); }
        }
        @keyframes cfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <defs>
        {factors.map((f, i) => {
          const color = f.value >= 0.7 ? '#34D399' : f.value >= 0.5 ? '#5AAED8' : '#949DA8'
          return (
            <linearGradient key={`cfGrad${i}`} id={`cfGrad${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="85%" stopColor={color} stopOpacity={0.3 + f.value * 0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0.15 + f.value * 0.3} />
            </linearGradient>
          )
        })}
        <linearGradient id="cfShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {factors.map((f, i) => {
        const y = 6 + i * 15
        const barWidth = f.value * 140
        const color = f.value >= 0.7 ? '#34D399' : f.value >= 0.5 ? '#5AAED8' : '#949DA8'
        return (
          <g key={f.label}>
            <text x="4" y={y + 10} fill="#B0B8C4" fontSize="8" fontFamily="monospace"
              style={{ animation: `cfFadeIn 0.4s ease-out ${i * 0.1}s both` }}>{f.label}</text>
            <g style={{
              transformOrigin: '44px 0',
              animation: `cfBarGrow 0.8s ease-out ${0.15 + i * 0.1}s both`,
            }}>
              <rect x="44" y={y} width={barWidth} height="10" rx="2" fill={`url(#cfGrad${i})`}
                style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
              {/* Shine sweep overlay */}
              <clipPath id={`cfClip${i}`}>
                <rect x="44" y={y} width={barWidth} height="10" rx="2" />
              </clipPath>
              <rect x="44" y={y} width={barWidth} height="10" rx="2"
                fill="url(#cfShine)" clipPath={`url(#cfClip${i})`}
                style={{ animation: `cfShineSweep 3s ease-in-out ${1.5 + i * 0.3}s infinite` }} />
            </g>
            <text x={44 + barWidth + 4} y={y + 9} fill={color} fontSize="7" fontFamily="monospace" opacity="0.9"
              style={{ animation: `cfFadeIn 0.4s ease-out ${0.5 + i * 0.1}s both` }}>
              {Math.round(f.value * 100)}%
            </text>
          </g>
        )
      })}

      {/* Score badge with glow pulse */}
      <g style={{ animation: 'cfScoreGlow 3s ease-in-out 1s infinite' }}>
        <rect x="200" y="30" width="34" height="34" rx="6" fill="#5AAED8" opacity="0.2" />
        <rect x="200" y="30" width="34" height="34" rx="6" stroke="#5CB8F0" strokeWidth="1.5" opacity="0.5" fill="none" />
        <text x="217" y="53" fill="#5CB8F0" fontSize="16" fontFamily="monospace" textAnchor="middle" fontWeight="bold"
          style={{ filter: 'drop-shadow(0 0 6px rgba(92,184,240,0.6))' }}>8</text>
      </g>
      <text x="217" y="24" fill="#B0B8C4" fontSize="7" fontFamily="monospace" textAnchor="middle">SCORE</text>
    </svg>
  )
}

function ZonesIllustration() {
  const histogramWidths = [10, 18, 32, 48, 55, 42, 28, 18, 12, 8]

  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
    >
      <style>{`
        @keyframes znDrawDash {
          from { stroke-dashoffset: 360; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes znPocGlow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(92,184,240,0.3)); opacity: 0.8; }
          50% { filter: drop-shadow(0 0 10px rgba(92,184,240,0.9)); opacity: 1; }
        }
        @keyframes znBarSlide {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes znNpocPulse {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(251,191,36,0.3)); r: 3.5; }
          50% { filter: drop-shadow(0 0 10px rgba(251,191,36,0.9)); r: 5; }
        }
      `}</style>

      <defs>
        <linearGradient id="znHistGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#5CB8F0" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Value Area High — draw animation */}
      <rect x="50" y="15" width="180" height="10" rx="1" fill="#5CB8F0" opacity="0.08" />
      <line x1="50" y1="20" x2="230" y2="20" stroke="#5CB8F0" strokeWidth="1" strokeDasharray="3 2"
        opacity="0.7"
        style={{ strokeDashoffset: 360, animation: 'znDrawDash 1.5s ease-out 0.3s forwards' }} />
      <text x="232" y="23" fill="#B0B8C4" fontSize="7" fontFamily="monospace">VAH</text>

      {/* POC — strongest line with glow pulse */}
      <rect x="50" y="45" width="180" height="12" rx="1" fill="#5CB8F0" opacity="0.15" />
      <line x1="50" y1="51" x2="230" y2="51" stroke="#5CB8F0" strokeWidth="2.5" opacity="0.9"
        style={{ animation: 'znPocGlow 3s ease-in-out 0.8s infinite' }} />
      <text x="232" y="54" fill="#5CB8F0" fontSize="7" fontFamily="monospace" fontWeight="bold"
        style={{ filter: 'drop-shadow(0 0 4px rgba(92,184,240,0.5))' }}>POC</text>

      {/* Value Area Low — draw animation */}
      <rect x="50" y="80" width="180" height="10" rx="1" fill="#5CB8F0" opacity="0.08" />
      <line x1="50" y1="85" x2="230" y2="85" stroke="#5CB8F0" strokeWidth="1" strokeDasharray="3 2"
        opacity="0.7"
        style={{ strokeDashoffset: 360, animation: 'znDrawDash 1.5s ease-out 0.5s forwards' }} />
      <text x="232" y="88" fill="#B0B8C4" fontSize="7" fontFamily="monospace">VAL</text>

      {/* Volume profile histogram — staggered slide-in from left */}
      {histogramWidths.map((w, i) => (
        <rect
          key={i}
          x="10"
          y={8 + i * 10.5}
          width={w}
          height="7"
          rx="1.5"
          fill="url(#znHistGrad)"
          opacity={0.2 + (w / 55) * 0.6}
          style={{
            transformOrigin: '10px 0',
            animation: `znBarSlide 0.6s ease-out ${0.1 + i * 0.06}s both`,
            filter: w >= 42 ? 'drop-shadow(0 0 3px rgba(92,184,240,0.3))' : 'none',
          }}
        />
      ))}

      {/* Naked POC marker — bright yellow pulse */}
      <circle cx="120" cy="105" r="3.5" fill="#FBBF24" opacity="0.9"
        style={{ animation: 'znNpocPulse 2s ease-in-out 1s infinite' }} />
      <text x="128" y="108" fill="#FBBF24" fontSize="7" fontFamily="monospace" opacity="0.9"
        style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }}>nPOC</text>
    </svg>
  )
}

function ContextIllustration() {
  // Deterministic daily session bars
  const dayHeights = [35, 28, 42, 30, 48, 38, 44, 25, 50, 32, 46, 40, 36, 52]

  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
    >
      <style>{`
        @keyframes ctBarGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes ctNowGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(92,184,240,0.3)); }
          50% { filter: drop-shadow(0 0 12px rgba(92,184,240,0.9)); }
        }
        @keyframes ctTimelineDraw {
          from { stroke-dashoffset: 224; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ctNowLabel {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      <defs>
        {dayHeights.map((_, i) => (
          <linearGradient key={`ctGrad${i}`} id={`ctGrad${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5CB8F0" stopOpacity={0.15 + (i / 13) * 0.7} />
            <stop offset="100%" stopColor="#5CB8F0" stopOpacity={0.05 + (i / 13) * 0.25} />
          </linearGradient>
        ))}
      </defs>

      {/* 14 day bars — grow upward, staggered, gradient brighter toward today */}
      {dayHeights.map((h, i) => {
        const x = 10 + i * 16
        const y = 90 - h
        const isToday = i === 13
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width="10"
              height={h}
              rx="2"
              fill={isToday ? '#5CB8F0' : `url(#ctGrad${i})`}
              opacity={isToday ? 0.9 : 1}
              style={{
                transformOrigin: `${x + 5}px 90px`,
                animation: `ctBarGrow 0.5s ease-out ${0.05 * i}s both${isToday ? ', ctNowGlow 2.5s ease-in-out 1s infinite' : ''}`,
              }}
            />
            {isToday && (
              <>
                <text x={x + 5} y={y - 6} fill="#5CB8F0" fontSize="7" fontFamily="monospace" textAnchor="middle"
                  style={{
                    filter: 'drop-shadow(0 0 5px rgba(92,184,240,0.6))',
                    animation: 'ctNowLabel 2s ease-in-out 1s infinite',
                  }}>NOW</text>
                <rect x={x - 1} y={y - 1} width="12" height={h + 2} rx="2.5" stroke="#5CB8F0" strokeWidth="1.5" fill="none" opacity="0.5" />
              </>
            )}
          </g>
        )
      })}

      {/* Timeline — draws itself left to right */}
      <line x1="10" y1="96" x2="234" y2="96" stroke="#4A5568" strokeWidth="1"
        strokeDasharray="224"
        style={{ animation: 'ctTimelineDraw 1.2s ease-out 0.3s both' }} />
      <text x="14" y="108" fill="#7E8A96" fontSize="7" fontFamily="monospace">-14d</text>
      <text x="214" y="108" fill="#5CB8F0" fontSize="7" fontFamily="monospace"
        style={{ filter: 'drop-shadow(0 0 3px rgba(92,184,240,0.4))' }}>heute</text>

      {/* Bars count label */}
      <text x="120" y="115" fill="#7E8A96" fontSize="6" fontFamily="monospace" textAnchor="middle" opacity="0.7">5,460 Bars</text>
    </svg>
  )
}

// ─── Engine Capability Data ─────────────────────────────────────────────────

interface EngineCapability {
  id: string
  title: string
  metric: string
  metricLabel: string
  description: string
  illustration: React.ComponentType
}

const capabilities: EngineCapability[] = [
  {
    id: 'structure',
    title: 'Marktstruktur',
    metric: '~3 Bars',
    metricLabel: 'Trendwechsel-Erkennung vor dem Breakout',
    description:
      'Arctis erkennt Swing Highs, Swing Lows, Trendrichtung und Strukturbrüche automatisch. Du siehst sofort, ob der Markt bullish, bearish oder in einer Range ist.',
    illustration: MarktstrukturIllustration,
  },
  {
    id: 'confluence',
    title: 'Confluence Engine',
    metric: '68%',
    metricLabel: 'Trefferquote bei Score 5+',
    description:
      '7 unabhängige Faktoren — VWAP, EMA, RSI, Volumen, Session, Struktur, Bias — werden zu einem Score verdichtet. Ab Score 5+ steigt die Trefferquote signifikant.',
    illustration: ConfluenceIllustration,
  },
  {
    id: 'zones',
    title: 'Präzise Zonen',
    metric: '0.25pt',
    metricLabel: 'POC-Genauigkeit',
    description:
      'Support und Resistance basierend auf echtem Volumenprofil: POC, Value Area, Naked POCs. Keine willkürlichen Linien — echte Preisniveaus.',
    illustration: ZonesIllustration,
  },
  {
    id: 'context',
    title: '14 Tage Kontext',
    metric: '5,460',
    metricLabel: 'Bars Kontext pro Symbol',
    description:
      'Arctis lädt automatisch 14 Handelstage. Du siehst nicht nur den heutigen Chart, sondern die gesamte Marktgeschichte die relevant ist.',
    illustration: ContextIllustration,
  },
]

// ─── Engine Card ────────────────────────────────────────────────────────────

function EngineCard({ capability, featured = false }: { capability: EngineCapability; featured?: boolean }) {
  const Illustration = capability.illustration

  return (
    <motion.div
      variants={engineCardItem}
      className={`glass-card relative overflow-hidden rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-0.5 ${featured ? 'p-8' : 'p-6'}`}
      style={{ willChange: 'transform' }}
    >
      {/* Accent top border */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: featured
            ? 'linear-gradient(90deg, transparent 0%, rgba(90,174,216,0.6) 30%, rgba(90,174,216,0.8) 50%, rgba(90,174,216,0.6) 70%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(90,174,216,0.4) 50%, transparent 100%)',
        }}
      />

      {/* Subtle radial glow on featured card */}
      {featured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(92,184,240,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Illustration container */}
      <div className={`rounded-lg border border-frost-border-subtle bg-arctic-primary/50 p-4 ${featured ? 'mb-6' : 'mb-5'}`}>
        <Illustration />
      </div>

      {/* Key metric badge */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className={`font-mono font-bold text-ice ${featured ? 'text-3xl' : 'text-2xl'}`}>{capability.metric}</span>
        <span className="text-xs text-frost-muted">{capability.metricLabel}</span>
      </div>

      {/* Title */}
      <h3 className={`font-mono font-semibold uppercase tracking-wider text-ice ${featured ? 'text-base' : 'text-sm'}`}>
        {capability.title}
      </h3>

      {/* Description */}
      <p className={`mt-2 leading-relaxed text-frost-secondary ${featured ? 'text-base' : 'text-sm'}`}>
        {capability.description}
      </p>
    </motion.div>
  )
}

// ─── Data Flow Visualization ────────────────────────────────────────────────

function DataFlowVisualization() {
  const stages = [
    { label: 'Raw Bars', color: '#949DA8' },
    { label: 'Analyse', color: '#5AAED8' },
    { label: 'Confluence', color: '#5CB8F0' },
    { label: 'Signal', color: '#34D399' },
  ]

  return (
    <div className="relative overflow-hidden rounded-xl border border-frost-border-subtle bg-arctic-primary/50 px-6 py-8">
      <style>{`
        @keyframes flowDot {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100% + 20px)); opacity: 0; }
        }
        @keyframes stagePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(92,184,240,0); }
          50% { box-shadow: 0 0 12px 2px rgba(92,184,240,0.15); }
        }
        @keyframes stageLight {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-2" style={{ flex: i < stages.length - 1 ? 1 : 'none' }}>
            {/* Stage node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.4, duration: 0.5 }}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 48,
                  height: 48,
                  border: `1.5px solid ${stage.color}`,
                  background: `${stage.color}10`,
                  animation: `stagePulse 3s ease-in-out ${i * 0.4}s infinite`,
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: stage.color,
                    boxShadow: `0 0 8px ${stage.color}`,
                    animation: `stageLight 2s ease-in-out ${i * 0.4}s infinite`,
                  }}
                />
              </div>
              <span className="text-frost-muted font-mono text-[10px] text-center whitespace-nowrap">
                {stage.label}
              </span>
            </motion.div>

            {/* Connecting line with animated dots */}
            {i < stages.length - 1 && (
              <div className="relative flex-1 mx-1" style={{ height: 2 }}>
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(92,184,240,0.1)' }}
                />
                {[0, 1, 2].map((dotIdx) => (
                  <div
                    key={dotIdx}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      background: stages[i + 1].color,
                      boxShadow: `0 0 6px ${stages[i + 1].color}`,
                      animation: `flowDot 2s linear ${i * 0.4 + dotIdx * 0.6}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EngineShowcase Section ─────────────────────────────────────────────────

export function EngineShowcase() {
  return (
    <section id="engine" className="section-padding relative">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '900px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(90,174,216,0.04) 0%, transparent 70%)',
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
            Engine
          </p>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl lg:text-5xl">
            Was Arctis sieht,
            <br />
            <span className="text-gradient-frost">bevor du es siehst.</span>
          </h2>
        </motion.div>

        {/* Data Flow Visualization */}
        <motion.div
          className="mb-10"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <DataFlowVisualization />
        </motion.div>

        {/* Asymmetric grid — featured first card spans full width */}
        <motion.div
          className="relative"
          variants={engineStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {/* Connecting lines between cards — subtle visual flow */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" style={{ zIndex: 0 }}>
            {/* Vertical connector from featured card to row below */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: 'calc(50% - 80px)',
                width: '1px',
                height: '60px',
                background: 'linear-gradient(180deg, rgba(90,174,216,0.2) 0%, rgba(90,174,216,0.05) 100%)',
              }}
            />
            {/* Horizontal connector across bottom row */}
            <div
              className="absolute left-[15%] right-[15%]"
              style={{
                bottom: 'calc(50% - 20px)',
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(90,174,216,0.12) 20%, rgba(90,174,216,0.12) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Featured card — Marktstruktur — full width */}
          <div className="relative z-10 mb-4 lg:mb-6">
            <EngineCard capability={capabilities[0]} featured />
          </div>

          {/* Bottom row — 3 smaller cards, asymmetric widths */}
          <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            {capabilities.slice(1).map((cap) => (
              <EngineCard key={cap.id} capability={cap} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
