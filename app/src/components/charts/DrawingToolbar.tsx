import { Minus, Square, TrendingUp, Type, Trash2 } from 'lucide-react'
import type { DrawingToolType } from '@/types/drawing'
import { useDrawingStore } from '@/stores/drawingStore'
import { CHART_TOKENS } from '@/lib/chart-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawingToolbarProps {
  /**
   * Controlled active tool (prop-driven usage).
   * When provided, takes precedence over the store value.
   * Pass null or undefined to fall back to reading from drawingStore.
   */
  activeTool?: DrawingToolType | null
  /** Controlled setter — called when user clicks a tool button. */
  onSelectTool?: (tool: DrawingToolType | null) => void
  onClear: () => void
  drawingCount?: number
}

// ─── Tool config ──────────────────────────────────────────────────────────────

// Only the subset of DrawingToolType that the toolbar exposes
type ToolbarTool = Extract<DrawingToolType, 'hline' | 'rectangle' | 'trendline' | 'text'>

interface ToolConfig {
  key: ToolbarTool
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
}

const TOOLS: ToolConfig[] = [
  { key: 'hline', icon: Minus, label: 'Horizontal line' },
  { key: 'rectangle', icon: Square, label: 'Rectangle' },
  { key: 'trendline', icon: TrendingUp, label: 'Trend line' },
  { key: 'text', icon: Type, label: 'Text note' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function DrawingToolbar({
  activeTool: propActiveTool,
  onSelectTool,
  onClear,
  drawingCount = 0,
}: DrawingToolbarProps) {
  // Read from store — prop takes precedence for backward-compat with legacy callers
  const storeActiveTool = useDrawingStore((s) => s.activeTool)
  const storeSetActiveTool = useDrawingStore((s) => s.setActiveTool)

  // Resolve effective active tool: prop wins if explicitly provided
  const activeTool: DrawingToolType | null =
    propActiveTool !== undefined ? propActiveTool : storeActiveTool

  // Resolve setter: prop setter wins, otherwise write to store
  const handleSelectTool = (key: ToolbarTool) => {
    const isActive = activeTool === key
    const next: DrawingToolType = isActive ? 'crosshair' : key
    if (onSelectTool) {
      onSelectTool(isActive ? null : key)
    }
    storeSetActiveTool(next)
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 6,
        top: 8,
        bottom: 8,
        width: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 4,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Tool buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pointerEvents: 'all',
        }}
      >
        {TOOLS.map(({ key, icon: Icon, label }) => {
          const isActive = activeTool === key
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              onClick={() => handleSelectTool(key)}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 5,
                border: isActive
                  ? '1px solid rgba(92, 184, 240, 0.55)'
                  : '1px solid transparent',
                background: isActive
                  ? 'rgba(92, 184, 240, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'var(--color-accent)' : CHART_TOKENS.axis.label,
                cursor: 'pointer',
                transition: 'border-color 0.12s, background 0.12s, color 0.12s, box-shadow 0.12s',
                padding: 0,
                flexShrink: 0,
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.background = 'rgba(255, 255, 255, 0.06)'
                  btn.style.color = '#C9D1DA'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.background = 'rgba(255, 255, 255, 0.03)'
                  btn.style.color = CHART_TOKENS.axis.label
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 184, 240, 0.5)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Icon size={13} strokeWidth={1.8} />
            </button>
          )
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider before destructive action */}
      {drawingCount > 0 && (
        <div
          style={{
            width: 16,
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      )}

      {/* Clear / trash button — only visible when there are drawings */}
      {drawingCount > 0 && (
        <button
          type="button"
          title="Clear all drawings"
          aria-label="Clear all drawings"
          onClick={onClear}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            border: '1px solid transparent',
            background: 'rgba(239, 65, 54, 0.06)',
            color: 'rgba(239, 65, 54, 0.55)',
            cursor: 'pointer',
            transition: 'border-color 0.12s, background 0.12s, color 0.12s, box-shadow 0.12s',
            padding: 0,
            flexShrink: 0,
            pointerEvents: 'all',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'rgba(239, 65, 54, 0.14)'
            btn.style.color = '#EF4136'
            btn.style.borderColor = 'rgba(239, 65, 54, 0.35)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'rgba(239, 65, 54, 0.06)'
            btn.style.color = 'rgba(239, 65, 54, 0.55)'
            btn.style.borderColor = 'transparent'
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 184, 240, 0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Trash2 size={12} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
