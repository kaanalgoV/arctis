// Ported from AlgoView CandlestickChart
import { useMemo } from 'react';
import type { Candle } from '@/types/domain';
import { getSessionBoundaryIndices } from '@/utils/chartTimeZone';

/**
 * Detects displayed day/session boundaries in candle data.
 *
 * Returns candle indices where the displayed session day changes compared to
 * the previous candle.
 *
 * @param candles - Array of candles to analyze
 * @param timeZone - Display timezone used for chart labels and separators
 * @returns Array of candle indices where a new trading session starts
 */
export function useSessionIndices(candles: Candle[], timeZone: string): number[] {
  return useMemo(() => {
    return getSessionBoundaryIndices(candles, timeZone);
  }, [candles, timeZone]);
}
