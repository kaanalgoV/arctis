/**
 * Zustand store for live market data.
 *
 * Arctis is read-only: no orders, no positions, no account state.
 * This store holds candles, last price, connection status, and latency.
 *
 * Candle update logic:
 * - Historical bars arrive as a batch via onHistorical → setCandles
 * - Live bars arrive individually via onCandle → updateCandle
 *   - If a bar with the same timestamp exists, it is replaced (live update)
 *   - Otherwise it is appended (new closed bar or first live bar)
 */

import { create } from 'zustand'

// ============ Types ============

export interface LiveCandle {
  /** Unix timestamp in seconds (matches lightweight-charts format) */
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface LiveState {
  isConnected: boolean
  /** Historical + live candles, sorted ascending by timestamp */
  candles: LiveCandle[]
  /** Last trade/close price received */
  lastPrice: number | null
  /** Approximate feed latency in milliseconds (server→browser) */
  latencyMs: number | null

  setConnected: (v: boolean) => void
  setCandles: (candles: LiveCandle[]) => void
  updateCandle: (candle: LiveCandle) => void
  setLastPrice: (price: number) => void
  setLatency: (ms: number) => void
  reset: () => void
}

// ============ Store ============

const initialState = {
  isConnected: false,
  candles: [] as LiveCandle[],
  lastPrice: null as number | null,
  latencyMs: null as number | null,
}

export const useLiveStore = create<LiveState>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),

  setCandles: (candles) => set({ candles }),

  updateCandle: (incoming) =>
    set((state) => {
      const idx = state.candles.findIndex((c) => c.timestamp === incoming.timestamp)

      if (idx >= 0) {
        // Replace existing bar (live tick update)
        const updated = [...state.candles]
        updated[idx] = incoming
        return { candles: updated, lastPrice: incoming.close }
      }

      // Append new bar — keep sorted by appending (live feed is chronological)
      return {
        candles: [...state.candles, incoming],
        lastPrice: incoming.close,
      }
    }),

  setLastPrice: (lastPrice) => set({ lastPrice }),

  setLatency: (latencyMs) => set({ latencyMs }),

  reset: () => set(initialState),
}))
