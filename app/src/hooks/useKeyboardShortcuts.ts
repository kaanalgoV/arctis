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
}

const ZOOM_FACTOR = 0.2

/**
 * Registers global keyboard shortcuts for chart navigation and UI control.
 *
 * Shortcuts:
 *   Space       - toggle replay play/pause (only when isReplayActive is true)
 *   + / =       - zoom chart in
 *   -           - zoom chart out
 *   1-5         - switch timeframe by index
 *   Ctrl+K / Cmd+K - focus search (placeholder, fires onCloseSettings as fallback)
 *   Esc         - close settings panel
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

      // Esc — close settings
      if (key === 'Escape') {
        onCloseSettings?.()
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
  ])
}
