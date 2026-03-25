import { create } from 'zustand'
import type { Timeframe, WsStatus, MarketInfo } from '../types/contracts'

// Front-month fallback map (updated when /api/markets is unavailable)
const SYMBOL_MAP_FALLBACK: Record<string, string> = {
  NQ: 'NQM6',
  ES: 'ESM6',
  CL: 'CLK6',
  GC: 'GCM6',
  '6E': '6EM6',
  '6J': '6JM6',
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
  /**
   * Tracks how chart bars are currently sourced:
   *   'db'     — REST polling from TimescaleDB (default, non-live mode)
   *   'live'   — WS / live feed from rithmic/databento (live service active)
   *   'replay' — Sim bars served by the replay engine (/api/bars)
   */
  dataSource: 'db' | 'live' | 'replay'

  setMarket: (market: string) => void
  setTimeframe: (tf: Timeframe) => void
  setSymbol: (symbol: string) => void
  setDays: (days: number) => void
  setWsStatus: (status: WsStatus) => void
  setLastBarTs: (ts: number) => void
  setMarkets: (markets: MarketInfo[]) => void
  setDataSource: (s: 'db' | 'live' | 'replay') => void
  /**
   * Resolves the front-month symbol for a given root.
   * Checks fetched markets first, then falls back to static map.
   */
  resolveSymbol: (root: string) => string
}

export const useMarketStore = create<MarketState>((set, get) => ({
  market: 'NQ',
  symbol: 'NQM6',
  timeframe: '5min',
  days: 60,
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
        // Pick contract with latest month code (M > H > Z etc.)
        const sorted = [...marketInfo.contracts].sort((a, b) => {
          // Month codes: F G H J K M N Q U V X Z (Jan-Dec)
          const months = 'FGHJKMNQUVXZ'
          const aMonth = months.indexOf(a.month_code) ?? 0
          const bMonth = months.indexOf(b.month_code) ?? 0
          const aYear = parseInt(a.year_code) || 0
          const bYear = parseInt(b.year_code) || 0
          return bYear - aYear || bMonth - aMonth  // newest first
        })
        const frontContract = sorted[0]
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
