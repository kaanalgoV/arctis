import { useEffect, useRef, useCallback, useState } from 'react'
import { useMarketStore } from '../store/market'
import type { Bar } from '../types/contracts'

const ENGINE_URL = 'http://127.0.0.1:8001'
const WS_URL = 'ws://127.0.0.1:8001'

export function useMarketData() {
  const { symbol, timeframe, days, setWsStatus, setLastBarTs } = useMarketStore()
  const [bars, setBars] = useState<Bar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttempt = useRef(0)

  // REST initial load
  const loadBars = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${ENGINE_URL}/api/db/bars?symbol=${symbol}&days=${days}&timeframe=${timeframe}`
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
  }, [symbol, timeframe, days, setLastBarTs])

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setWsStatus('connecting')
    const ws = new WebSocket(`${WS_URL}/ws/bars/${symbol}`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsStatus('connected')
      reconnectAttempt.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'bar' && msg.bar) {
          setBars(prev => {
            const last = prev[prev.length - 1]
            if (last && msg.bar.timestamp === last.timestamp) {
              // Update existing bar
              return [...prev.slice(0, -1), msg.bar]
            }
            // Append new bar
            return [...prev, msg.bar]
          })
          setLastBarTs(msg.bar.timestamp)
        }
        // Ignore heartbeat and snapshot messages for now
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
  }, [symbol, setWsStatus, setLastBarTs])

  // Load bars on symbol/timeframe change
  useEffect(() => {
    loadBars()
  }, [loadBars])

  // Connect WS after initial load
  useEffect(() => {
    if (!isLoading && bars.length > 0) {
      connectWs()
    }
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [symbol]) // Only reconnect on symbol change

  return { bars, isLoading, error, reload: loadBars }
}
