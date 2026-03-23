import { create } from 'zustand'
import type { Timeframe, WsStatus } from '../types/contracts'

// Front-month mapping (matches backend FRONT_MONTH)
const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQH6',
  ES: 'ESZ5',
  CL: 'CLJ6',
  GC: 'GCJ6',
  '6E': '6EH6',
  '6J': '6JH6',
}

export interface MarketState {
  market: string
  symbol: string
  timeframe: Timeframe
  days: number
  wsStatus: WsStatus
  lastBarTs: number | null

  setMarket: (market: string) => void
  setTimeframe: (tf: Timeframe) => void
  setSymbol: (symbol: string) => void
  setDays: (days: number) => void
  setWsStatus: (status: WsStatus) => void
  setLastBarTs: (ts: number) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  market: 'NQ',
  symbol: 'NQH6',
  timeframe: '15min',
  days: 30,
  wsStatus: 'disconnected',
  lastBarTs: null,

  setMarket: (market) => set({
    market,
    symbol: SYMBOL_MAP[market] || `${market}H6`,
  }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setSymbol: (symbol) => set({ symbol }),
  setDays: (days) => set({ days }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setLastBarTs: (lastBarTs) => set({ lastBarTs }),
}))
