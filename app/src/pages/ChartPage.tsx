import { useRef, useCallback, useState, useEffect } from 'react'
import { SimpleChart } from '@/components/charts/SimpleChart'
import type { ChartZone } from '@/components/charts/SimpleChart'
import { ChartToolbar } from '@/components/charts/ChartToolbar'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import { DrawingToolbar } from '@/components/charts/DrawingToolbar'
import { ReplayBar } from '@/components/replay/ReplayBar'
import type { OHLCVBar } from '@/types/market'
import type { IndicatorData } from '@/types/analysis'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { IChartApi } from 'lightweight-charts'
import type { Drawing, DrawingTool } from '@/hooks/useDrawings'
import type { TradeSignal } from '@/hooks/useSignals'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StructureBreak {
  type: string
  direction: string
  price: number
  timestamp: number
}

interface ReplayState {
  isPlaying: boolean
  speed: number
  progress: number
  replayDate: string | null
  simStatus: { visible_bars: number; total_bars: number } | null
  availableDates: string[]
  start: (date?: string) => Promise<void>
  stop: () => Promise<void>
  pause: () => void
  resume: () => void
  setSpeed: (s: number) => void
  seek: (pct: number) => void
  changeDate: (direction: 'prev' | 'next') => void
  setReplayDate: (date: string) => void
}

export interface ChartPageProps {
  // Chart data
  symbol: string
  chartBars: OHLCVBar[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  // Overlays
  activeOverlays: Set<OverlayKey>
  onToggleOverlay: (key: OverlayKey) => void
  // Analysis data
  indicatorData: IndicatorData | null
  structureBreaks: StructureBreak[] | undefined
  patternAnnotations: PatternsAPIData['annotations'] | undefined
  zones: ChartZone[] | undefined
  // Drawings
  drawings: Drawing[]
  activeTool: DrawingTool | null
  onSelectTool: (tool: DrawingTool | null) => void
  onClearDrawings: () => void
  onChartClick?: (price: number, timestamp: number) => void
  scrollToTimestamp: number | null
  onChartReady: (chart: IChartApi) => void
  // Signals
  signals?: TradeSignal[]
  // Mode
  mode: 'live' | 'replay'
  replay: ReplayState
  replayCurrentTime: string
  replayTotalTime: string
}

// ── Session levels helper ─────────────────────────────────────────────────────

function deriveSessionLevels(indicatorData: IndicatorData | null) {
  if (
    !indicatorData?.session_levels ||
    indicatorData.session_levels.prev_high == null ||
    indicatorData.session_levels.prev_low == null ||
    indicatorData.session_levels.prev_close == null
  ) {
    return null
  }
  return {
    prev_high: indicatorData.session_levels.prev_high as number,
    prev_low: indicatorData.session_levels.prev_low as number,
    prev_close: indicatorData.session_levels.prev_close as number,
    opening_range_high: (indicatorData.session_levels.opening_range_high ?? 0) as number,
    opening_range_low: (indicatorData.session_levels.opening_range_low ?? 0) as number,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChartPage({
  symbol,
  chartBars,
  isLoading,
  isConnected: _isConnected,
  error,
  activeOverlays,
  onToggleOverlay,
  indicatorData,
  structureBreaks,
  patternAnnotations,
  zones,
  drawings,
  activeTool,
  onSelectTool,
  onClearDrawings,
  onChartClick,
  scrollToTimestamp,
  onChartReady,
  signals,
  mode,
  replay,
  replayCurrentTime,
  replayTotalTime,
}: ChartPageProps) {
  const _containerRef = useRef<HTMLDivElement>(null)
  const chartBodyRef = useRef<HTMLDivElement>(null)

  // ── Fullscreen state and handler ────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Prefer the chart body container; fall back to documentElement
      const target = chartBodyRef.current ?? document.documentElement
      target.requestFullscreen().catch(() => {
        // requestFullscreen can fail (e.g. sandboxed iframe) — silently ignore
      })
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const sessionLevels = deriveSessionLevels(indicatorData)

  const handleChartReady = useCallback(
    (chart: IChartApi) => {
      onChartReady(chart)
    },
    [onChartReady],
  )

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-[var(--color-surface-base)]"
      ref={_containerRef}
    >
      {/* Chart toolbar */}
      <ChartToolbar
        symbol={symbol}
        activeOverlays={activeOverlays}
        onToggleOverlay={onToggleOverlay}
        onFullscreen={handleFullscreen}
      />

      {/* Chart body */}
      <div className="flex-1 relative overflow-hidden" ref={chartBodyRef}>
        {error ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-sm text-[var(--color-loss)]">{error}</span>
          </div>
        ) : isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-sm text-[var(--color-text-muted)] animate-pulse tabular-nums">
              Loading {symbol}...
            </span>
          </div>
        ) : chartBars.length > 0 ? (
          <>
            <SimpleChart
              bars={chartBars}
              className={isFullscreen ? 'w-full h-screen' : 'w-full h-full'}
              vwapData={indicatorData?.vwap}
              emaData={indicatorData?.ema}
              volumeProfile={indicatorData?.volume_profile}
              dailyVolumeProfiles={indicatorData?.daily_volume_profiles}
              sessionLevels={sessionLevels}
              structureBreaks={structureBreaks}
              patternAnnotations={patternAnnotations}
              showVwap={activeOverlays.has('vwap')}
              showEma={activeOverlays.has('ema')}
              showVolume={activeOverlays.has('volume')}
              showVp={activeOverlays.has('vp')}
              showLevels={activeOverlays.has('levels')}
              zones={zones}
              showZones={activeOverlays.has('zones')}
              onChartReady={handleChartReady}
              scrollToTimestamp={scrollToTimestamp}
              drawings={drawings}
              onChartClick={activeTool ? onChartClick : undefined}
              signals={signals}
            />
            <DrawingToolbar
              activeTool={activeTool}
              onSelectTool={onSelectTool}
              onClear={onClearDrawings}
              drawingCount={drawings.length}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-sm text-[var(--color-text-muted)]">No data</span>
          </div>
        )}
      </div>

      {/* Replay bar — only in replay mode */}
      {mode === 'replay' && (
        <div style={{ height: 32, flexShrink: 0 }}>
          <ReplayBar
            isPlaying={replay.isPlaying}
            speed={replay.speed}
            progress={replay.progress}
            currentTime={replayCurrentTime}
            totalTime={replayTotalTime}
            date={replay.replayDate ?? ''}
            availableDates={replay.availableDates}
            onPlay={() => {
              if (replay.isPlaying && typeof replay.resume === 'function') {
                replay.resume()
              } else {
                void replay.start()
              }
            }}
            onPause={() => typeof replay.pause === 'function' ? replay.pause() : void replay.stop()}
            onSpeedChange={(s) => {
              replay.setSpeed(s)
              if (replay.isPlaying) void replay.start()
            }}
            onSeek={replay.seek}
            onDateChange={replay.changeDate}
            onSelectDate={(date) => {
              replay.setReplayDate(date)
              void replay.stop().then(() => replay.start(date))
            }}
          />
        </div>
      )}
    </div>
  )
}
