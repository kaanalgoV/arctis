import { Maximize2, Activity, TrendingUp, BarChart2, LayoutGrid, Ruler, Layers } from 'lucide-react'
import React from 'react'
import { CHART_TOKENS } from '../../lib/chart-tokens'

// ─── Overlay toggle config ──────────────────────────────────────────────────

type OverlayKey = 'vwap' | 'ema' | 'volume' | 'vp' | 'levels' | 'zones'

interface OverlayConfig {
  key: OverlayKey
  label: string
  color: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const OVERLAYS: OverlayConfig[] = [
  { key: 'vwap',   label: 'VWAP',   color: CHART_TOKENS.overlay.vwap,                  icon: Activity },
  { key: 'ema',    label: 'EMA',    color: '#5CB8F0',                                   icon: TrendingUp },
  { key: 'volume', label: 'Vol',    color: CHART_TOKENS.overlay.volume.bull,            icon: BarChart2 },
  { key: 'vp',     label: 'VP',     color: CHART_TOKENS.overlay.volumeProfile.poc,      icon: LayoutGrid },
  { key: 'levels', label: 'Levels', color: '#5CB8F0',                                   icon: Ruler },
  { key: 'zones',  label: 'Zones',  color: '#00B775',                                   icon: Layers },
]

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ChartToolbarProps {
  symbol: string
  contractInfo?: string
  /** Which overlays are currently active */
  activeOverlays: Set<OverlayKey>
  onToggleOverlay: (key: OverlayKey) => void
  onFullscreen?: () => void
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChartToolbar({
  symbol,
  contractInfo,
  activeOverlays,
  onToggleOverlay,
  onFullscreen,
  className,
}: ChartToolbarProps) {
  return (
    <div
      className={className}
      style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 8,
        background: 'var(--color-surface-primary)',
        borderBottom: `1px solid ${CHART_TOKENS.axis.border}`,
        flexShrink: 0,
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Left: Symbol + contract ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {symbol}
        </span>
        {contractInfo && (
          <span
            style={{
              fontSize: '0.68rem',
              color: CHART_TOKENS.axis.label,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {contractInfo}
          </span>
        )}
      </div>

      {/* ── Right: Overlay toggles + fullscreen ────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {OVERLAYS.map(({ key, label, color, icon }) => {
          const isActive = activeOverlays.has(key)
          return (
            <OverlayPill
              key={key}
              label={label}
              color={color}
              icon={icon}
              isActive={isActive}
              onToggle={() => onToggleOverlay(key)}
            />
          )
        })}

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 16,
            background: CHART_TOKENS.axis.border,
            marginLeft: 4,
            marginRight: 2,
          }}
        />

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={onFullscreen}
          aria-label="Fullscreen"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: onFullscreen ? 'pointer' : 'default',
            color: CHART_TOKENS.axis.label,
            padding: 0,
            transition: 'color 0.15s, box-shadow 0.15s',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (onFullscreen) {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = CHART_TOKENS.axis.label
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 184, 240, 0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Maximize2 size={13} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}

// ─── Overlay pill ────────────────────────────────────────────────────────────

interface OverlayPillProps {
  label: string
  color: string
  isActive: boolean
  onToggle: () => void
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

function OverlayPill({ label, color, isActive, onToggle, icon: Icon }: OverlayPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label={`Toggle ${label}`}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        border: isActive ? `1px solid ${color}55` : '1px solid var(--color-border-subtle)',
        background: isActive ? `${color}20` : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 150ms ease, background 150ms ease, color 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
        color: isActive ? color : 'var(--color-text-muted)',
        padding: 0,
        // Active buttons also get a subtle box-shadow to reinforce state
        boxShadow: isActive ? `0 0 0 1px ${color}18` : 'none',
        opacity: isActive ? 1 : 0.7,
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 184, 240, 0.5)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = isActive ? `0 0 0 1px ${color}18` : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-surface-raised)'
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        } else {
          // Active hover: brighten slightly
          e.currentTarget.style.background = `${color}2a`
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-muted)'
        } else {
          e.currentTarget.style.background = `${color}20`
        }
      }}
    >
      <Icon size={14} strokeWidth={1.75} />
    </button>
  )
}

export type { OverlayKey }
