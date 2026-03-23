import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Database, Loader2, Bell, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import { useSettingsStore } from '@/store/settings'

// ── Constants ─────────────────────────────────────────────────────────────────

const ENGINE_URL = 'http://127.0.0.1:8001'

const OVERLAY_LABELS: Record<OverlayKey, string> = {
  vwap: 'VWAP',
  ema: 'EMA',
  volume: 'Volume',
  vp: 'Volume Profile',
  levels: 'Session Levels',
  zones: 'Supply/Demand Zones',
}

const OVERLAY_DESCRIPTIONS: Record<OverlayKey, string> = {
  vwap: 'Volume-weighted average price band',
  ema: 'Exponential moving averages (8/21/50)',
  volume: 'Volume bars at bottom of chart',
  vp: 'Volume profile histogram',
  levels: 'Previous day high/low/close',
  zones: 'Key supply and demand zones',
}

const OVERLAY_KEYS: OverlayKey[] = ['vwap', 'ema', 'volume', 'vp', 'levels', 'zones']

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'risk' | 'display' | 'connection' | 'alerts'

interface RiskConfig {
  account_size: number
  risk_percent: number
  daily_loss_limit: number
  max_daily_trades: number
}

interface ConnectionStatus {
  connected: boolean
  latencyMs: number
  barsLoaded: number
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
        className="uppercase tracking-wider leading-none"
      >
        {label}
      </span>
      {children}
    </div>
  )
}

interface NumericInputProps {
  value: number
  onChange: (val: number) => void
  step?: number
  min?: number
  prefix?: string
  suffix?: string
}

function NumericInput({ value, onChange, step = 1, min = 0, prefix, suffix }: NumericInputProps) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span
          className="absolute left-2.5 pointer-events-none"
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-8 rounded-[var(--radius-sm)]',
          'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]',
          'text-[var(--color-text-primary)]',
          'outline-none transition-colors',
          'focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30',
          'hover:border-[var(--color-border)]',
          prefix ? 'pl-5' : 'pl-2.5',
          suffix ? 'pr-5' : 'pr-2.5',
        )}
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
      />
      {suffix && (
        <span
          className="absolute right-2.5 pointer-events-none"
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  )
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center w-9 h-5 rounded-full shrink-0',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50',
        checked
          ? 'bg-[var(--color-accent)]'
          : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={cn(
          'w-3.5 h-3.5 rounded-full shadow-sm',
          checked ? 'bg-[var(--color-surface-base)]' : 'bg-[var(--color-text-muted)]',
        )}
        style={{ marginLeft: checked ? 20 : 2 }}
      />
    </button>
  )
}

// ── Tab: Risk ─────────────────────────────────────────────────────────────────

interface RiskTabProps {
  onClose: () => void
  externalConfig?: RiskConfig | null
  onConfigSaved?: (config: RiskConfig) => void
}

function RiskTab({ onClose, externalConfig, onConfigSaved }: RiskTabProps) {
  const [config, setConfig] = useState<RiskConfig>({
    account_size: 100000,
    risk_percent: 1,
    daily_loss_limit: 2000,
    max_daily_trades: 10,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from external config (passed from App polling loop)
  useEffect(() => {
    if (externalConfig) {
      setConfig(externalConfig)
    }
  }, [externalConfig])

  // Also fetch directly on mount if no external config yet
  useEffect(() => {
    if (!externalConfig) {
      fetch(`${ENGINE_URL}/api/config`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) setConfig(d as RiskConfig)
        })
        .catch(() => {})
    }
  }, [externalConfig])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${ENGINE_URL}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onConfigSaved?.(config)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <Field label="Account Size">
        <NumericInput
          value={config.account_size}
          onChange={(v) => setConfig((c) => ({ ...c, account_size: v }))}
          step={1000}
          min={0}
          prefix="$"
        />
      </Field>

      <Field label="Risk per Trade">
        <NumericInput
          value={config.risk_percent}
          onChange={(v) => setConfig((c) => ({ ...c, risk_percent: v }))}
          step={0.1}
          min={0}
          suffix="%"
        />
      </Field>

      <Field label="Daily Loss Limit">
        <NumericInput
          value={config.daily_loss_limit}
          onChange={(v) => setConfig((c) => ({ ...c, daily_loss_limit: v }))}
          step={100}
          min={0}
          prefix="$"
        />
      </Field>

      <Field label="Max Trades per Day">
        <NumericInput
          value={config.max_daily_trades}
          onChange={(v) => setConfig((c) => ({ ...c, max_daily_trades: v }))}
          step={1}
          min={1}
        />
      </Field>

      {error && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-loss)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={() => void handleSave()}
        disabled={saving || saved}
        className={cn(
          'w-full h-8 rounded-[var(--radius-sm)]',
          'font-mono font-semibold',
          'transition-all duration-150',
          'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          'disabled:opacity-60',
        )}
        style={{
          fontSize: 12,
          background: saved
            ? 'var(--color-profit)'
            : `linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))`,
          color: 'white',
        }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            Saving...
          </span>
        ) : saved ? (
          'Saved'
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  )
}

