import { useEffect, useRef, useCallback, useState } from 'react'
import { useMarketStore } from '../store/market'
import { useSettingsStore } from '../store/settings'
import type { Bar } from '../types/contracts'

type WsMessageType = 'subscribed' | 'snapshot' | 'bar' | 'heartbeat' | 'error' | 'replay_state'

// Live store integration disabled — was causing render loop.
// Re-enable when live service (port 28081) is stable.

// ---------------------------------------------------------------------------

export function useMarketData(options?: { pauseWs?: boolean }) {
  const { symbol, timeframe, days, setWsStatus, setLastBarTs } = useMarketStore()
  // Read engineUrl at render time so changes in settings propagate
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const wsUrl = engineUrl.replace(/^http/, 'ws')
  const [bars, setBars] = useState<Bar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttempt = useRef(0)

  // REST initial load
  const loadBars = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${engineUrl}/api/db/bars?symbol=${symbol}&days=${days}&timeframe=${timeframe}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const loadedBars: Bar[] = data.bars || []
      setBars(loadedBars)
      if (loadedBars.length > 0) {
        setLastBarTs(loadedBars[loadedBars.length - 1].timestamp)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bars')
    } finally {
      setIsLoading(false)
    }
  }, [symbol, timeframe, days, setLastBarTs, engineUrl])

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
            // Subscription confirmed by server — mark as connected
            setWsStatus('connected')
            break
          case 'snapshot':
            // Only use WS snapshot if it has MORE bars than current set
            // (prevents replacing a full REST load with a small WS snapshot)
            if (Array.isArray(msg.bars)) {
              const snapshotBars = msg.bars as Bar[]
              setBars(prev => {
                if (snapshotBars.length >= prev.length) {
                  return snapshotBars
                }
                // WS snapshot is smaller — ignore, keep REST data
                return prev
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
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000)
      reconnectAttempt.current++
      setWsStatus('reconnecting')
      reconnectTimer.current = setTimeout(connectWs, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [symbol, setWsStatus, setLastBarTs, wsUrl])

  // Load bars on symbol/timeframe change + poll every 5s for latest candle
  useEffect(() => {
    loadBars()
    const pollId = setInterval(async () => {
      try {
        // 1. Get real-time tick price (sub-second fresh)
        const priceRes = await fetch(`${engineUrl}/api/live/price?symbol=${symbol}`)
        let tickPrice: number | null = null
        if (priceRes.ok) {
          const priceData = await priceRes.json()
          if (priceData.price) tickPrice = priceData.price
        }

        // 2. Fetch bars in display timeframe
        const url = `${engineUrl}/api/db/bars?symbol=${symbol}&days=1&timeframe=${timeframe}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        const freshBars: Bar[] = data.bars || []
        if (freshBars.length === 0) return

        // 3. Override last bar's close with live tick price (if available)
        if (tickPrice) {
          const latest = { ...freshBars[freshBars.length - 1] }
          latest.close = tickPrice
          latest.high = Math.max(latest.high, tickPrice)
          latest.low = Math.min(latest.low, tickPrice)
          freshBars[freshBars.length - 1] = latest
          setLastBarTs(latest.timestamp)
        } else {
          const latest = freshBars[freshBars.length - 1]
          setLastBarTs(latest.timestamp)
        }

        // MERGE: keep the full dataset, only update/append bars from the poll
        setBars(prev => {
          if (prev.length === 0) return freshBars

          // Find where the poll data overlaps with existing bars
          const firstPollTs = freshBars[0].timestamp
          const cutoffIdx = prev.findIndex(b => b.timestamp >= firstPollTs)

          if (cutoffIdx === -1) {
            // No overlap — append all fresh bars
            return [...prev, ...freshBars]
          }

          // Keep everything before the overlap, replace with fresh data
          return [...prev.slice(0, cutoffIdx), ...freshBars]
        })
      } catch { /* silent */ }
    }, 5_000)
    return () => clearInterval(pollId)
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
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [symbol, options?.pauseWs]) // Reconnect on symbol change or pause toggle

  // (Poll-refresh is now integrated into the loadBars useEffect above)

  return { bars, isLoading, error, lastHeartbeat, reload: loadBars }
}
