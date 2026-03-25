import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { IChartApi } from 'lightweight-charts'

export interface KeyboardShortcutsOptions {
  /** Called when Space is pressed and replay mode is active. */
  onToggleReplay?: () => void
  /** Whether replay mode is currently active. Space only fires when true. */
  isReplayActive?: boolean
  /** Called when "+" / "=" is pressed. */
  onZoomIn?: () => void
  /** Called when "-" is pressed. */
  onZoomOut?: () => void
  /** Called with timeframe index (1-based) when keys 1-5 are pressed. */
  onSelectTimeframe?: (index: number) => void
  /** Called when Esc is pressed. */
  onCloseSettings?: () => void
  /** LightweightCharts API reference for zoom operations. */
  chartRef?: RefObject<IChartApi | null>
  /**
   * Called when Delete or Backspace is pressed.
   * Receives the currently selected drawing ID (or null when nothing is selected).
   * The caller is responsible for removing the drawing from the store.
   */
  onDeleteDrawing?: (selectedId: string | null) => void
  /**
   * Currently selected drawing ID — passed back to onDeleteDrawing so the
   * caller does not need to read from the store itself.
   */
  selectedDrawingId?: string | null
  /**
   * Called when Ctrl+Z / Cmd+Z is pressed (undo last drawing action).
   */
  onUndoDrawing?: () => void
  /**
   * Called when Ctrl+Shift+Z / Cmd+Shift+Z is pressed (redo last drawing action).
   */
  onRedoDrawing?: () => void
  /**
   * Called when Escape is pressed while a drawing tool is active.
   * Takes priority over onCloseSettings when a tool is active.
   */
  onCancelDrawingTool?: () => void
}

const ZOOM_FACTOR = 0.2

/**
 * Registers global keyboard shortcuts for chart navigation and UI control.
 *
 * Shortcuts:
 *   Space             - toggle replay play/pause (only when isReplayActive is true)
 *   + / =             - zoom chart in
 *   -                 - zoom chart out
 *   1-5               - switch timeframe by index
 *   Ctrl+K / Cmd+K    - focus search (placeholder, fires onCloseSettings as fallback)
 *   Esc               - cancel active drawing tool (if any), then close settings panel
 *   Delete/Backspace  - remove currently selected drawing
 *   Ctrl+Z / Cmd+Z    - undo last drawing action
 *   Ctrl+Shift+Z / Cmd+Shift+Z - redo last drawing action
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    onToggleReplay,
    isReplayActive = false,
    onZoomIn,
    onZoomOut,
    onSelectTimeframe,
    onCloseSettings,
    chartRef,
    onDeleteDrawing,
    selectedDrawingId = null,
    onUndoDrawing,
    onRedoDrawing,
    onCancelDrawingTool,
  } = options

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when the user is typing in an input / textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key

      // Space — toggle replay play/pause
      if (key === ' ' && isReplayActive) {
        e.preventDefault()
        onToggleReplay?.()
        return
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z — redo drawing action
      if (key === 'Z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        onRedoDrawing?.()
        return
      }

      // Ctrl+Z / Cmd+Z — undo drawing action (must come AFTER the Shift variant)
      if (key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        onUndoDrawing?.()
        return
      }

      // + or = — zoom in (narrow the visible range)
      if (key === '+' || key === '=') {
        e.preventDefault()
        if (chartRef?.current) {
          const ts = chartRef.current.timeScale()
          const range = ts.getVisibleLogicalRange()
          if (range) {
            const size = range.to - range.from
            const shrink = size * ZOOM_FACTOR
            ts.setVisibleLogicalRange({ from: range.from + shrink, to: range.to - shrink })
          }
        }
        onZoomIn?.()
        return
      }

      // - — zoom out (widen the visible range)
      if (key === '-') {
        e.preventDefault()
        if (chartRef?.current) {
          const ts = chartRef.current.timeScale()
          const range = ts.getVisibleLogicalRange()
          if (range) {
            const size = range.to - range.from
            const expand = size * ZOOM_FACTOR
            ts.setVisibleLogicalRange({ from: range.from - expand, to: range.to + expand })
          }
        }
        onZoomOut?.()
        return
      }

      // 1-5 — switch timeframe
      if (/^[1-5]$/.test(key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onSelectTimeframe?.(parseInt(key, 10))
        return
      }

      // Ctrl+K / Cmd+K — focus search
      if (key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        // Placeholder: close settings for now; a search component can hook here later
        onCloseSettings?.()
        return
      }

      // Delete / Backspace — remove selected drawing
      if (key === 'Delete' || key === 'Backspace') {
        if (onDeleteDrawing) {
          e.preventDefault()
          onDeleteDrawing(selectedDrawingId)
        }
        return
      }

      // Esc — cancel active drawing tool first; if no tool active, close settings
      if (key === 'Escape') {
        if (onCancelDrawingTool) {
          onCancelDrawingTool()
        } else {
          onCloseSettings?.()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    onToggleReplay,
    isReplayActive,
    onZoomIn,
    onZoomOut,
    onSelectTimeframe,
    onCloseSettings,
    chartRef,
    onDeleteDrawing,
    selectedDrawingId,
    onUndoDrawing,
    onRedoDrawing,
    onCancelDrawingTool,
  ])
}
