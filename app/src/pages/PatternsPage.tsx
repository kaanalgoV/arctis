import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, Zap, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatternsPageProps {
  data: PatternsAPIData | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    hour12: false,
  })
}

function formatWinRate(win_rate: number | null): string {
  if (win_rate === null) return '--'
  if (win_rate > 1) return `${Math.round(win_rate)}%`
  return `${Math.round(win_rate * 100)}%`
}

const DIR_CONFIG = {
  long: { label: 'LONG', color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', icon: TrendingUp },
  short: { label: 'SHORT', color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: TrendingDown },
  neutral: { label: 'NEUTRAL', color: '#828D98', bg: 'rgba(130,141,152,0.08)', border: 'rgba(130,141,152,0.2)', icon: Minus },
} as const

function getDir(direction: string) {
  if (direction === 'long') return DIR_CONFIG.long
  if (direction === 'short') return DIR_CONFIG.short
  return DIR_CONFIG.neutral
}

const CONF_COLORS: Record<string, string> = {
  high: '#5CB8F0',
  medium: '#F7941D',
  med: '#F7941D',
  low: '#828D98',
}

// ── Animations ────────────────────────────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-xl"
        style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-subtle)' }}
      >
        <Zap size={22} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div className="text-center">
        <span className="font-sans font-semibold block" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          No Patterns Detected
        </span>
        <span className="font-mono block mt-1" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          Patterns will appear when detected on the active chart
        </span>
      </div>
    </div>
  )
}

// ── Pattern Row ───────────────────────────────────────────────────────────────

interface PatternRowProps {
  index: number
  pattern: string
  direction: string
  winRate: number | null
  profitFactor: number | null
  sampleSize: number | null
  confidence: string
  timestamp: number
  detail: string
  category: string
}

