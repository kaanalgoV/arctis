// Ported from AlgoView CandlestickChart
/**
 * Hook for efficient timestamp-to-index lookups.
 * Creates a Map for O(1) lookups instead of O(n) linear search.
 */

import { useMemo } from 'react';
import type { Candle } from '@/types/domain';

export interface TimestampIndex {
  /** Map from timestamp to candle index */
  timestampToIndex: Map<number, number>;
  /** Find candle index for a timestamp, returns -1 if not found */
  findCandleIndex: (timestamp: number) => number;
}

/**
 * Creates an efficient timestamp lookup structure from candles.
 *
 * @param candles - Array of candles with timestamps
 * @returns TimestampIndex with Map and lookup function
 */
export function useTimestampIndex(candles: Candle[]): TimestampIndex {
  return useMemo(() => {
    const timestampToIndex = new Map<number, number>();

    for (let i = 0; i < candles.length; i++) {
      timestampToIndex.set(candles[i].time, i);
    }

    const findCandleIndex = (timestamp: number): number => {
      return timestampToIndex.get(timestamp) ?? -1;
    };

    return { timestampToIndex, findCandleIndex };
  }, [candles]);
}
