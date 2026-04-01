import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Database, Cpu, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketStore } from '@/store/market'
import { config } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArctisPanelProps {
  currentPattern?: string
  currentBias?: string
  className?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: number
  response?: TravisStructuredResponse
  // legacy fallback: plain results list from older endpoint
  results?: ArctisResult[]
}

interface ArctisResult {
  title: string
  content: string
  action?: string
  type?: 'status' | 'signal' | 'no_signal'
}

/** Structured response from the Arctis AI BFF. */
interface TravisStructuredResponse {
  kind: 'video' | 'explanation' | 'checklist' | 'playbook' | 'review'
  title: string
  summary: string
  confidence: number
  why_now: string
  source: 'mcp' | 'local_fallback' | 'cache'
  data?: Record<string, unknown>
}

interface TravisApiResponse {
  question: string
  response: TravisStructuredResponse
  /** Legacy results array — kept for backward compat with arctis_ai endpoint. */
  results?: ArctisResult[]
  context?: Record<string, unknown>
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Was passiert?', query: 'Was macht der Markt gerade?' },
  { label: 'Session Checklist', query: 'checklist' },
  { label: 'Setup erklaeren', query: 'Erklaer mir das aktuelle Setup' },
  { label: 'Bias?', query: 'Welchen Bias haben wir gerade?' },
]

