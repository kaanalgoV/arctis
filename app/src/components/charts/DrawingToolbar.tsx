import { Minus, Square, TrendingUp, Type, Trash2 } from 'lucide-react'
import type { DrawingTool } from '@/hooks/useDrawings'
import { CHART_TOKENS } from '@/lib/chart-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawingToolbarProps {
  activeTool: DrawingTool | null
  onSelectTool: (tool: DrawingTool | null) => void
  onClear: () => void
  drawingCount?: number
}

// ─── Tool config ──────────────────────────────────────────────────────────────

interface ToolConfig {
  key: DrawingTool
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
}

// Only tools that are fully implemented in SimpleChart rendering.
// rectangle / trendline / text require a dedicated SVG canvas layer — not yet built.
const TOOLS: ToolConfig[] = [
  { key: 'hline', icon: Minus, label: 'Horizontal line' },
]

// Keep imports referenced to avoid lint errors when they are re-enabled later.
void Square
void TrendingUp
void Type

// ─── Component ────────────────────────────────────────────────────────────────

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  onClear,
  drawingCount = 0,
}: DrawingToolbarProps) {
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
              onClick={() => onSelectTool(isActive ? null : key)}
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
                color: isActive ? '#5CB8F0' : CHART_TOKENS.axis.label,
                cursor: 'pointer',
                transition: 'border-color 0.12s, background 0.12s, color 0.12s',
                padding: 0,
                flexShrink: 0,
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
            >
              <Icon size={13} strokeWidth={1.8} />
            </button>
          )
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

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
            transition: 'border-color 0.12s, background 0.12s, color 0.12s',
            padding: 0,
            flexShrink: 0,
            pointerEvents: 'all',
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
        >
          <Trash2 size={12} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
