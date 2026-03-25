// Ported from AlgoView CandlestickChart
/**
 * Shared types for annotation builder functions.
 */

import type { SciChartSurface } from 'scichart';
import type { Candle } from '@/types/domain';
import type { ChartSettings } from '@/types/settings';

/**
 * Context passed to all annotation builder functions.
 * Contains the chart surface, data, and settings needed to create annotations.
 */
export interface AnnotationContext {
  /** The SciChart surface to add annotations to */
  surface: SciChartSurface;
  /** Current candle data */
  candles: Candle[];
  /** Function to find candle index from Unix timestamp */
  findCandleIndex: (timestamp: number) => number;
  /** Chart appearance settings */
  chartSettings: ChartSettings;
  /** Tick size for calculating tick distances (optional) */
  tickSize?: number;
}
