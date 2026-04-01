'use client'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Radio, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = 'rithmic' | 'databento'

const RITHMIC_SERVERS = [
  'Rithmic Paper Trading',
  'Rithmic 01',
  'Rithmic Test',
] as const

// ---------------------------------------------------------------------------
// Credential persistence helpers (btoa obfuscation — not real security)
// ---------------------------------------------------------------------------

function saveRithmicCreds(username: string, password: string, server: string) {
  try {
    const encoded = btoa(JSON.stringify({ username, password, server }))
    localStorage.setItem('arctis_rithmic_creds', encoded)
  } catch {
    // ignore storage errors
  }
}

function loadRithmicCreds(): { username: string; password: string; server: string } | null {
  try {
    const raw = localStorage.getItem('arctis_rithmic_creds')
    if (!raw) return null
    return JSON.parse(atob(raw)) as { username: string; password: string; server: string }
  } catch {
    return null
  }
}

function clearRithmicCreds() {
  localStorage.removeItem('arctis_rithmic_creds')
}

// ---------------------------------------------------------------------------
// Shared input style
// ---------------------------------------------------------------------------

const INPUT_CLASS = cn(
  'w-full h-8 pl-2.5 pr-8 rounded-[var(--radius-sm)]',
  'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]',
  'text-[var(--color-text-primary)]',
  'outline-none transition-colors',
  'focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
  'hover:border-[var(--color-border)]',
  'placeholder:text-[var(--color-text-muted)]',
)
const INPUT_STYLE = { fontSize: 12, fontFamily: 'var(--font-mono)' }

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

// ---------------------------------------------------------------------------
// Rithmic Tab
// ---------------------------------------------------------------------------