// ── Tab: Display ──────────────────────────────────────────────────────────────

interface DisplayTabProps {
  activeOverlays: Set<OverlayKey>
  onToggleOverlay: (key: OverlayKey) => void
}

function DisplayTab({ activeOverlays, onToggleOverlay }: DisplayTabProps) {
  const { overlays, toggleOverlay } = useSettingsStore()

  // Use store state when activeOverlays prop is empty (standalone mode),
  // otherwise delegate to prop-driven callback (for chart sync).
  const isActive = (key: OverlayKey): boolean =>
    activeOverlays.size > 0 ? activeOverlays.has(key) : !!overlays[key as keyof typeof overlays]

  const handleToggle = (key: OverlayKey) => {
    toggleOverlay(key)
    onToggleOverlay(key)
  }

  return (
    <div className="flex flex-col gap-1 px-4 pb-4">
      {OVERLAY_KEYS.map((key) => (
        <div
          key={key}
          className={cn(
            'flex items-center justify-between',
            'p-2.5 rounded-[var(--radius-sm)]',
            'border border-[var(--color-border-subtle)]',
            'bg-[var(--color-surface-raised)]/40',
            'hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border)]',
            'transition-colors duration-120',
            'cursor-pointer select-none',
          )}
          onClick={() => handleToggle(key)}
        >
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              {OVERLAY_LABELS[key]}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {OVERLAY_DESCRIPTIONS[key]}
            </span>
          </div>
          <ToggleSwitch checked={isActive(key)} onChange={() => handleToggle(key)} />
        </div>
      ))}
    </div>
  )
}

// ── Tab: Connection ────────────────────────────────────────────────────────────

function ConnectionTab({ status }: { status: ConnectionStatus }) {
  const { engineUrl, autoReconnect, pollInterval, setEngineUrl, setAutoReconnect, setPollInterval } =
    useSettingsStore()

  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      {/* Live connection status */}
      <div
        className={cn(
          'flex items-center justify-between p-3',
          'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]',
          'bg-[var(--color-surface-raised)]/40',
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            TimescaleDB
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            127.0.0.1:5532
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: status.connected ? 'var(--color-profit)' : 'var(--color-loss)',
              boxShadow: status.connected ? '0 0 6px var(--color-profit)' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: status.connected ? 'var(--color-profit)' : 'var(--color-loss)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            {status.connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40">
          <span
            style={{ fontSize: 18, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            className="tabular-nums"
          >
            {status.latencyMs}
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400 }}> ms</span>
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            LATENCY
          </span>
        </div>
        <div className="flex flex-col gap-0.5 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40">
          <span
            style={{ fontSize: 18, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            className="tabular-nums"
          >
            {status.barsLoaded.toLocaleString('en-US')}
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            BARS LOADED
          </span>
        </div>
      </div>

      {/* Persisted settings */}
      <Field label="Engine URL">
        <input
          type="text"
          value={engineUrl}
          onChange={(e) => setEngineUrl(e.target.value)}
          className={cn(
            'w-full h-8 px-2.5 rounded-[var(--radius-sm)]',
            'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]',
            'text-[var(--color-text-primary)]',
            'outline-none transition-colors',
            'focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30',
            'hover:border-[var(--color-border)]',
          )}
          style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
        />
      </Field>

      <Field label="Poll Interval">
        <NumericInput
          value={pollInterval}
          onChange={setPollInterval}
          step={500}
          min={1000}
          suffix="ms"
        />
      </Field>

      <div className="flex items-center justify-between py-1">
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Auto-Reconnect
        </span>
        <ToggleSwitch checked={autoReconnect} onChange={setAutoReconnect} />
      </div>

      <div
        className={cn(
          'flex items-center gap-2 p-3',
          'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]',
          'bg-[var(--color-surface-raised)]/40',
        )}
      >
        <Database size={13} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Engine API
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)',
            marginLeft: 'auto',
          }}
        >
          {engineUrl.replace(/^https?:\/\/[^:]+/, '')}
        </span>
      </div>
    </div>
  )
}

