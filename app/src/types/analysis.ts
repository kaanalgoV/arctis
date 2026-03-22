// Analysis API response types

export interface SessionStats {
  bar_count: number
  avg_volume: number
  avg_range: number
  total_volume: number
}

export interface SessionData {
  current_session: string
  session_stats: Record<string, SessionStats>
  bar_count: number
}

export interface ConfluenceSignal {
  name: string
  direction: string
  strength: number
  detail: string
}

export interface ConfluenceData {
  score: number
  max_score: number
  direction: string
  confidence: string
  signals: ConfluenceSignal[]
  indicators: {
    vwap: Record<string, number> | null
    ema: { ema9: number; ema21: number; ema50: number; alignment: string } | null
    rsi: { rsi: number; divergence: boolean } | null
    volume_profile: { poc: number; vah: number; val: number } | null
    session_levels: Record<string, number | null> | null
  }
}

export interface PatternAnnotation {
  timestamp: number
  pattern: string
  direction: string
  text: string
  detail: string
  confidence: number
  win_rate: number
  category: string
  price: number
  target: number | null
  marker_type: string
  color: string
  expiry_days: number
}

export interface PatternData {
  annotations: PatternAnnotation[]
  day_type: string
  day_bias: string
}

export interface VolumeRvol {
  index: number
  timestamp: number
  rvol: number
}

export interface VolumeSpike {
  index: number
  timestamp: number
  volume: number
  ratio: number
}

export interface VolumeData {
  relative_volume: VolumeRvol[]
  spikes: VolumeSpike[]
  bar_count: number
}

export interface IndicatorData {
  vwap: Array<{ timestamp: number; vwap: number; upper_1: number; lower_1: number; upper_2: number; lower_2: number }>
  ema: Array<{ timestamp: number; ema9: number; ema21: number; ema50: number; alignment: string }>
  rsi: Array<{ timestamp: number; rsi: number; divergence: boolean }>
  volume_profile: { poc: number; vah: number; val: number; total_volume: number } | null
  session_levels: Record<string, number | null>
}

export interface TradingConfig {
  account_size: number
  risk_percent: number
  daily_loss_limit: number
  max_daily_trades: number
  tick_value_es: number
  tick_size_es: number
  tick_value_nq: number
  tick_size_nq: number
}
