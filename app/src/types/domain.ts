// Ported from AlgoView CandlestickChart
// Domain type aliases used by chart annotations and hooks.
// Arctis uses Bar (from @/types/contracts) as the primary OHLCV type;
// Candle is an alias that satisfies AlgoView-ported modules which expect .time.

export interface Candle {
  time: number;       // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Optional contract symbol (e.g. "NQH6") when using rollover data */
  contract?: string;
}
