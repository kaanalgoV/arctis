import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChangeTag = 'New' | 'Fix' | 'Improved'

interface ChangeItem {
  tag: ChangeTag
  text: string
}

interface Release {
  version: string
  date: string
  items: ChangeItem[]
}

// ── Data ──────────────────────────────────────────────────────────────────────

const RELEASES: Release[] = [
  {
    version: '0.6.0',
    date: 'March 28, 2026',
    items: [
      { tag: 'New', text: 'Premium changelog page with timeline layout and categorized entries' },
      { tag: 'Improved', text: 'AI assistant renamed from Travis to Arctis AI across the platform' },
      { tag: 'Fix', text: 'Removed confusing BUY/SELL markers that showed both directions simultaneously' },
      { tag: 'Fix', text: 'LIVE badge now shows correctly when Rithmic feed is connected' },
      { tag: 'Improved', text: 'Chart performance — reduced default bar range from 60 to 5 days' },
      { tag: 'New', text: 'Full setup guide with API keys and database credentials' },
    ],
  },
  {
    version: '0.5.0',
    date: 'March 25, 2026',
    items: [
      { tag: 'New', text: 'SciChart candlestick engine (1849 lines, production-ready)' },
      { tag: 'New', text: 'Real-time tick WebSocket with zero-delay rendering at 60fps' },
      { tag: 'New', text: 'Consolidated /api/snapshot endpoint replaces 10 parallel API calls' },
      { tag: 'New', text: 'Session detection engine with real-time progress across 7 market sessions' },
      { tag: 'New', text: 'Setup lifecycle engine with 9 states from forming to completed' },
      { tag: 'New', text: 'Arctis AI assistant with local analysis — no external API dependency' },
      { tag: 'Improved', text: 'VWAP calculation restricted to RTH only — no overnight price distortion' },
      { tag: 'New', text: 'Drawing system with server-side persistence across sessions' },
      { tag: 'New', text: 'Volume profile rendered with Arctic Frost color palette' },
      { tag: 'New', text: 'Bias engine with live price tracking and automatic invalidation' },
    ],
  },
  {
    version: '0.4.0',
    date: 'March 24, 2026',
    items: [
      { tag: 'New', text: 'SciChart integration with full chart pipeline architecture' },
      { tag: 'New', text: 'Rithmic live data feed connected via WebSocket bridge' },
      { tag: 'New', text: 'VWAP and EMA indicators rendering on chart' },
      { tag: 'New', text: 'Session panels with time-of-day market context' },
      { tag: 'New', text: 'ArctisChartWrapper adapter for SciChart data format' },
    ],
  },
  {
    version: '0.3.0',
    date: 'March 22, 2026',
    items: [
      { tag: 'Improved', text: 'Full reality audit of all subsystems — identified 12 critical wiring gaps' },
      { tag: 'New', text: '230-task phased implementation plan (P0 through P7)' },
      { tag: 'Improved', text: 'Website redesigned with trader-first messaging' },
      { tag: 'Fix', text: 'Documented broken VWAP/EMA toggles, zone rendering, and drawing forwarding' },
      { tag: 'Fix', text: 'Identified unmounted backend routes (setups, legacy AI route)' },
      { tag: 'Improved', text: 'Type consolidation plan: OHLCVBar vs Bar duplication resolved' },
    ],
  },
  {
    version: '0.2.0',
    date: 'March 20, 2026',
    items: [
      { tag: 'New', text: 'FastAPI engine with analysis endpoints on port 28080' },
      { tag: 'New', text: 'React 19 frontend with Tailwind CSS and custom design tokens' },
      { tag: 'New', text: 'TimescaleDB integration for time-series market data' },
      { tag: 'New', text: 'Zustand state management for market and settings stores' },
      { tag: 'New', text: 'Initial Rithmic data feed connection established' },
    ],
  },
  {
    version: '0.1.0',
    date: 'March 15, 2026',
    items: [
      { tag: 'New', text: 'Project bootstrapped — Arctis trading decision support platform' },
      { tag: 'New', text: 'Market data connection to CME futures feeds' },
      { tag: 'New', text: 'Arctic Frost design system: Ice Blue #5CB8F0 accent' },
      { tag: 'New', text: 'Development environment configured (pnpm, Vite, FastAPI, TimescaleDB)' },
    ],
  },
]

// ── Tag colors ────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<ChangeTag, { bg: string; border: string; color: string }> = {
  New: {
    bg: 'rgba(92,184,240,0.10)',
    border: 'rgba(92,184,240,0.30)',
    color: '#5CB8F0',
  },
  Fix: {
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.30)',
    color: '#F87171',
  },
  Improved: {
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.30)',
    color: '#34D399',
  },
}

