import { Maximize2 } from 'lucide-react'
import { CHART_TOKENS } from '../../lib/chart-tokens'

// ─── Overlay toggle config ──────────────────────────────────────────────────

type OverlayKey = 'vwap' | 'ema' | 'volume' | 'vp' | 'levels' | 'zones'

interface OverlayConfig {
  key: OverlayKey
  label: string
  color: string
}

const OVERLAYS: OverlayConfig[] = [
  { key: 'vwap',   label: 'VWAP',   color: CHART_TOKENS.overlay.vwap },
  { key: 'ema',    label: 'EMA',    color: '#58A6FF' },
  { key: 'volume', label: 'Vol',    color: CHART_TOKENS.overlay.volume.bull },
  { key: 'vp',     label: 'VP',     color: CHART_TOKENS.overlay.volumeProfile.poc },
  { key: 'levels', label: 'Levels', color: '#5CB8F0' },
  { key: 'zones',  label: 'Zones',  color: '#34D399' },
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
        background: '#0F1318', // surface-primary
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
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#E5E9EF',
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
        {OVERLAYS.map(({ key, label, color }) => {
          const isActive = activeOverlays.has(key)
          return (
            <OverlayPill
              key={key}
              label={label}
              color={color}
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
            width: 24,
            height: 24,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: onFullscreen ? 'pointer' : 'default',
            color: CHART_TOKENS.axis.label,
            padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (onFullscreen) {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#E5E9EF'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = CHART_TOKENS.axis.label
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
}

function OverlayPill({ label, color, isActive, onToggle }: OverlayPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 22,
        paddingLeft: 7,
        paddingRight: 7,
        borderRadius: 11,
        border: isActive ? `1px solid ${color}55` : '1px solid transparent',
        background: isActive ? `${color}14` : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Colored dot */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: isActive ? color : CHART_TOKENS.axis.tick,
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
      />
      {/* Label */}
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: isActive ? color : CHART_TOKENS.axis.label,
          transition: 'color 0.15s',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </button>
  )
}

export type { OverlayKey }
