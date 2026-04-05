import { useEffect, useRef, useCallback, useState } from 'react'
import { useMarketStore } from '../store/market'
import { useSettingsStore } from '../store/settings'
import type { Bar } from '../types/contracts'

type WsMessageType = 'subscribed' | 'snapshot' | 'bar' | 'heartbeat' | 'error' | 'replay_state'

// Live store integration disabled — was causing render loop.
// Re-enable when live service (port 28081) is stable.

// ---------------------------------------------------------------------------

export function useMarketData(options?: { pauseWs?: boolean }) {
  const { symbol, timeframe, days, setWsStatus, setLastBarTs, setDataSource } = useMarketStore()
  // Read engineUrl at render time so changes in settings propagate
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const wsUrl = engineUrl.replace(/^http/, 'ws')
  const [bars, setBars] = useState<Bar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null)
  // Live tick price — updated every 1s from /api/live/price.
  // Intentionally separate from `bars` so the chart bars array is never
  // mutated by a tick poll.  Consumers (Topbar, StatusBar) read this value
  // directly for display; CandlestickChart handles incremental updates via
  // its own mechanism.
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttempt = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // REST initial load (supports AbortSignal for cleanup)
  const loadBars = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    setDataSource('db')
    try {
      const url = `${engineUrl}/api/db/bars?symbol=${symbol}&days=${days}&timeframe=${timeframe}`
      const res = await fetch(url, signal ? { signal } : undefined)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (res.status === 204) return
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      const loadedBars: Bar[] = data.bars || []
      setBars(loadedBars)
      if (loadedBars.length > 0) {
        setLastBarTs(loadedBars[loadedBars.length - 1].timestamp)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const msg = e instanceof Error ? e.message : 'Failed to load bars'
      setError(msg)
      // Auto-retry after 5s on failure
      clearTimeout(retryTimer.current)
      retryTimer.current = setTimeout(() => { void loadBars() }, 5000)
    } finally {
      setIsLoading(false)
    }
  }, [symbol, timeframe, days, setLastBarTs, setDataSource, engineUrl])

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setWsStatus('connecting')
    const ws = new WebSocket(`${wsUrl}/ws/bars/${symbol}`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsStatus('connected')
      reconnectAttempt.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: WsMessageType; [key: string]: unknown }
        switch (msg.type) {
          case 'subscribed':
            // Subscription confirmed by server — mark as connected + live source
            setWsStatus('connected')
            setDataSource('live')
            break
          case 'snapshot':
            // Merge WS snapshot with existing bars so we never lose the
            // 31-day REST history.  The snapshot carries the full current
            // trading day, so merging fills any gap between the last REST
            // bar and the live stream while keeping all older history.
            if (Array.isArray(msg.bars)) {
              const snapshotBars = msg.bars as Bar[]
              setBars(prev => {
                if (prev.length === 0) return snapshotBars
                if (snapshotBars.length === 0) return prev
                // Build a map keyed by timestamp — incoming wins on conflict
                const map = new Map<number, Bar>()
                for (const bar of prev) map.set(bar.timestamp, bar)
                for (const bar of snapshotBars) map.set(bar.timestamp, bar)
                return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp)
              })
              if (snapshotBars.length > 0) {
                setLastBarTs(snapshotBars[snapshotBars.length - 1].timestamp)
              }
            }
            break
          case 'bar':
            if (msg.bar) {
              const newBar = msg.bar as Bar
              setBars(prev => {
                const last = prev[prev.length - 1]
                if (last && newBar.timestamp === last.timestamp) {
                  // Update existing bar (same minute candle)
                  return [...prev.slice(0, -1), newBar]
                }
                // Append new bar
                return [...prev, newBar]
              })
              setLastBarTs(newBar.timestamp)
            }
            break
          case 'heartbeat':
            // Update last heartbeat timestamp
            setLastHeartbeat(typeof msg.ts === 'number' ? msg.ts : Math.floor(Date.now() / 1000))
            break
          case 'error':
            setError(typeof msg.message === 'string' ? msg.message : 'WebSocket error from server')
            break
          case 'replay_state':
            // Replay status — handled by useReplay hook; ignore here
            break
          default:
            // Unknown type — ignore silently
            break
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      setDataSource('db')
      // Exponential backoff with jitter, capped at 10s (trading — every second counts)
      const base = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 10000)
      const jitter = Math.random() * base * 0.3 // 0-30% jitter
      const delay = Math.round(base + jitter)
      reconnectAttempt.current++
      setWsStatus('reconnecting')
      reconnectTimer.current = setTimeout(connectWs, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [symbol, setWsStatus, setLastBarTs, setDataSource, wsUrl])

  // ── Tick WebSocket — zero-delay price updates ───────────────────────────
  // Connects to /api/live/ticks WS and receives every Rithmic tick instantly.
  //
  // PERFORMANCE: During NY Open, NQ can produce 100-500+ ticks/second.
  // We CANNOT call React setState on every tick (would cause 500 re-renders/s).
  // Instead:
  //   1. Ticks update a mutable ref (zero-cost, no re-render)
  //   2. A requestAnimationFrame loop (60fps) flushes the latest tick to React state
  //   3. The chart gets smooth 60fps updates, not choppy 500-tick re-renders
  const tickWsRef = useRef<WebSocket | null>(null)
  const pendingTickRef = useRef<{ price: number; high: number; low: number } | null>(null)
  const rafIdRef = useRef<number>(0)

  useEffect(() => {
    if (options?.pauseWs) return

    const tickWsUrl = `${wsUrl}/api/live/ticks`
    const ws = new WebSocket(tickWsUrl)
    tickWsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type !== 'tick' || msg.symbol !== symbol) return

        const tickPrice: number = msg.price

        // Accumulate tick into ref (zero-cost, no React re-render)
        const pending = pendingTickRef.current
        if (pending) {
          pending.price = tickPrice
          pending.high = Math.max(pending.high, tickPrice)
          pending.low = Math.min(pending.low, tickPrice)
        } else {
          pendingTickRef.current = { price: tickPrice, high: tickPrice, low: tickPrice }
        }
      } catch { /* ignore */ }
    }

    // 60fps flush loop — batches all ticks received since last frame into ONE state update
    const flush = () => {
      const tick = pendingTickRef.current
      if (tick) {
        pendingTickRef.current = null
        const { price, high, low } = tick

        // Update display price (Topbar, StatusBar)
        setLivePrice(price)

        // Patch last candle for chart movement
        setBars(prev => {
          if (prev.length === 0) return prev
          const last = prev[prev.length - 1]
          if (last.close === price && last.high >= high && last.low <= low) return prev
          const updated: Bar = {
            ...last,
            close: price,
            high: Math.max(last.high, high),
            low: Math.min(last.low, low),
          }
          return [...prev.slice(0, -1), updated]
        })
      }
      rafIdRef.current = requestAnimationFrame(flush)
    }
    rafIdRef.current = requestAnimationFrame(flush)

    ws.onclose = () => { tickWsRef.current = null }
    ws.onerror = () => { ws.close() }

    return () => {
      ws.close()
      tickWsRef.current = null
      cancelAnimationFrame(rafIdRef.current)
      pendingTickRef.current = null
    }
  }, [symbol, wsUrl, options?.pauseWs])

  // ── Bar refresh (30s) — picks up newly closed bars from DB ──────────────
  // Much slower than before (was 15s) because tick WS handles real-time now.
  useEffect(() => {
    const abortController = new AbortController()
    loadBars(abortController.signal)

    const refreshId = setInterval(async () => {
      try {
        const refreshDays = timeframe === '1min' ? 1 : 5
        const url = `${engineUrl}/api/db/bars?symbol=${symbol}&days=${refreshDays}&timeframe=${timeframe}`
        const res = await fetch(url)
        if (!res.ok || res.status === 204) return
        const text = await res.text()
        if (!text) return
        const data = JSON.parse(text)
        const freshBars: Bar[] = data.bars || []
        if (freshBars.length === 0) return

        setBars(prev => {
          if (prev.length === 0) return freshBars
          const firstPollTs = freshBars[0].timestamp
          const cutoffIdx = prev.findIndex(b => b.timestamp >= firstPollTs)
          if (cutoffIdx === -1) return [...prev, ...freshBars]
          return [...prev.slice(0, cutoffIdx), ...freshBars]
        })
        if (freshBars.length > 0) {
          setLastBarTs(freshBars[freshBars.length - 1].timestamp)
        }
      } catch { /* silent */ }
    }, 30_000) // 30s refresh for bar persistence (ticks handle real-time)

    return () => {
      abortController.abort()
      clearInterval(refreshId)
      clearTimeout(retryTimer.current)
    }
  }, [symbol, timeframe, days, engineUrl, setLastBarTs])

  // Connect WS after initial load
  useEffect(() => {
    if (options?.pauseWs) {
      // Close any existing connection when entering replay
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
      return
    }
    if (!isLoading && bars.length > 0) {
      connectWs()
    }

    // Auto-reconnect when tab regains focus (trading — stale data is dangerous)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !options?.pauseWs) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          clearTimeout(reconnectTimer.current)
          reconnectAttempt.current = 0
          connectWs()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [symbol, options?.pauseWs]) // Reconnect on symbol change or pause toggle

  return { bars, isLoading, error, lastHeartbeat, livePrice, reload: loadBars }
}
