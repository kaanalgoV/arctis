import { useEffect, useRef, useCallback, useState } from 'react'
import { useMarketStore } from '../store/market'
import { useSettingsStore } from '../store/settings'
import type { Bar } from '../types/contracts'

type WsMessageType = 'subscribed' | 'snapshot' | 'bar' | 'heartbeat' | 'error' | 'replay_state'

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
            // Replace bars array with initial snapshot from server
            if (Array.isArray(msg.bars)) {
              const snapshotBars = msg.bars as Bar[]
              setBars(snapshotBars)
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
      setWsStatus('disconnected')
      wsRef.current = null
      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000)
      reconnectAttempt.current++
      setWsStatus('reconnecting')
      reconnectTimer.current = setTimeout(connectWs, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [symbol, setWsStatus, setLastBarTs, wsUrl])

  // Load bars on symbol/timeframe change
  useEffect(() => {
    loadBars()
  }, [loadBars])

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

  return { bars, isLoading, error, lastHeartbeat, reload: loadBars }
}