function RithmicTab() {
  const [server, setServer] = useState<string>('Rithmic Paper Trading')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState<string | null>(null)
  const [connectedServer, setConnectedServer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved credentials and check current status on mount
  useEffect(() => {
    const saved = loadRithmicCreds()
    if (saved) {
      setUsername(saved.username)
      setPassword(saved.password)
      setServer(saved.server)
    }
    fetch(`${config.apiBase}/api/live/rithmic/status`)
      .then((r) => r.json())
      .then((d: { connected: boolean; credentials?: { username: string; server: string } | null }) => {
        setConnected(!!d.connected)
        if (d.connected && d.credentials) {
          setConnectedUsername(d.credentials.username)
          setConnectedServer(d.credentials.server)
          // Sync input fields with actual backend credentials
          setUsername(d.credentials.username)
          setServer(d.credentials.server)
          // Keep password from localStorage if username matches
          const savedCreds = loadRithmicCreds()
          if (savedCreds && savedCreds.username === d.credentials.username) {
            setPassword(savedCreds.password)
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Benutzername und Passwort erforderlich')
      return
    }
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      saveRithmicCreds(username, password, server)
      const params = new URLSearchParams({
        username: username.trim(),
        password: password,
        server,
      })
      const r = await fetch(`${config.apiBase}/api/live/rithmic/login?${params.toString()}`, {
        method: 'POST',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const d = await r.json() as { connected?: boolean; username?: string; server?: string; error?: string }
      if (d.error) {
        setError(d.error)
        setConnected(false)
      } else if (d.connected) {
        setConnected(true)
        setConnectedUsername(d.username ?? username)
        setConnectedServer(d.server ?? server)
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('Verbindungs-Timeout (20s)')
      } else {
        setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${config.apiBase}/api/live/rithmic/logout`, { method: 'POST' })
      clearRithmicCreds()
      setConnected(false)
      setConnectedUsername(null)
      setConnectedServer(null)
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trennung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status row */}
      <div
        className={cn(
          'flex items-center justify-between p-3',
          'rounded-[var(--radius-sm)] border',
          connected
            ? 'border-[var(--color-profit)]/30 bg-[var(--color-profit)]/5'
            : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40',
        )}
      >
        <div className="flex items-center gap-2">
          <Radio
            size={13}
            style={{ color: connected ? 'var(--color-profit)' : 'var(--color-text-muted)' }}
            strokeWidth={1.5}
          />
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: connected ? 'var(--color-profit)' : 'var(--color-text-muted)',
              fontWeight: connected ? 600 : 400,
            }}
          >
            {connected
              ? `Verbunden als ${connectedUsername ?? username}`
              : 'Nicht verbunden'}
          </span>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: connected ? 'var(--color-profit)' : 'var(--color-loss)',
            boxShadow: connected ? '0 0 6px var(--color-profit)' : 'none',
          }}
        />
      </div>

      {/* Connected server info */}
      {connected && connectedServer && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40"
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Server
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
            {connectedServer}
          </span>
        </div>
      )}

      {/* Server dropdown */}
      <div className="flex flex-col gap-1">
        <span style={LABEL_STYLE}>Server</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => !connected && setShowDropdown((v) => !v)}
            disabled={connected}
            className={cn(
              'w-full h-8 pl-2.5 pr-7 rounded-[var(--radius-sm)] text-left',
              'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]',
              'text-[var(--color-text-primary)]',
              'outline-none transition-colors',
              'focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
              !connected && 'hover:border-[var(--color-border)] cursor-pointer',
              connected && 'opacity-60 cursor-default',
            )}
            style={INPUT_STYLE}
          >
            {server}
          </button>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          {showDropdown && !connected && (
            <div
              className={cn(
                'absolute z-50 top-full left-0 right-0 mt-1',
                'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]',
                'bg-[var(--color-surface-raised)] shadow-lg overflow-hidden',
              )}
            >
              {RITHMIC_SERVERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setServer(s)
                    setShowDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5',
                    'transition-colors duration-100',
                    'hover:bg-[var(--color-accent)]/10',
                    s === server
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)]',
                  )}
                  style={INPUT_STYLE}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Username */}
      <label className="flex flex-col gap-1">
        <span style={LABEL_STYLE}>Benutzername</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={connected}
          placeholder="rithmic_user"
          className={cn(INPUT_CLASS, connected && 'opacity-60 cursor-default')}
          style={INPUT_STYLE}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {/* Password */}
      <label className="flex flex-col gap-1">
        <span style={LABEL_STYLE}>Passwort</span>
        <div className="relative flex items-center">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !connected) void handleLogin()
            }}
            disabled={connected}
            placeholder="••••••••"
            className={cn(INPUT_CLASS, connected && 'opacity-60 cursor-default')}
            style={INPUT_STYLE}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className={cn(
              'absolute right-2 flex items-center justify-center w-7 h-7 rounded cursor-pointer',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
            )}
            tabIndex={-1}
            aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
          >
            {showPw ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
          </button>
        </div>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          Im Browser gespeichert (unverschluesselt) — nie an externe Server uebertragen
        </span>
      </label>

      {/* Error */}
      {error && (
        <p role="alert" style={{ fontSize: 11, color: 'var(--color-loss)', fontFamily: 'var(--font-mono)' }}>
          {error}
        </p>
      )}

      {/* Login / Logout button */}
      {connected ? (
        <button
          onClick={() => void handleLogout()}
          disabled={loading}
          className={cn(
            'w-full h-8 rounded-[var(--radius-sm)]',
            'font-mono font-semibold text-white',
            'transition-all duration-150',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
            'disabled:opacity-60',
          )}
          style={{ fontSize: 12, background: 'var(--color-loss)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Trennen...
            </span>
          ) : (
            'Trennen'
          )}
        </button>
      ) : (
        <button
          onClick={() => void handleLogin()}
          disabled={loading || !username.trim() || !password.trim()}
          className={cn(
            'w-full h-8 rounded-[var(--radius-sm)]',
            'font-mono font-semibold text-white',
            'transition-all duration-150',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
            'disabled:opacity-60',
          )}
          style={{
            fontSize: 12,
            background: `linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))`,
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Verbinden...
            </span>
          ) : (
            'Verbinden'
          )}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Databento Tab
// ---------------------------------------------------------------------------

const SYMBOLS = ['NQ', 'ES']

function DatabentoTab() {
  const [apiKey, setApiKey] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('arctis_api_key')
    if (saved) setApiKey(saved)

    fetch(`${config.apiBase}/api/live/status`)
      .then((r) => r.json())
      .then((d: { connected?: boolean; databento_connected?: boolean }) => {
        setConnected(!!(d.databento_connected ?? d.connected))
      })
      .catch(() => {})
  }, [])

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('API Key ist erforderlich')
      return
    }
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      localStorage.setItem('arctis_api_key', apiKey)
      const r = await fetch(
        `${config.apiBase}/api/live/connect?api_key=${encodeURIComponent(apiKey)}`,
        { method: 'POST', signal: controller.signal },
      )
      clearTimeout(timeoutId)
      const d = await r.json() as { connected?: boolean; error?: string }
      if (d.error) {
        setError(d.error)
        setConnected(false)
      } else {
        setConnected(!!d.connected)
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('Verbindungs-Timeout (20s)')
      } else {
        setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${config.apiBase}/api/live/disconnect`, { method: 'POST' })
      setConnected(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trennung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status row */}
      <div
        className={cn(
          'flex items-center justify-between p-3',
          'rounded-[var(--radius-sm)] border',
          connected
            ? 'border-[var(--color-profit)]/30 bg-[var(--color-profit)]/5'
            : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40',
        )}
      >
        <div className="flex items-center gap-2">
          <Radio
            size={13}
            style={{ color: connected ? 'var(--color-profit)' : 'var(--color-text-muted)' }}
            strokeWidth={1.5}
          />
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: connected ? 'var(--color-profit)' : 'var(--color-text-muted)',
              fontWeight: connected ? 600 : 400,
            }}
          >
            {connected ? 'Verbunden mit Databento' : 'Nicht verbunden'}
          </span>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: connected ? 'var(--color-profit)' : 'var(--color-loss)',
            boxShadow: connected ? '0 0 6px var(--color-profit)' : 'none',
          }}
        />
      </div>

      {/* Streaming symbols */}
      {connected && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40">
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Streaming
          </span>
          <div className="flex gap-1.5 ml-1">
            {SYMBOLS.map((sym) => (
              <span
                key={sym}
                className="px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold leading-none tracking-wide"
                style={{ backgroundColor: 'rgba(92,184,240,0.15)', color: 'var(--color-accent)' }}
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* API Key */}
      <label className="flex flex-col gap-1">
        <span style={LABEL_STYLE}>Databento API Key</span>
        <div className="relative flex items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !connected) void handleConnect()
            }}
            placeholder="db-..."
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className={cn(
              'absolute right-2 flex items-center justify-center w-7 h-7 rounded cursor-pointer',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
            )}
            tabIndex={-1}
            aria-label={showKey ? 'API Key verbergen' : 'API Key anzeigen'}
          >
            {showKey ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
          </button>
        </div>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          Im Browser gespeichert (unverschluesselt) — nie an externe Server uebertragen
        </span>
      </label>

      {/* Error */}
      {error && (
        <p role="alert" style={{ fontSize: 11, color: 'var(--color-loss)', fontFamily: 'var(--font-mono)' }}>
          {error}
        </p>
      )}

      {/* Connect / Disconnect */}
      {connected ? (
        <button
          onClick={() => void handleDisconnect()}
          disabled={loading}
          className={cn(
            'w-full h-8 rounded-[var(--radius-sm)]',
            'font-mono font-semibold text-white',
            'transition-all duration-150',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
            'disabled:opacity-60',
          )}
          style={{ fontSize: 12, background: 'var(--color-loss)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Trennen...
            </span>
          ) : (
            'Trennen'
          )}
        </button>
      ) : (
        <button
          onClick={() => void handleConnect()}
          disabled={loading || !apiKey.trim()}
          className={cn(
            'w-full h-8 rounded-[var(--radius-sm)]',
            'font-mono font-semibold text-white',
            'transition-all duration-150',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
            'disabled:opacity-60',
          )}
          style={{
            fontSize: 12,
            background: `linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))`,
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Verbinden...
            </span>
          ) : (
            'Mit Databento verbinden'
          )}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ConnectionPanel with tab bar
// ---------------------------------------------------------------------------

export function ConnectionPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rithmic')

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div
        className="flex border-b border-[var(--color-border-subtle)] mb-3"
      >
        {(['rithmic', 'databento'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative px-3 py-2 font-mono font-semibold transition-colors duration-150 cursor-pointer',
              'outline-none focus-visible:ring-2 focus-visible:ring-[#5CB8F0]/50',
              'text-[11px] uppercase tracking-wider',
              activeTab === tab
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {tab === 'rithmic' ? 'Rithmic' : 'Databento'}
            {activeTab === tab && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: 'var(--color-accent)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'rithmic' ? <RithmicTab /> : <DatabentoTab />}
    </div>
  )
}
