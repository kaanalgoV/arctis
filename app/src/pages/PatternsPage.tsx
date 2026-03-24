import { motion } from 'framer-motion'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatternsPageProps {
  data: PatternsAPIData | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000)
  const hh = d.getUTCHours().toString().padStart(2, '0')
  const mm = d.getUTCMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function formatWinRate(win_rate: number | null): string {
  if (win_rate === null) return '--'
  // Backend sends whole numbers (48.0 for 48%), not fractions
  if (win_rate > 1) return `${Math.round(win_rate)}%`
  return `${Math.round(win_rate * 100)}%`
}

function directionColor(direction: string): string {
  if (direction === 'long') return 'var(--color-profit)'
  if (direction === 'short') return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function directionLabel(direction: string): string {
  if (direction === 'long') return 'LONG'
  if (direction === 'short') return 'SHORT'
  return direction.toUpperCase()
}

function confidenceColor(confidence: string): string {
  const c = confidence.toLowerCase()
  if (c === 'high') return 'var(--color-profit)'
  if (c === 'low') return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-subtle)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <span
        className="font-mono uppercase tracking-widest"
        style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
      >
        No patterns detected
      </span>
      <span
        className="font-mono"
        style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.6 }}
      >
        Patterns will appear when detected on the chart
      </span>
    </div>
  )
}

// ── Pattern Table Row ─────────────────────────────────────────────────────────

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
  index,
  pattern,
  direction,
  winRate,
  profitFactor,
  sampleSize,
  confidence,
  timestamp,
  detail,
  category,
}: PatternRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group border-b"
      style={{ borderColor: 'var(--color-border-subtle)' }}
    >
      {/* Pattern name + detail */}
      <td className="py-3 pl-4 pr-2">
        <div className="flex flex-col gap-0.5">
          <span
            className="font-sans font-medium"
            style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
          >
            {pattern}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
          >
            {detail || category}
          </span>
        </div>
      </td>

      {/* Direction */}
      <td className="py-3 px-2">
        <div
          className="inline-flex items-center px-2 py-0.5 rounded"
          style={{
            background:
              direction === 'long'
                ? 'rgba(0, 135, 87, 0.12)'
                : direction === 'short'
                ? 'rgba(239, 65, 54, 0.12)'
                : 'var(--color-surface-raised)',
            border: `1px solid ${directionColor(direction)}40`,
          }}
        >
          <span
            className="font-mono font-bold uppercase"
            style={{ fontSize: 9, color: directionColor(direction), letterSpacing: '0.08em' }}
          >
            {directionLabel(direction)}
          </span>
        </div>
      </td>

      {/* Win rate */}
      <td className="py-3 px-2">
        <span
          className="font-mono tabular-nums font-semibold"
          style={{
            fontSize: 13,
            color:
              winRate != null && winRate >= 55
                ? 'var(--color-profit)'
                : winRate != null && winRate < 35
                ? 'var(--color-loss)'
                : 'var(--color-text-secondary)',
          }}
        >
          {formatWinRate(winRate)}
        </span>
      </td>

      {/* Profit Factor */}
      <td className="py-3 px-2">
        <span
          className="font-mono tabular-nums font-semibold"
          style={{
            fontSize: 13,
            color:
              profitFactor != null && profitFactor >= 1.5
                ? 'var(--color-profit)'
                : profitFactor != null && profitFactor < 1.0
                ? 'var(--color-loss)'
                : 'var(--color-text-secondary)',
          }}
        >
          {profitFactor != null ? `${profitFactor.toFixed(1)}x` : '--'}
        </span>
      </td>

      {/* Sample Size */}
      <td className="py-3 px-2">
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
        >
          {sampleSize != null ? `n=${sampleSize}` : '--'}
        </span>
      </td>

      {/* Confidence */}
      <td className="py-3 px-2">
        <span
          className="font-mono uppercase"
          style={{ fontSize: 10, color: confidenceColor(confidence), letterSpacing: '0.06em' }}
        >
          {confidence || '--'}
        </span>
      </td>

      {/* Timestamp */}
      <td className="py-3 pl-2 pr-4">
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
        >
          {formatTime(timestamp)}
        </span>
      </td>
    </motion.tr>
  )
}

// ── Summary Bar ───────────────────────────────────────────────────────────────

interface SummaryBarProps {
  data: PatternsAPIData
}

function SummaryBar({ data }: SummaryBarProps) {
  const longCount = data.annotations.filter((a) => a.direction === 'long').length
  const shortCount = data.annotations.filter((a) => a.direction === 'short').length
  const neutralCount = data.annotations.length - longCount - shortCount

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 px-4 py-3 border-b"
      style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-subtle)' }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
        >
          Total
        </span>
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
        >
          {data.annotations.length}
        </span>
      </div>

      <div className="w-px h-4" style={{ background: 'var(--color-border-subtle)' }} />

      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-profit)' }} />
        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--color-profit)' }}>
          {longCount} Long
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-loss)' }} />
        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--color-loss)' }}>
          {shortCount} Short
        </span>
      </div>

      {neutralCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-text-muted)' }} />
          <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {neutralCount} Neutral
          </span>
        </div>
      )}

      <div className="w-px h-4 ml-auto" style={{ background: 'var(--color-border-subtle)' }} />

      {data.day_bias && data.day_bias !== 'unknown' && (
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
          >
            Day Bias
          </span>
          <span
            className="font-mono uppercase font-semibold"
            style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
          >
            {data.day_bias}
          </span>
        </div>
      )}

      {data.day_type && (
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
          >
            Type
          </span>
          <span
            className="font-mono uppercase"
            style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
          >
            {data.day_type}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PatternsPage({ data }: PatternsPageProps) {
  const annotations = data?.annotations ?? []

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--color-surface-base)' }}
    >
      {/* Page header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-subtle)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.75">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span
          className="font-sans font-semibold"
          style={{ fontSize: 14, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}
        >
          Pattern Library
        </span>
        {annotations.length > 0 && (
          <div
            className="flex items-center justify-center px-1.5 rounded"
            style={{ background: 'var(--color-accent-muted)', minWidth: 22 }}
          >
            <span
              className="font-mono tabular-nums font-bold"
              style={{ fontSize: 10, color: 'var(--color-accent)' }}
            >
              {annotations.length}
            </span>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {data && annotations.length > 0 && <SummaryBar data={data} />}

      {/* Table */}
      {annotations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-subtle)' }}
              >
                <th className="py-2 pl-4 pr-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Pattern
                  </span>
                </th>
                <th className="py-2 px-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Direction
                  </span>
                </th>
                <th className="py-2 px-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Win Rate
                  </span>
                </th>
                <th className="py-2 px-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    PF
                  </span>
                </th>
                <th className="py-2 px-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Trades
                  </span>
                </th>
                <th className="py-2 px-2 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Confidence
                  </span>
                </th>
                <th className="py-2 pl-2 pr-4 text-left">
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
                  >
                    Time
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((ann, idx) => (
                <PatternRow
                  key={`${ann.pattern}-${ann.timestamp}-${idx}`}
                  index={idx}
                  pattern={ann.pattern}
                  direction={ann.direction}
                  winRate={ann.win_rate}
                  profitFactor={(ann as any).profit_factor ?? null}
                  sampleSize={(ann as any).sample_size ?? null}
                  confidence={ann.confidence}
                  timestamp={ann.timestamp}
                  detail={ann.detail}
                  category={ann.category}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
