import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, BarChart2, ClipboardList, Code2, Rocket } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChangelogEntry {
  version: string
  date: string
  title: string
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>
  highlights?: string[]
  items: string[]
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ENTRIES: ChangelogEntry[] = [
  {
    version: 'v0.5.0',
    date: '2026-03-25',
    title: 'RalphLoop Masterplan Execution',
    icon: Zap,
    highlights: [
      'SciChart chart engine ported from AlgoView (1849 lines)',
      'Real-time tick WebSocket (zero-delay, 60fps via requestAnimationFrame)',
      '/api/snapshot: single endpoint replaces 10 parallel calls',
    ],
    items: [
      'SciChart CandlestickChart fully ported from AlgoView — 1849 lines, production-ready',
      'Real-time tick WebSocket with zero-delay rendering at 60fps via requestAnimationFrame',
      'VWAP RTH-only calculation — no overnight price jumps distorting the level',
      'Session detection engine with real-time progress tracking across 7 market sessions',
      'Setup lifecycle engine with 9 states: forming, confirmed, entry, active, target, invalidated, expired, stopped, completed',
      'Travis MCP BFF integration with local analysis — no external API dependency',
      '/api/snapshot endpoint consolidates 10 parallel calls into a single round trip',
      'Drawing system with server-side persistence across sessions',
      'Volume Profile rendered with Arctic Frost color palette',
      'Bias engine with live price tracking and automatic invalidation detection',
    ],
  },
  {
    version: 'v0.4.0',
    date: '2026-03-24',
    title: 'Chart Integration',
    icon: BarChart2,
    items: [
      'SciChart integration initiated — chart pipeline architecture defined',
      'Rithmic live data feed connected via WebSocket bridge',
      'Basic VWAP and EMA indicators rendering on chart',
      'Session panels with time-of-day context',
      'ArctisChartWrapper adapter layer for AlgoView-compatible data format',
    ],
  },
  {
    version: 'v0.3.0',
    date: '2026-03-22',
    title: 'Masterpack Audit',
    icon: ClipboardList,
    items: [
      'Reality audit of all subsystems — identified 12 critical wiring gaps',
      '230-task phased implementation plan created (P0 through P7)',
      'Website redesign focused on trader-first messaging over feature lists',
      'Known issues documented: VWAP/EMA toggle wiring, zone rendering, drawing forwarding',
      'Backend route audit — setups.py and travis.py identified as unmounted',
      'Type consolidation plan: OHLCVBar vs Bar duplication resolved',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-03-20',
    title: 'Foundation',
    icon: Code2,
    items: [
      'FastAPI engine with analysis endpoints on port 28080',
      'React 19 frontend with Tailwind CSS and custom CSS variable design system',
      'TimescaleDB integration for time-series market data storage',
      'Basic chart implementation with lightweight-charts library',
      'Zustand state management for market and settings stores',
      'Initial Rithmic data feed connection established',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-03-15',
    title: 'Initial Release',
    icon: Rocket,
    items: [
      'Project bootstrapped — Arctis trading decision support platform',
      'Market data connection to CME futures feeds',
      'Basic dashboard with market status overview',
      'Arctic Frost design system defined: Ice Blue #5CB8F0 accent',
      'Development environment configured: pnpm, Vite, FastAPI, TimescaleDB',
    ],
  },
]

// ── Animation variants ────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function ChangelogNavbar() {
  const navigate = useNavigate()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: 'rgba(8,11,16,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(92,184,240,0.1)',
      }}
    >
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2 text-sm transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
          style={{ color: 'rgba(140,160,180,0.6)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-frost-white)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(140,160,180,0.6)')}
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back
        </button>

        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon points="16,2 26,9 26,23 16,30 6,23 6,9" fill="none" stroke="rgba(92,184,240,0.7)" strokeWidth="1.4" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <line x1="6" y1="9" x2="26" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <line x1="26" y1="9" x2="6" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="2.5" fill="rgba(92,184,240,0.6)" />
            <circle cx="16" cy="16" r="1" fill="#5CB8F0" />
          </svg>
          <span className="font-display font-semibold tracking-widest text-sm" style={{ color: 'var(--color-frost-white)', letterSpacing: '0.18em' }}>
            ARCTIS
          </span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
          style={{
            background: 'rgba(92,184,240,0.12)',
            border: '1px solid rgba(92,184,240,0.25)',
            color: '#5CB8F0',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(92,184,240,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(92,184,240,0.12)'
          }}
        >
          App offnen
        </button>
      </div>
    </header>
  )
}

