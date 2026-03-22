export interface OHLCVBar {
  timestamp: number // Unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Market = 'ES' | 'NQ' | 'CL' | 'GC' | '6E' | '6J'
export type Timeframe = '1min' | '5min'
