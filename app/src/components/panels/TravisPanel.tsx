import { useState, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketStore } from '@/store/market'
import { config } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArctisPanelProps {
  currentPattern?: string
  currentBias?: string
  className?: string
}

interface ArctisResult {
  title: string
  content: string
  action?: string
  type?: 'status' | 'signal' | 'no_signal'
}

interface ArctisResponse {
  question: string
  results: ArctisResult[]
}

// ─── Static context suggestions ──────────────────────────────────────────────

interface Suggestion {
  question: string
  label: string
  description: string
}

function buildSuggestions(
  currentPattern?: string,
  currentBias?: string,
): Suggestion[] {
  const suggestions: Suggestion[] = []

  if (currentPattern) {
    const p = currentPattern.toLowerCase()
    if (p.includes('orb') || p.includes('opening range')) {
      suggestions.push({
        question: 'Opening Range Breakout',
        label: 'ORB Breakout',
        description: 'Learn how to trade the Opening Range Breakout setup.',
      })
    }
    if (p.includes('ib') || p.includes('initial balance')) {
      suggestions.push({
        question: 'Initial Balance',
        label: 'Initial Balance',
        description: 'Understand the Initial Balance and its key levels.',
      })
    }
    if (p.includes('vwap')) {
      suggestions.push({
        question: 'VWAP',
        label: 'VWAP Reclaim',
        description: 'How VWAP acts as dynamic support and resistance.',
      })
    }
  }

  if (currentBias) {
    const b = currentBias.toLowerCase()
    if (b.includes('range_long') || b.includes('long')) {
      suggestions.push({
        question: 'bias long setup',
        label: 'Range-Long Setup',
        description: 'Understanding range-long market conditions.',
      })
    }
    if (b.includes('range_short') || b.includes('short')) {
      suggestions.push({
        question: 'bias short setup',
        label: 'Range-Short Setup',
        description: 'Trading in range-short market environments.',
      })
    }
    if (b.includes('trending')) {
      suggestions.push({
        question: 'trending bias',
        label: 'Trending Day',
        description: 'How to identify and trade a trending day.',
      })
    }
    if (b.includes('velocity')) {
      suggestions.push({
        question: 'velocity auction speed',
        label: 'Auction Velocity',
        description: 'What velocity tells us about conviction in price movement.',
      })
    }
  }

  // Fallback defaults when no context is available
  if (suggestions.length === 0) {
    suggestions.push(
      {
        question: 'bias',
        label: 'Market Bias',
        description: 'Understanding how market bias guides trade direction.',
      },
      {
        question: 'VWAP',
        label: 'VWAP Levels',
        description: 'Using VWAP as a dynamic anchor for price action.',
      },
      {
        question: 'velocity auction speed',
        label: 'Auction Speed',
        description: 'Why pace of trade reveals market conviction.',
      },
    )
  }

  return suggestions.slice(0, 3)
}

// ─── API call ────────────────────────────────────────────────────────────────

const ENGINE_URL = config.apiBase

async function askArctis(question: string, market = 'NQ', timeframe = '1min'): Promise<ArctisResponse> {
  const res = await fetch(`${ENGINE_URL}/api/arctis/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, market, timeframe }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<ArctisResponse>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArctisPanel({
  currentPattern,
  currentBias,
  className,
}: ArctisPanelProps) {
  const { market, timeframe } = useMarketStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArctisResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestions = buildSuggestions(currentPattern, currentBias)

  const handleAsk = useCallback(async (question: string) => {
    if (!question.trim()) return
    setIsLoading(true)
    setError(null)
    setResults(null)
    try {
      const resp = await askArctis(question.trim(), market, timeframe)
      setResults(resp.results)
    } catch {
      setError('Arctis is unavailable right now.')
    } finally {
      setIsLoading(false)
    }
  }, [market, timeframe])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void handleAsk(query)
      }
    },
    [query, handleAsk],
  )

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 5,
          paddingLeft: 8,
          paddingRight: 6,
        }}
      >
        <Search size={11} strokeWidth={1.8} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Frag Arctis..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.68rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: 'var(--color-text-secondary)',
            caretColor: '#5CB8F0',
          }}
        />
        <button
          type="button"
          onClick={() => void handleAsk(query)}
          disabled={isLoading || !query.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 20,
            paddingLeft: 7,
            paddingRight: 7,
            borderRadius: 4,
            border: 'none',
            background: query.trim() && !isLoading ? 'rgba(92,184,240,0.14)' : 'transparent',
            color: query.trim() && !isLoading ? '#5CB8F0' : 'var(--color-text-muted)',
            cursor: query.trim() && !isLoading ? 'pointer' : 'default',
            fontSize: '0.6rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 500,
            letterSpacing: '0.04em',
            transition: 'background 0.12s, color 0.12s',
            flexShrink: 0,
          }}
        >
          {isLoading ? (
            <Loader2 size={10} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            'ASK'
          )}
        </button>
      </div>

      {/* Results */}
      {results !== null && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {results.map((r, i) => (
            <ResultCard key={i} title={r.title} content={r.content} action={r.action} type={r.type} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--color-loss)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {error}
        </span>
      )}

      {/* Context-aware suggestions — only when no results shown */}
      {results === null && !isLoading && (
        <>
          <div
            style={{
              fontSize: '0.6rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              paddingTop: 2,
            }}
          >
            Suggested
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {suggestions.map((s, i) => (
              <SuggestionCard
                key={i}
                label={s.label}
                description={s.description}
                onClick={() => void handleAsk(s.question)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultCard({ title, content, action, type }: ArctisResult) {
  const actionColor = action?.startsWith('EINSTEIGEN') ? '#22C55E'
    : action?.startsWith('BEREIT') ? '#F0A500'
    : action?.startsWith('VERPASST') ? '#EF4444'
    : '#8B949E'

  const borderColor = type === 'signal' ? 'rgba(34,197,94,0.25)'
    : type === 'no_signal' ? 'rgba(139,148,158,0.15)'
    : 'rgba(92,184,240,0.15)'

  const bgColor = type === 'signal' ? 'rgba(34,197,94,0.04)'
    : type === 'no_signal' ? 'rgba(139,148,158,0.04)'
    : 'rgba(92,184,240,0.04)'

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 5,
        padding: '7px 9px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: type === 'signal' ? '#22C55E' : '#5CB8F0',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {title}
        </span>
        {action && (
          <span
            style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              color: actionColor,
              background: `${actionColor}15`,
              border: `1px solid ${actionColor}40`,
              borderRadius: 3,
              padding: '1px 5px',
              letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {action.split('—')[0].trim()}
          </span>
        )}
      </div>
      <pre
        style={{
          margin: 0,
          fontSize: '0.62rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.55,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </pre>
    </div>
  )
}

interface SuggestionCardProps {
  label: string
  description: string
  onClick: () => void
}

function SuggestionCard({ label, description, onClick }: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 5,
        padding: '6px 8px',
        cursor: 'pointer',
        transition: 'border-color 0.12s, background 0.12s',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget as HTMLButtonElement
        btn.style.background = 'rgba(92,184,240,0.06)'
        btn.style.borderColor = 'rgba(92,184,240,0.25)'
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget as HTMLButtonElement
        btn.style.background = 'rgba(255,255,255,0.02)'
        btn.style.borderColor = 'var(--color-border-subtle)'
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.62rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.4,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {description}
      </span>
    </button>
  )
}
