import { cn } from '@/lib/utils'

interface ConfluenceSignal {
  name: string
  direction: string
  strength: number
  detail: string
}

export interface ConfluenceAPIData {
  score: number
  max_score: number
  direction: string
  confidence: string
  signals: ConfluenceSignal[]
  indicators: Record<string, unknown>
}

interface ConfluenceRow {
  label: string
  value: number
}

interface ConfluencePanelProps {
  data?: ConfluenceAPIData
  // Static fallback props (used when data is not provided)
  score?: number
  verdict?: string
  direction?: 'LONG' | 'SHORT' | 'NEUTRAL'
  rows?: ConfluenceRow[]
}

const defaultRows: ConfluenceRow[] = [
  { label: 'Struktur', value: 2 },
  { label: 'EMA', value: 1 },
  { label: 'VWAP', value: 1 },
  { label: 'Volume', value: 2 },
  { label: 'RSI Div', value: 2 },
  { label: 'Session', value: 1 },
]

function scoreColor(score: number) {
  if (score >= 8) return 'var(--color-profit)'
  if (score >= 5) return 'var(--color-accent)'
  if (score <= -5) return 'var(--color-loss)'
  return 'var(--color-text-secondary)'
}

function valueColor(v: number) {
  if (v > 0) return 'var(--color-profit)'
  if (v < 0) return 'var(--color-loss)'
  return 'var(--color-text-muted)'
}

function directionColor(dir: string) {
  if (dir === 'LONG') return 'var(--color-profit)'
  if (dir === 'SHORT') return 'var(--color-loss)'
  return 'var(--color-text-secondary)'
}

export function ConfluencePanel({
  data,
  score: staticScore = 9,
  verdict: staticVerdict = 'STARK',
  direction: staticDirection = 'LONG',
  rows: staticRows = defaultRows,
}: ConfluencePanelProps) {
  const score = data ? data.score : staticScore
  const verdict = data ? data.confidence : staticVerdict
  const direction = data ? data.direction : staticDirection

  const rows: ConfluenceRow[] = data
    ? data.signals.map((s) => ({ label: s.name, value: s.strength }))
    : staticRows

  const color = scoreColor(score)
  const dirColor = directionColor(direction)

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="font-mono text-[28px] font-extrabold leading-none tabular-nums"
          style={{ color }}
        >
          {score > 0 ? '+' : ''}{score}
        </span>
        <span
          className="font-mono text-[10px] font-semibold tracking-wide uppercase"
          style={{ color }}
        >
          {verdict}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 mt-3">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center text-[10px] py-[2px]">
            <span className="text-[var(--color-text-muted)]">{r.label}</span>
            <span
              className="font-mono font-semibold tabular-nums"
              style={{ color: valueColor(r.value) }}
            >
              {r.value > 0 ? '+' : ''}{r.value}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-2 pt-2 flex justify-between items-center text-[10px]"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span className="text-[var(--color-text-muted)]">Direction</span>
        <span className="font-mono font-bold text-[11px]" style={{ color: dirColor }}>
          {direction}
        </span>
      </div>
    </div>
  )
}
