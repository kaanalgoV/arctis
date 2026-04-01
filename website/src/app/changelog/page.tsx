import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

// ─── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'All Arctis releases, improvements, and bug fixes. Stay up to date with the latest changes to the platform.',
  openGraph: {
    title: 'Changelog',
    description:
      'All Arctis releases, improvements, and bug fixes.',
    url: 'https://arctis.trade/changelog',
    type: 'website',
  },
}

// ─── Release Data ──────────────────────────────────────────────────────────────

interface ChangelogEntry {
  version: string
  date: string
  title: string
  tag: 'major' | 'minor' | 'patch'
  changes: string[]
}

const RELEASES: ChangelogEntry[] = [
  {
    version: '0.6.0',
    date: '2026-03-27',
    title: 'Website Deep Rebuild',
    tag: 'minor',
    changes: [
      'Hero section: dramatically improved chart mockup with volume bars, VWAP line, session separators, supply/demand zones, and sequential candle fade-in animation',
      'Hero headline: word-by-word blur-to-sharp reveal animation with staggered timing',
      'Added subtle dot-grid background pattern behind hero text',
      'Engine Showcase: each card now displays a key metric (e.g. "68% Trefferquote bei Score 5+")',
      'Engine cards: staggered 100ms reveal animation, larger SVG illustrations',
      'Replay Showcase: bigger mock UI, CSS candle-reveal animation, glow effect, pulsing date badge',
      'Section dividers: enhanced with glow bloom effect for smoother transitions',
      'Navigation: added Engine and Changelog links',
      'New /changelog route with full release timeline',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-03-25',
    title: 'Marketing Website Launch',
    tag: 'major',
    changes: [
      'Full Arctic Frost marketing website built with Next.js 15',
      'Hero section with interactive candlestick chart mockup',
      'Engine Showcase, Features, Pricing, Comparison, Testimonials, FAQ sections',
      'Replay Showcase with mock playback UI',
      'Signal Showcase with real-time signal simulation',
      'Blog system with MDX-powered articles',
      'Frost particle effects and parallax scrolling',
      'Fully responsive design with mobile navigation',
      'SEO: structured data, Open Graph, sitemap, robots.txt',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-03-23',
    title: 'Engine Optimization Pack',
    tag: 'patch',
    changes: [
      'Reduced engine analysis latency by 40% through parallel computation',
      'Fixed VWAP calculation drift on overnight sessions',
      'Improved confluence score accuracy for low-volume periods',
      'Added session boundary markers to chart overlays',
      'Fixed WebSocket reconnection logic on network interruptions',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-03-20',
    title: 'Replay Mode',
    tag: 'minor',
    changes: [
      'Full session replay: select any date and step through bars with engine analysis',
      'Configurable playback speeds: 1x, 5x, 10x, 25x',
      'Engine signals and zones rendered in real-time during replay',
      'Progress bar with scrubbing support',
      'Replay sessions persist state across page refreshes',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-03-14',
    title: 'Confluence Engine v2',
    tag: 'minor',
    changes: [
      'Complete rewrite of confluence scoring: 7 independent factors',
      'New directional bias calculation with weighted factor analysis',
      'VWAP and EMA distance scoring with adaptive thresholds',
      'Volume profile integration: POC, Value Area, Naked POCs',
      'Real-time setup detection with entry/stop/target levels',
      'Score visualization in the analysis indicator strip',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-03-05',
    title: 'Chart Pipeline Overhaul',
    tag: 'minor',
    changes: [
      'SciChart-based candlestick chart with hardware-accelerated rendering',
      'Overlay system: EMA, VWAP, price levels, structure breaks',
      'Timeframe selector: 1m, 5m, 15m, 1H, 4H, D',
      '14-day automatic data loading for full market context',
      'Zustand state management for market data and settings',
      'WebSocket live bar updates with automatic reconnection',
    ],
  },
]

// ─── Tag Badge ─────────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: ChangelogEntry['tag'] }) {
  const styles = {
    major: {
      bg: 'rgba(52,211,153,0.1)',
      border: 'rgba(52,211,153,0.2)',
      text: '#34D399',
      label: 'Major',
    },
    minor: {
      bg: 'rgba(92,184,240,0.1)',
      border: 'rgba(92,184,240,0.2)',
      text: '#5AAED8',
      label: 'Minor',
    },
    patch: {
      bg: 'rgba(148,157,168,0.1)',
      border: 'rgba(148,157,168,0.2)',
      text: '#949DA8',
      label: 'Patch',
    },
  }

  const s = styles[tag]

  return (
    <span
      className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
      }}
    >
      {s.label}
    </span>
  )
}

// ─── Release Card ──────────────────────────────────────────────────────────────

function ReleaseCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline line */}
      <div
        className="absolute left-[7px] top-3 bottom-0 w-px"
        style={{
          background: 'linear-gradient(180deg, rgba(92,184,240,0.3) 0%, rgba(53,61,72,0.3) 100%)',
        }}
      />

      {/* Timeline dot */}
      <div
        className="absolute left-0 top-[6px] size-[15px] rounded-full border-2"
        style={{
          borderColor: entry.tag === 'major' ? '#34D399' : '#5AAED8',
          background: 'var(--color-arctic-base)',
        }}
      >
        <div
          className="absolute inset-[3px] rounded-full"
          style={{
            background: entry.tag === 'major' ? '#34D399' : '#5AAED8',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-mono text-lg font-bold text-frost-white">
          v{entry.version}
        </span>
        <TagBadge tag={entry.tag} />
        <span className="font-mono text-xs text-frost-muted">{entry.date}</span>
      </div>

      {/* Title */}
      <h3 className="font-display text-xl font-semibold text-frost-white mb-3">
        {entry.title}
      </h3>

      {/* Changes */}
      <ul className="space-y-2">
        {entry.changes.map((change, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="mt-2 size-1 shrink-0 rounded-full"
              style={{ background: 'rgba(92,184,240,0.5)' }}
            />
            <span className="text-sm leading-relaxed text-frost-secondary">
              {change}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Changelog Page ────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-arctic-base pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          {/* Page Header */}
          <div className="mb-12">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-ice">
              Changelog
            </p>
            <h1 className="font-display text-4xl font-bold text-frost-white sm:text-5xl">
              Was sich <span className="text-gradient-frost">geaendert hat.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-frost-secondary">
              Alle Releases, Verbesserungen und Bugfixes. Chronologisch, transparent, vollstaendig.
            </p>
          </div>

          {/* Release Timeline */}
          <div className="relative">
            {RELEASES.map((entry) => (
              <ReleaseCard key={entry.version} entry={entry} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
