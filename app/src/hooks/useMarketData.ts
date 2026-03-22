import { useState, useEffect, useRef } from 'react'
import type { OHLCVBar } from '@/types/market'

const ENGINE_URL = 'http://127.0.0.1:8001'
const WS_URL = 'ws://127.0.0.1:8001'

export function useMarketData(symbol: string, days = 30) {
  const [bars, setBars] = useState<OHLCVBar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial REST load
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    fetch(`${ENGINE_URL}/api/db/bars?symbol=${symbol}&days=${days}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setBars(d.bars || [])
        setIsLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setIsLoading(false)
      })
  }, [symbol, days])

  // WebSocket for live updates
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/bars/${symbol}`)
      wsRef.current = ws

      ws.onopen = () => setIsConnected(true)

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'bar' && msg.data) {
            setBars(prev => {
              // Avoid duplicates
              const lastTs = prev.length > 0 ? prev[prev.length - 1].timestamp : 0
              if (msg.data.timestamp > lastTs) {
                return [...prev, msg.data]
              }
              return prev
            })
          }
        } catch { /* ignore parse errors */ }
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(() => {
          if (wsRef.current === ws) connect()
        }, 3000)
      }

      ws.onerror = () => setIsConnected(false)
    }

    connect()

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [symbol])

  return { bars, isLoading, isConnected, error, barsCount: bars.length }
}
