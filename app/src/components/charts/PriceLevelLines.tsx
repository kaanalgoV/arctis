/**
 * PriceLevelLines — converts Arctis session_levels into CandlestickChart PriceLevel objects.
 *
 * Usage:
 *   const levels = buildPriceLevels(sessionLevels)
 *   <CandlestickChart priceLevels={levels} ... />
 */

import type { PriceLevel } from './CandlestickChart'

export interface SessionLevels {
  prev_high: number
  prev_low: number
  prev_close: number
  opening_range_high?: number
  opening_range_low?: number
}

// Arctic Frost palette
const AMBER = '#FBBF24'
const ICE_BLUE = '#5CB8F0'
const GRAY = '#6B7280'

/**
 * Converts Arctis session level data into PriceLevel objects for CandlestickChart.
 *
 * Levels rendered:
 *  - PDH  : Previous Day High  — dashed amber
 *  - PDL  : Previous Day Low   — dashed amber
 *  - PDC  : Previous Day Close — dotted gray
 *  - ORH  : Opening Range High — solid ice-blue (when available)
 *  - ORL  : Opening Range Low  — solid ice-blue (when available)
 */
export function buildPriceLevels(sessionLevels: SessionLevels | null): PriceLevel[] {
  if (!sessionLevels) return []

  const levels: PriceLevel[] = []

  // Previous Day High — dashed amber, 1.5px
  if (sessionLevels.prev_high > 0) {
    levels.push({
      price: sessionLevels.prev_high,
      color: AMBER,
      label: `PDH ${sessionLevels.prev_high.toFixed(2)}`,
      dash: [6, 4],
      thickness: 1.5,
    })
  }

  // Previous Day Low — dashed amber, 1.5px
  if (sessionLevels.prev_low > 0) {
    levels.push({
      price: sessionLevels.prev_low,
      color: AMBER,
      label: `PDL ${sessionLevels.prev_low.toFixed(2)}`,
      dash: [6, 4],
      thickness: 1.5,
    })
  }

  // Previous Day Close — dotted gray
  if (sessionLevels.prev_close > 0) {
    levels.push({
      price: sessionLevels.prev_close,
      color: GRAY,
      label: `PDC ${sessionLevels.prev_close.toFixed(2)}`,
      dash: [2, 4],
      thickness: 1,
    })
  }

  // Opening Range High — solid ice-blue
  if (sessionLevels.opening_range_high !== undefined && sessionLevels.opening_range_high > 0) {
    levels.push({
      price: sessionLevels.opening_range_high,
      color: ICE_BLUE,
      label: `ORH ${sessionLevels.opening_range_high.toFixed(2)}`,
      thickness: 1.5,
    })
  }

  // Opening Range Low — solid ice-blue
  if (sessionLevels.opening_range_low !== undefined && sessionLevels.opening_range_low > 0) {
    levels.push({
      price: sessionLevels.opening_range_low,
      color: ICE_BLUE,
      label: `ORL ${sessionLevels.opening_range_low.toFixed(2)}`,
      thickness: 1.5,
    })
  }

  return levels
}
