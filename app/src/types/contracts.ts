// Canonical domain types matching backend contracts

export interface Bar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ContractInfo {
  symbol: string
  root: string
  month_code: string
  year_code: string
}

export interface MarketInfo {
  root: string
  name: string
  contracts: ContractInfo[]
  timeframes: string[]
}

export interface MarketsResponse {
  markets: MarketInfo[]
}

export interface BarsResponse {
  bars: Bar[]
  count: number
  symbol?: string
  timeframe?: string
}

export interface HealthResponse {
  status: string
  db: string
  symbols: number
  error?: string
}

export interface FeedEvent {
  id: string
  timestamp: number
  type: 'session_change' | 'confluence_shift' | 'volume_spike' | 'pattern_trigger' | 'risk_warning' | 'bias_change'
  severity: 'info' | 'caution' | 'warning' | 'critical'
  message: string
  source: string
  barRef?: number
}

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// Canonical timeframes matching backend
export const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1h'] as const
export type Timeframe = typeof TIMEFRAMES[number]

// Display labels for timeframes
export const TF_DISPLAY: Record<Timeframe, string> = {
  '1min': '1m',
  '5min': '5m',
  '15min': '15m',
  '30min': '30m',
  '1h': '1h',
}