// ─── Source Badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: TravisStructuredResponse['source'] }) {
  const map: Record<typeof source, { label: string; icon: React.ReactNode; color: string }> = {
    mcp: {
      label: 'MCP',
      icon: <Cpu size={9} />,
      color: 'var(--color-accent)',
    },
    cache: {
      label: 'Cache',
      icon: <HardDrive size={9} />,
      color: 'var(--color-accent-hover)',
    },
    local_fallback: {
      label: 'Local',
      icon: <Database size={9} />,
      color: 'var(--color-text-muted)',
    },
  }
  const entry = map[source] ?? map.local_fallback
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-sm font-mono uppercase tracking-wider"
      style={{ color: entry.color, background: `${entry.color}18`, border: `1px solid ${entry.color}30` }}
    >
      {entry.icon}
      {entry.label}
    </span>
  )
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'var(--color-profit)' :
    pct >= 40 ? 'var(--color-warning)' :
    'var(--color-text-muted)'

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-0.5 rounded-full flex-1"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[8px] font-mono" style={{ color, minWidth: 24, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Arctis AI Response Card ─────────────────────────────────────────────────

function TravisCard({ response }: { response: TravisStructuredResponse }) {
  const kindColor: Record<string, string> = {
    checklist: 'var(--color-accent)',
    review: 'var(--color-profit)',
    explanation: 'var(--color-accent)',
    video: 'var(--color-warning)',
    playbook: 'var(--color-accent-hover)',
  }
  const accent = kindColor[response.kind] ?? 'var(--color-accent)'

  return (
    <div
      className="rounded-md p-2 flex flex-col gap-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderLeft: `2px solid ${accent}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-1">
        <span
          className="text-[10px] font-bold tracking-wide leading-tight flex-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {response.title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <SourceBadge source={response.source} />
        </div>
      </div>

      {/* Confidence */}
      <ConfidenceBar value={response.confidence} />

      {/* Summary */}
      <pre
        className="text-[9px] leading-snug whitespace-pre-wrap m-0 font-mono"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {response.summary}
      </pre>

      {/* Why now */}
      {response.why_now && (
        <div
          className="text-[8px] leading-relaxed px-1.5 py-1 rounded-sm"
          style={{
            background: `${accent}0A`,
            borderLeft: `1px solid ${accent}40`,
            color: 'var(--color-text-muted)',
          }}
        >
          {response.why_now}
        </div>
      )}
    </div>
  )
}

// ─── Legacy Result Card (backward compat) ────────────────────────────────────

function LegacyCard({ result }: { result: ArctisResult }) {
  const actionColor =
    result.action?.startsWith('EINSTEIGEN') ? 'var(--color-profit)' :
    result.action?.startsWith('BEREIT') ? 'var(--color-warning)' :
    result.action?.startsWith('VERPASST') ? 'var(--color-loss)' :
    'var(--color-text-muted)'

  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: result.type === 'signal' ? 'var(--color-profit-muted)' : 'rgba(255,255,255,0.02)',
        borderLeft: `2px solid ${result.type === 'signal' ? 'var(--color-profit)' : result.type === 'no_signal' ? 'var(--color-text-muted)' : 'var(--color-accent)'}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-wide"
          style={{ color: result.type === 'signal' ? 'var(--color-profit)' : 'var(--color-text-primary)' }}
        >
          {result.title}
        </span>
        {result.action && (
          <span
            className="text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
            style={{ color: actionColor, background: `${actionColor}15` }}
          >
            {result.action.split('—')[0].trim()}
          </span>
        )}
      </div>
      <pre className="text-[9px] leading-snug whitespace-pre-wrap m-0 mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
        {result.content}
      </pre>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end gap-1.5">
      <div
        className="rounded-lg px-2.5 py-1.5 max-w-[85%]"
        style={{
          background: 'rgba(92,184,240,0.12)',
          border: '1px solid rgba(92,184,240,0.2)',
        }}
      >
        <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{content}</span>
      </div>
      <User size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-inactive)' }} />
    </div>
  )
}

function AiBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-1.5">
      <Bot size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
      <div className="flex flex-col gap-1.5 max-w-[92%] w-full">
        {/* Structured response — preferred */}
        {message.response && (
          <TravisCard response={message.response} />
        )}
        {/* Legacy plain results — fallback */}
        {!message.response && message.results?.map((r, i) => (
          <LegacyCard key={i} result={r} />
        ))}
        {/* Error text */}
        {!message.response && !message.results?.length && message.content && (
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center">
      <Bot size={14} className="shrink-0" style={{ color: 'var(--color-accent)' }} />
      <div className="flex gap-1 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
            style={{
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function askTravis(
  question: string,
  market: string,
  timeframe: string,
  currentPrice?: number,
): Promise<TravisApiResponse> {
  const res = await fetch(`${config.apiBase}/api/travis/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      market,
      timeframe,
      current_price: currentPrice,
      mode: 'live',
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<TravisApiResponse>
}

async function fetchChecklist(
  session: string,
  market: string,
  timeframe: string,
): Promise<TravisStructuredResponse> {
  const params = new URLSearchParams({ session, market, timeframe })
  const res = await fetch(`${config.apiBase}/api/travis/checklist?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as { checklist: TravisStructuredResponse }
  return data.checklist
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArctisPanel({
  className,
  currentPrice,
}: ArctisPanelProps & { currentPrice?: number }) {
  const { market, timeframe } = useMarketStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // "checklist" quick action fetches dedicated endpoint
      if (question.toLowerCase() === 'checklist') {
        const checklist = await fetchChecklist('', market, timeframe)
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: '',
          timestamp: Date.now(),
          response: checklist,
        }
        setMessages((prev) => [...prev, aiMsg])
        return
      }

      const resp = await askTravis(question.trim(), market, timeframe, currentPrice)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: '',
        timestamp: Date.now(),
        // Prefer structured response; fall back to legacy results list
        response: resp.response ?? undefined,
        results: resp.results,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: 'Verbindung fehlgeschlagen. Backend erreichbar?',
        timestamp: Date.now(),
        results: [{ title: 'Fehler', content: 'Arctis Engine nicht erreichbar.', type: 'no_signal' }],
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [market, timeframe, isLoading, currentPrice])

  return (
    <div className={cn('flex flex-col', className)} style={{ height: '100%', minHeight: 200 }}>
      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 py-1"
        style={{ maxHeight: 300, minHeight: 80 }}
      >
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Bot size={20} style={{ color: 'var(--color-text-inactive)' }} />
            <span className="text-[10px] text-center" style={{ color: 'var(--color-text-inactive)' }}>
              Frag mich was zum Markt.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <UserBubble key={msg.id} content={msg.content} />
              ) : (
                <AiBubble key={msg.id} message={msg} />
              )
            )}
            {isLoading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Quick actions — only when no messages yet */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1 px-1 pb-1.5">
          {QUICK_ACTIONS.map(({ label, query }) => (
            <button
              key={label}
              onClick={() => void handleSend(query)}
              className="text-[9px] px-2 py-1 rounded-full cursor-pointer transition-colors"
              style={{
                background: 'rgba(92,184,240,0.06)',
                border: '1px solid rgba(92,184,240,0.15)',
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92,184,240,0.12)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(92,184,240,0.06)'
                e.currentTarget.style.color = 'var(--color-text-muted)'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-center gap-1.5 px-1 pb-1"
        style={{
          borderTop: '1px solid var(--color-border-subtle, #21262D)',
          paddingTop: 6,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(input) }}
          placeholder="Frag Arctis..."
          className="flex-1 bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50 rounded text-[11px]"
          aria-label="Ask Arctis"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            caretColor: 'var(--color-accent)',
          }}
        />
        <button
          onClick={() => void handleSend(input)}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="flex items-center justify-center w-7 h-7 rounded cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50"
          style={{
            background: input.trim() && !isLoading ? 'rgba(92,184,240,0.15)' : 'transparent',
            color: input.trim() && !isLoading ? 'var(--color-accent)' : 'var(--color-text-inactive)',
          }}
        >
          {isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
        </button>
      </div>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
