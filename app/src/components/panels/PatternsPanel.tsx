import { cn } from '@/lib/utils'

interface Annotation {
  timestamp: number
  pattern: string
  direction: string
  text: string
  detail: string
  confidence: string
  win_rate: number | null
  category: string
  price: number | null
  target: number | null
  marker_type: string
  color: string
  expiry_days: number
}

export interface PatternsAPIData {
  annotations: Annotation[]
  day_type: string
  day_bias: string
}

interface Pattern {
  name: string
  description: string
  winRate?: string
  type: 'long' | 'short' | 'info'
}

interface PatternsPanelProps {
  data?: PatternsAPIData
  patterns?: Pattern[]
}

const defaultPatterns: Pattern[] = [
  { name: 'ORB Long', description: 'Opening Range Break', winRate: '84%', type: 'long' },
  { name: 'IB Break', description: 'Initial Balance', winRate: '89%', type: 'long' },
  { name: 'Trend Day', description: 'HH + HL confirmed', winRate: 'info', type: 'info' },
]

const typeColors = {
  long: { border: 'var(--color-profit)', text: 'var(--color-profit)' },
  short: { border: 'var(--color-loss)', text: 'var(--color-loss)' },
  info: { border: 'var(--color-accent)', text: 'var(--color-accent)' },
}

function directionToType(direction: string): 'long' | 'short' | 'info' {
  if (direction === 'long') return 'long'
  if (direction === 'short') return 'short'
  return 'info'
}

function formatWinRate(win_rate: number | null): string | undefined {
  if (win_rate === null) return undefined
  return `${Math.round(win_rate * 100)}%`
}

function mapAnnotationToPattern(annotation: Annotation): Pattern {
  return {
    name: annotation.pattern,
    description: annotation.detail,
    winRate: formatWinRate(annotation.win_rate),
    type: directionToType(annotation.direction),
  }
}

export function PatternsPanel({ data, patterns }: PatternsPanelProps) {
  let items: Pattern[]

  if (data !== undefined) {
    items = data.annotations.map(mapAnnotationToPattern)
  } else if (patterns !== undefined) {
    items = patterns
  } else {
    items = defaultPatterns
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[11px] text-[var(--color-text-muted)]">No active patterns</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((p, index) => {
        const colors = typeColors[p.type]
        return (
          <div
            key={`${p.name}-${index}`}
            className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)]/50 border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors"
          >
            <div
              className="w-[3px] h-6 rounded-full flex-shrink-0"
              style={{ background: colors.border }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-[var(--color-text-primary)]">
                {p.name}
              </div>
              <div className="text-[9px] text-[var(--color-text-muted)]">
                {p.description}
              </div>
            </div>
            {p.winRate !== undefined && (
              <span
                className="font-mono text-[11px] font-semibold tabular-nums flex-shrink-0"
                style={{ color: colors.text }}
              >
                {p.winRate}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