// ── Entry Card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, isLatest }: { entry: ChangelogEntry; isLatest: boolean }) {
  const Icon = entry.icon

  return (
    <motion.article
      variants={fadeInUp}
      className="relative"
    >
      {/* Timeline connector */}
      <div
        className="absolute left-[23px] top-12 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(92,184,240,0.2) 0%, rgba(92,184,240,0.04) 100%)' }}
        aria-hidden="true"
      />

      <div className="flex gap-6">
        {/* Timeline dot */}
        <div className="relative flex-shrink-0 mt-1">
          <div
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: isLatest ? 'rgba(92,184,240,0.15)' : 'rgba(92,184,240,0.07)',
              border: isLatest ? '1px solid rgba(92,184,240,0.4)' : '1px solid rgba(92,184,240,0.15)',
              boxShadow: isLatest ? '0 0 20px rgba(92,184,240,0.15)' : 'none',
            }}
          >
            <Icon size={20} strokeWidth={1.8} style={{ color: isLatest ? '#5CB8F0' : 'rgba(92,184,240,0.5)' }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-12 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-bold tracking-wider"
              style={{
                background: isLatest ? 'rgba(92,184,240,0.15)' : 'rgba(92,184,240,0.07)',
                border: isLatest ? '1px solid rgba(92,184,240,0.35)' : '1px solid rgba(92,184,240,0.12)',
                color: isLatest ? '#5CB8F0' : 'rgba(92,184,240,0.6)',
              }}
            >
              {entry.version}
            </span>
            {isLatest && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 5px rgba(52,211,153,0.8)' }} />
                Latest
              </span>
            )}
            <span className="font-mono text-xs" style={{ color: 'rgba(140,160,180,0.5)' }}>
              {entry.date}
            </span>
          </div>

          <h2
            className="font-display text-xl font-semibold mb-1"
            style={{ color: 'var(--color-frost-white)' }}
          >
            {entry.title}
          </h2>

          {/* Highlights (only for latest) */}
          {entry.highlights && entry.highlights.length > 0 && (
            <div
              className="mt-4 mb-5 rounded-xl p-4"
              style={{
                background: 'rgba(92,184,240,0.05)',
                border: '1px solid rgba(92,184,240,0.12)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(92,184,240,0.6)' }}>
                Highlights
              </p>
              <ul className="space-y-2">
                {entry.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-frost-secondary)' }}>
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full" style={{ background: '#5CB8F0' }} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full item list */}
          <ul className="space-y-2.5 mt-4">
            {entry.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'rgba(140,160,180,0.75)' }}>
                <span className="mt-2 h-px w-3 flex-shrink-0" style={{ background: 'rgba(92,184,240,0.3)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ChangelogPage() {
  useEffect(() => {
    const prev = document.body.style.overflow
    const prevH = document.body.style.height
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.scrollBehavior = 'smooth'
    document.title = 'Arctis — Changelog'
    return () => {
      document.body.style.overflow = prev
      document.body.style.height = prevH || '100vh'
    }
  }, [])

  return (
    <div style={{ background: 'var(--color-arctic-base)', minHeight: '100vh' }}>
      <ChangelogNavbar />

      {/* Background atmosphere */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(92,184,240,0.05) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 35% at 70% 80%, rgba(92,184,240,0.03) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-24">
        {/* Page header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          <motion.p
            variants={fadeInUp}
            className="text-sm font-medium uppercase tracking-[0.15em] mb-4"
            style={{ color: '#5CB8F0' }}
          >
            Release Notes
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl font-bold sm:text-5xl leading-tight"
            style={{ color: 'var(--color-frost-white)' }}
          >
            Changelog
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-lg leading-relaxed max-w-xl"
            style={{ color: 'rgba(140,160,180,0.8)' }}
          >
            Every release, documented. Arctis ships fast — here is what changed and when.
          </motion.p>

          {/* Divider */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(92,184,240,0.3), transparent)' }}
          />
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {ENTRIES.map((entry, index) => (
            <EntryCard
              key={entry.version}
              entry={entry}
              isLatest={index === 0}
            />
          ))}
        </motion.div>

        {/* Footer callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-4 rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(92,184,240,0.04)',
            border: '1px solid rgba(92,184,240,0.1)',
          }}
        >
          <p className="text-sm" style={{ color: 'rgba(140,160,180,0.6)' }}>
            Subscribe to platform updates in the{' '}
            <button
              onClick={() => {
                window.location.href = '/landing'
              }}
              className="underline underline-offset-4 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0 text-sm"
              style={{ color: '#5CB8F0' }}
            >
              footer
            </button>
            . No marketing, only release notes.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
