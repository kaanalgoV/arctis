import { create } from 'zustand'
import type { Timeframe, WsStatus, MarketInfo } from '../types/contracts'

// Front-month fallback map (updated when /api/markets is unavailable)
const SYMBOL_MAP_FALLBACK: Record<string, string> = {
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
  /** Markets fetched from /api/markets on app init */
  markets: MarketInfo[]
  /** Tracks whether chart bars are sourced from live feed or DB polling */
  dataSource: 'db' | 'live'

  setMarket: (market: string) => void
  setTimeframe: (tf: Timeframe) => void
  setSymbol: (symbol: string) => void
  setDays: (days: number) => void
  setWsStatus: (status: WsStatus) => void
  setLastBarTs: (ts: number) => void
  setMarkets: (markets: MarketInfo[]) => void
  setDataSource: (s: 'db' | 'live') => void
  /**
   * Resolves the front-month symbol for a given root.
   * Checks fetched markets first, then falls back to static map.
   */
  resolveSymbol: (root: string) => string
}

export const useMarketStore = create<MarketState>((set, get) => ({
  market: 'NQ',
  symbol: 'NQH6',
  timeframe: '15min',
  days: 30,
  wsStatus: 'disconnected',
  lastBarTs: null,
  markets: [],
  dataSource: 'db',

  setMarket: (market) => {
    const resolved = get().resolveSymbol(market)
    set({ market, symbol: resolved })
  },
  setTimeframe: (timeframe) => set({ timeframe }),
  setSymbol: (symbol) => set({ symbol }),
  setDays: (days) => set({ days }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setLastBarTs: (lastBarTs) => set({ lastBarTs }),
  setMarkets: (markets) => set({ markets }),
  setDataSource: (dataSource) => set({ dataSource }),

  resolveSymbol: (root: string): string => {
    const { markets } = get()
    if (markets.length > 0) {
      const marketInfo = markets.find((m) => m.root === root)
      if (marketInfo?.contracts?.length) {
        // First contract is the front month
        const frontContract = marketInfo.contracts[0]
        if (frontContract?.symbol) return frontContract.symbol
      }
    }
    const fallback = SYMBOL_MAP_FALLBACK[root]
    if (!fallback) {
      console.warn(`resolveSymbol: unknown root "${root}", using fallback "${root}H6"`)
      return `${root}H6`
    }
    return fallback
  },
}))