// ── Animation ─────────────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function ChangelogNavbar() {
  const navigate = useNavigate()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,11,16,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(92,184,240,0.1)',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2 text-sm transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
          style={{ color: 'rgba(140,160,180,0.6)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E2E8F0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(140,160,180,0.6)')}
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Zurueck
        </button>

        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon points="16,2 26,9 26,23 16,30 6,23 6,9" fill="none" stroke="rgba(92,184,240,0.7)" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="2.5" fill="rgba(92,184,240,0.6)" />
            <circle cx="16" cy="16" r="1" fill="#5CB8F0" />
          </svg>
          <span
            className="font-semibold tracking-widest text-xs"
            style={{ color: '#E2E8F0', letterSpacing: '0.18em' }}
          >
            ARCTIS
          </span>
        </div>

        <button
          onClick={() => navigate('/chart')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
          style={{
            background: 'rgba(92,184,240,0.10)',
            border: '1px solid rgba(92,184,240,0.25)',
            color: '#5CB8F0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(92,184,240,0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(92,184,240,0.10)')}
        >
          Zum Chart
        </button>
      </div>
    </header>
  )
}

// ── Tag Badge ─────────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: ChangeTag }) {
  const s = TAG_STYLES[tag]
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide shrink-0"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        minWidth: 64,
        justifyContent: 'center',
      }}
    >
      {tag}
    </span>
  )
}

// ── Release Card ──────────────────────────────────────────────────────────────

function ReleaseCard({ release, isLatest }: { release: Release; isLatest: boolean }) {
  return (
    <motion.article variants={fadeInUp} className="relative">
      {/* Timeline connector line */}
      <div
        className="absolute left-[7px] top-8 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(92,184,240,0.15) 0%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="flex gap-5">
        {/* Timeline dot */}
        <div className="relative flex-shrink-0 mt-1.5">
          <div
            className="relative z-10 w-[15px] h-[15px] rounded-full"
            style={{
              background: isLatest ? 'rgba(92,184,240,0.25)' : 'rgba(92,184,240,0.08)',
              border: isLatest ? '2px solid rgba(92,184,240,0.6)' : '1px solid rgba(92,184,240,0.2)',
              boxShadow: isLatest ? '0 0 12px rgba(92,184,240,0.2)' : 'none',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 pb-10 min-w-0">
          {/* Version + date header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="text-base font-bold tracking-tight"
              style={{
                color: isLatest ? '#E2E8F0' : 'rgba(226,232,240,0.7)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {release.version}
            </span>

            <span
              className="text-xs"
              style={{
                color: 'rgba(140,160,180,0.5)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {release.date}
            </span>

            {isLatest && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: 'rgba(52,211,153,0.10)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  color: '#34D399',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }}
                />
                Latest
              </span>
            )}
          </div>

          {/* Change items */}
          <div className="flex flex-col gap-2">
            {release.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  <TagBadge tag={item.tag} />
                </div>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(140,160,180,0.85)' }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
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
    <div style={{ background: 'var(--color-arctic-base, #080B10)', minHeight: '100vh' }}>
      <ChangelogNavbar />

      {/* Subtle atmospheric glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 35% at 25% 15%, rgba(92,184,240,0.04) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-20">
        {/* Page header */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mb-14">
          <motion.p
            variants={fadeInUp}
            className="text-xs font-medium uppercase tracking-[0.2em] mb-3"
            style={{ color: 'rgba(92,184,240,0.6)' }}
          >
            Release Notes
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-3xl font-bold sm:text-4xl leading-tight"
            style={{ color: '#E2E8F0' }}
          >
            Changelog
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-base leading-relaxed max-w-lg"
            style={{ color: 'rgba(140,160,180,0.7)' }}
          >
            Jedes Release dokumentiert. Arctis liefert schnell — hier siehst du was sich geaendert hat.
          </motion.p>

          {/* Divider */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(92,184,240,0.25), transparent 70%)' }}
          />
        </motion.div>

        {/* Timeline */}
        <motion.div variants={stagger} initial="hidden" animate="visible">
          {RELEASES.map((release, i) => (
            <ReleaseCard key={release.version} release={release} isLatest={i === 0} />
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-6 rounded-xl p-5 text-center"
          style={{
            background: 'rgba(92,184,240,0.03)',
            border: '1px solid rgba(92,184,240,0.08)',
          }}
        >
          <p className="text-xs" style={{ color: 'rgba(140,160,180,0.5)' }}>
            Subscribe to platform updates in the{' '}
            <button
              onClick={() => { window.location.href = '/landing' }}
              className="underline underline-offset-4 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0 text-xs"
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