function PatternRow({
  index, pattern, direction, winRate, profitFactor, sampleSize,
  confidence, timestamp, detail, category,
}: PatternRowProps) {
  const dir = getDir(direction)
  const DirIcon = dir.icon
  const confColor = CONF_COLORS[confidence?.toLowerCase()] ?? '#828D98'
  const hasStats = winRate !== null && winRate > 0

  return (
    <motion.div
      variants={fadeUp}
      className="group grid items-center gap-3 px-4 py-3 border-b transition-colors duration-100 hover:bg-[var(--color-surface-secondary)]"
      style={{
        gridTemplateColumns: '1fr 70px 65px 55px 55px 65px 50px',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {/* Pattern name + detail */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: dir.bg, border: `1px solid ${dir.border}` }}
        >
          <DirIcon size={13} strokeWidth={2} style={{ color: dir.color }} />
        </div>
        <div className="min-w-0">
          <span className="font-sans font-semibold block truncate" style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
            {pattern}
          </span>
          <span className="font-mono block truncate" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
            {detail || category}
          </span>
        </div>
      </div>

      {/* Direction badge */}
      <div className="flex justify-center">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded font-mono uppercase font-extrabold"
          style={{ fontSize: 8, letterSpacing: '0.1em', background: dir.bg, color: dir.color, border: `1px solid ${dir.border}` }}
        >
          {dir.label}
        </span>
      </div>

      {/* Win rate */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="font-mono tabular-nums font-semibold"
          style={{
            fontSize: 13,
            color: hasStats
              ? (winRate! > 50 ? '#34D399' : winRate! < 35 ? '#F87171' : 'var(--color-text-secondary)')
              : 'var(--color-text-muted)',
          }}
        >
          {formatWinRate(winRate)}
        </span>
        {hasStats && (
          <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--color-surface-elevated)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, winRate! > 1 ? winRate! : winRate! * 100)}%`,
                background: winRate! > 50 ? '#34D399' : winRate! < 35 ? '#F87171' : 'var(--color-text-secondary)',
              }}
            />
          </div>
        )}
      </div>

      {/* Profit Factor */}
      <div className="text-center">
        <span
          className="font-mono tabular-nums font-semibold"
          style={{
            fontSize: 13,
            color: profitFactor != null && profitFactor >= 1.5 ? '#34D399'
              : profitFactor != null && profitFactor < 1.0 ? '#F87171'
              : 'var(--color-text-muted)',
          }}
        >
          {profitFactor != null ? `${profitFactor.toFixed(1)}x` : '--'}
        </span>
      </div>

      {/* Trades */}
      <div className="text-center">
        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {sampleSize != null ? `n=${sampleSize}` : '--'}
        </span>
      </div>

      {/* Confidence */}
      <div className="flex justify-center">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded font-mono uppercase font-extrabold"
          style={{ fontSize: 8, letterSpacing: '0.1em', background: `${confColor}10`, color: confColor, border: `1px solid ${confColor}25` }}
        >
          {confidence || '--'}
        </span>
      </div>

      {/* Timestamp */}
      <div className="text-right">
        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {formatTime(timestamp)}
        </span>
      </div>
    </motion.div>
  )
}

// ── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryStats({ data }: { data: PatternsAPIData }) {
  const anns = data.annotations
  const longCount = anns.filter((a) => a.direction === 'long').length
  const shortCount = anns.filter((a) => a.direction === 'short').length
  const neutralCount = anns.length - longCount - shortCount

  return (
    <div
      className="flex items-center gap-4 px-4 py-2.5 border-b"
      style={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-subtle)' }}
    >
      {/* Total */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Total</span>
        <span className="font-mono tabular-nums font-bold" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{anns.length}</span>
      </div>

      <div className="w-px h-4" style={{ background: 'var(--color-border-subtle)' }} />

      {/* Direction breakdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: '#34D399' }} />
          <span className="font-mono tabular-nums" style={{ fontSize: 10, color: '#34D399' }}>{longCount} Long</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: '#F87171' }} />
          <span className="font-mono tabular-nums" style={{ fontSize: 10, color: '#F87171' }}>{shortCount} Short</span>
        </div>
        {neutralCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#828D98' }} />
            <span className="font-mono tabular-nums" style={{ fontSize: 10, color: '#828D98' }}>{neutralCount} Neutral</span>
          </div>
        )}
      </div>

      {/* Day context */}
      <div className="ml-auto flex items-center gap-4">
        {data.day_bias && data.day_bias !== 'unknown' && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Bias</span>
            <span
              className="font-mono uppercase font-bold"
              style={{
                fontSize: 10,
                color: data.day_bias.toLowerCase().includes('long') ? '#34D399'
                  : data.day_bias.toLowerCase().includes('short') ? '#F87171'
                  : '#5CB8F0',
              }}
            >
              {data.day_bias}
            </span>
          </div>
        )}
        {data.day_type && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Type</span>
            <span className="font-mono uppercase" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
              {data.day_type}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Column Header ─────────────────────────────────────────────────────────────

type SortKey = 'timestamp' | 'winRate' | 'profitFactor' | 'confidence'

function ColHeader({ label, sortKey, active, dir, onClick }: {
  label: string; sortKey: SortKey; active: boolean; dir: 'asc' | 'desc'; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-0.5 font-mono uppercase tracking-[0.12em] transition-colors cursor-pointer outline-none"
      style={{ fontSize: 8, color: active ? '#5CB8F0' : 'var(--color-text-muted)' }}
    >
      {label}
      {active && (dir === 'desc' ? <ChevronDown size={8} strokeWidth={3} /> : <ChevronUp size={8} strokeWidth={3} />)}
    </button>
  )
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'long' | 'short' | 'neutral'

// ── Main Component ────────────────────────────────────────────────────────────

export function PatternsPage({ data }: PatternsPageProps) {
  const annotations = data?.annotations ?? []
  const [sortBy, setSortBy] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<FilterKey>('all')

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  const filtered = filter === 'all'
    ? annotations
    : annotations.filter(a => {
        if (filter === 'long') return a.direction === 'long'
        if (filter === 'short') return a.direction === 'short'
        return a.direction !== 'long' && a.direction !== 'short'
      })

  const sorted = [...filtered].sort((a, b) => {
    const m = sortDir === 'desc' ? -1 : 1
    switch (sortBy) {
      case 'winRate': return m * ((a.win_rate ?? 0) - (b.win_rate ?? 0))
      case 'profitFactor': return m * ((a.profit_factor ?? 0) - (b.profit_factor ?? 0))
      case 'timestamp': return m * (a.timestamp - b.timestamp)
      case 'confidence': {
        const o = { high: 3, medium: 2, med: 2, low: 1 }
        return m * ((o[a.confidence?.toLowerCase() as keyof typeof o] ?? 0) - (o[b.confidence?.toLowerCase() as keyof typeof o] ?? 0))
      }
      default: return 0
    }
  })

  const longCount = annotations.filter(a => a.direction === 'long').length
  const shortCount = annotations.filter(a => a.direction === 'short').length

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-surface-base)' }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-0" style={{ background: 'var(--color-surface-base)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'rgba(92,184,240,0.08)', border: '1px solid rgba(92,184,240,0.15)' }}
            >
              <Zap size={14} strokeWidth={1.75} style={{ color: '#5CB8F0' }} />
            </div>
            <div>
              <h1 className="font-sans font-bold" style={{ fontSize: 16, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                Pattern Library
              </h1>
              <p className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                Live-detected patterns on current chart
              </p>
            </div>
          </div>

          {/* Filter pills */}
          {annotations.length > 0 && (
            <div className="flex items-center gap-0.5 p-0.5 rounded-md" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-subtle)' }}>
              {([
                { key: 'all' as FilterKey, label: 'All', count: annotations.length },
                { key: 'long' as FilterKey, label: 'Long', count: longCount, color: '#34D399' },
                { key: 'short' as FilterKey, label: 'Short', count: shortCount, color: '#F87171' },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'relative px-2 py-1 rounded font-mono uppercase tracking-[0.08em] transition-all duration-150',
                    'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
                  )}
                  style={{
                    fontSize: 9,
                    color: filter === f.key ? (f.color ?? '#5CB8F0') : 'var(--color-text-muted)',
                    background: filter === f.key ? (f.color ? f.color + '10' : 'var(--color-accent-muted)') : 'transparent',
                  }}
                >
                  {f.label} {f.count > 0 && <span className="ml-0.5 tabular-nums font-bold">{f.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {data && annotations.length > 0 && <SummaryStats data={data} />}

      {/* Content */}
      {annotations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div
            className="sticky top-0 z-10 grid items-center gap-3 px-4 py-2 border-b"
            style={{
              gridTemplateColumns: '1fr 70px 65px 55px 55px 65px 50px',
              background: 'var(--color-surface-secondary)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Pattern</span>
            <span className="font-mono uppercase tracking-[0.12em] text-center" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Direction</span>
            <div className="flex justify-center"><ColHeader label="WR" sortKey="winRate" active={sortBy === 'winRate'} dir={sortDir} onClick={() => handleSort('winRate')} /></div>
            <div className="flex justify-center"><ColHeader label="PF" sortKey="profitFactor" active={sortBy === 'profitFactor'} dir={sortDir} onClick={() => handleSort('profitFactor')} /></div>
            <span className="font-mono uppercase tracking-[0.12em] text-center" style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>Trades</span>
            <div className="flex justify-center"><ColHeader label="Conf." sortKey="confidence" active={sortBy === 'confidence'} dir={sortDir} onClick={() => handleSort('confidence')} /></div>
            <div className="flex justify-end"><ColHeader label="Time" sortKey="timestamp" active={sortBy === 'timestamp'} dir={sortDir} onClick={() => handleSort('timestamp')} /></div>
          </div>

          {/* Rows */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            {sorted.map((ann, idx) => (
              <PatternRow
                key={`${ann.pattern}-${ann.timestamp}-${idx}`}
                index={idx}
                pattern={ann.pattern}
                direction={ann.direction}
                winRate={ann.win_rate}
                profitFactor={ann.profit_factor}
                sampleSize={ann.sample_size}
                confidence={ann.confidence}
                timestamp={ann.timestamp}
                detail={ann.detail}
                category={ann.category}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
