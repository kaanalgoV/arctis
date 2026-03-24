import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
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
  results?: ArctisResult[]
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
  context?: Record<string, unknown>
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  'Was macht der Markt?',
  'Soll ich einsteigen?',
  'Was war gestern?',
  'Welche Setups gibt es?',
]

// ─── API call ────────────────────────────────────────────────────────────────

async function askArctis(question: string, market: string, timeframe: string): Promise<ArctisResponse> {
  const res = await fetch(`${config.apiBase}/api/arctis/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, market, timeframe }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<ArctisResponse>
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

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
        <span className="text-[11px] text-[#E6EDF3] leading-relaxed">{content}</span>
      </div>
      <User size={14} className="text-[#484F58] shrink-0 mt-0.5" />
    </div>
  )
}

function AiBubble({ results }: { results: ArctisResult[] }) {
  return (
    <div className="flex gap-1.5">
      <Bot size={14} className="text-[#5CB8F0] shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1.5 max-w-[90%]">
        {results.map((r, i) => {
          const actionColor = r.action?.startsWith('EINSTEIGEN') ? '#22C55E'
            : r.action?.startsWith('BEREIT') ? '#F0A500'
            : r.action?.startsWith('VERPASST') ? '#EF4444'
            : '#8B949E'

          return (
            <div
              key={i}
              className="rounded-md px-2 py-1.5"
              style={{
                background: r.type === 'signal' ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
                borderLeft: `2px solid ${r.type === 'signal' ? '#22C55E' : r.type === 'no_signal' ? '#8B949E' : '#5CB8F0'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: r.type === 'signal' ? '#22C55E' : '#E6EDF3' }}
                >
                  {r.title}
                </span>
                {r.action && (
                  <span
                    className="text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                    style={{ color: actionColor, background: `${actionColor}15` }}
                  >
                    {r.action.split('—')[0].trim()}
                  </span>
                )}
              </div>
              <pre className="text-[9px] text-[#8B949E] leading-snug whitespace-pre-wrap m-0 mt-0.5 font-mono">
                {r.content}
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center">
      <Bot size={14} className="text-[#5CB8F0] shrink-0" />
      <div className="flex gap-1 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#5CB8F0]"
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

// ─── Component ────────────────────────────────────────────────────────────────

export function ArctisPanel({
  className,
}: ArctisPanelProps) {
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
      const resp = await askArctis(question.trim(), market, timeframe)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: '',
        timestamp: Date.now(),
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
  }, [market, timeframe, isLoading])

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
            <Bot size={20} className="text-[#484F58]" />
            <span className="text-[10px] text-[#484F58] text-center">
              Frag mich was zum Markt.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <UserBubble key={msg.id} content={msg.content} />
              ) : (
                <AiBubble key={msg.id} results={msg.results || []} />
              )
            )}
            {isLoading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Quick actions — only when no messages yet */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1 px-1 pb-1.5">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void handleSend(q)}
              className="text-[9px] px-2 py-1 rounded-full cursor-pointer transition-colors"
              style={{
                background: 'rgba(92,184,240,0.06)',
                border: '1px solid rgba(92,184,240,0.15)',
                color: '#8B949E',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92,184,240,0.12)'
                e.currentTarget.style.color = '#E6EDF3'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(92,184,240,0.06)'
                e.currentTarget.style.color = '#8B949E'
              }}
            >
              {q}
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
          className="flex-1 bg-transparent border-none outline-none text-[11px] text-[#E6EDF3] placeholder-[#484F58]"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', caretColor: '#5CB8F0' }}
        />
        <button
          onClick={() => void handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors"
          style={{
            background: input.trim() && !isLoading ? 'rgba(92,184,240,0.15)' : 'transparent',
            color: input.trim() && !isLoading ? '#5CB8F0' : '#484F58',
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
