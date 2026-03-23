import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawingTool = 'hline' | 'rectangle' | 'trendline' | 'text'

export interface HLineData {
  price: number
}

export interface RectangleData {
  priceTop: number
  priceBottom: number
  timeStart: number
  timeEnd: number
}

export interface TrendlineData {
  priceStart: number
  priceEnd: number
  timeStart: number
  timeEnd: number
}

export interface TextNoteData {
  price: number
  time: number
  text: string
}

export interface Drawing {
  id: string
  type: DrawingTool
  symbol: string
  timeframe: string
  data: HLineData | RectangleData | TrendlineData | TextNoteData
  color: string
  createdAt: number
}

// ─── Persistence key ──────────────────────────────────────────────────────────

function storageKey(symbol: string, timeframe: string): string {
  return `arctis:drawings:${symbol}:${timeframe}`
}

function loadFromStorage(symbol: string, timeframe: string): Drawing[] {
  try {
    const raw = localStorage.getItem(storageKey(symbol, timeframe))
    if (!raw) return []
    return JSON.parse(raw) as Drawing[]
  } catch {
    return []
  }
}

function saveToStorage(symbol: string, timeframe: string, drawings: Drawing[]): void {
  try {
    localStorage.setItem(storageKey(symbol, timeframe), JSON.stringify(drawings))
  } catch {
    // Storage quota exceeded — silently skip
  }
}

// ─── Default colors per tool ──────────────────────────────────────────────────

const DEFAULT_COLORS: Record<DrawingTool, string> = {
  hline: 'rgba(92, 184, 240, 0.85)',
  rectangle: 'rgba(92, 184, 240, 0.35)',
  trendline: 'rgba(251, 191, 36, 0.85)',
  text: '#E5E9EF',
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDrawings(symbol: string, timeframe: string) {
  const [drawings, setDrawings] = useState<Drawing[]>(() =>
    loadFromStorage(symbol, timeframe),
  )
  const [activeTool, setActiveToolState] = useState<DrawingTool | null>(null)

  // Reload from storage when symbol / timeframe change
  useEffect(() => {
    setDrawings(loadFromStorage(symbol, timeframe))
    setActiveToolState(null)
  }, [symbol, timeframe])

  // Persist to localStorage whenever drawings change
  useEffect(() => {
    saveToStorage(symbol, timeframe, drawings)
  }, [drawings, symbol, timeframe])

  const setActiveTool = useCallback((tool: DrawingTool | null) => {
    setActiveToolState((prev) => (prev === tool ? null : tool))
  }, [])

  const addDrawing = useCallback(
    (type: DrawingTool, data: Drawing['data'], color?: string): Drawing => {
      const drawing: Drawing = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        symbol,
        timeframe,
        data,
        color: color ?? DEFAULT_COLORS[type],
        createdAt: Date.now(),
      }
      setDrawings((prev) => [...prev, drawing])
      return drawing
    },
    [symbol, timeframe],
  )

  const removeDrawing = useCallback((id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearDrawings = useCallback(() => {
    setDrawings([])
  }, [])

  return {
    drawings,
    activeTool,
    setActiveTool,
    addDrawing,
    removeDrawing,
    clearDrawings,
  }
}