// ── Tab: Alerts ────────────────────────────────────────────────────────────────

function AlertsTab() {
  const { soundAlerts, setSoundAlerts } = useSettingsStore()

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div
        className={cn(
          'flex items-center justify-between p-3',
          'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]',
          'bg-[var(--color-surface-raised)]/40',
          'cursor-pointer select-none',
          'hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border)]',
          'transition-colors duration-120',
        )}
        onClick={() => setSoundAlerts(!soundAlerts)}
      >
        <div className="flex items-center gap-2.5">
          {soundAlerts ? (
            <Bell size={14} style={{ color: 'var(--color-accent)' }} strokeWidth={1.5} />
          ) : (
            <BellOff size={14} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          )}
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              Sound Alerts
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              Play audio on signal events
            </span>
          </div>
        </div>
        <ToggleSwitch checked={soundAlerts} onChange={setSoundAlerts} />
      </div>

      <div
        className="p-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40"
      >
        <span
          style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          className="uppercase tracking-wider"
        >
          Alert Triggers
        </span>
        {[
          { label: 'Confluence Signal', description: 'High-confidence confluence events' },
          { label: 'Volume Spike', description: 'RVOL exceeds 2σ threshold' },
          { label: 'Pattern Trigger', description: 'New pattern detected' },
          { label: 'Session Change', description: 'Market session transition' },
        ].map(({ label, description }) => (
          <div key={label} className="flex items-center justify-between mt-2.5">
            <div className="flex flex-col gap-0.5">
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {label}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {description}
              </span>
            </div>
            <ToggleSwitch checked={soundAlerts} onChange={setSoundAlerts} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  activeOverlays: Set<OverlayKey>
  onToggleOverlay: (key: OverlayKey) => void
  connectionStatus: ConnectionStatus
  tradingConfig?: RiskConfig | null
  onConfigSaved?: (config: RiskConfig) => void
}

export function SettingsPanel({
  open,
  onClose,
  activeOverlays,
  onToggleOverlay,
  connectionStatus,
  tradingConfig,
  onConfigSaved,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('risk')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'risk', label: 'Risk' },
    { key: 'display', label: 'Display' },
    { key: 'connection', label: 'Connection' },
    { key: 'alerts', label: 'Alerts' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="settings-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 400,
              background: 'var(--color-surface-secondary)',
              borderLeft: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 shrink-0"
              style={{
                height: 48,
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.02em',
                }}
              >
                Settings
              </span>
              <button
                onClick={onClose}
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)]',
                  'text-[var(--color-text-muted)]',
                  'hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]',
                  'transition-colors duration-120',
                  'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
                )}
                aria-label="Close settings"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            {/* Tab bar */}
            <div
              className="flex shrink-0 px-4 gap-0"
              style={{
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingTop: 8,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative px-3 pb-2 transition-colors duration-120',
                    'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
                  )}
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color:
                      activeTab === tab.key
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    fontWeight: activeTab === tab.key ? 600 : 400,
                    borderBottom: activeTab === tab.key
                      ? '2px solid var(--color-accent)'
                      : '2px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pt-4">
              {activeTab === 'risk' && (
                <RiskTab
                  onClose={onClose}
                  externalConfig={tradingConfig}
                  onConfigSaved={onConfigSaved}
                />
              )}
              {activeTab === 'display' && (
                <DisplayTab
                  activeOverlays={activeOverlays}
                  onToggleOverlay={onToggleOverlay}
                />
              )}
              {activeTab === 'connection' && (
                <ConnectionTab status={connectionStatus} />
              )}
              {activeTab === 'alerts' && <AlertsTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
