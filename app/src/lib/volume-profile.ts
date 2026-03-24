import type { OHLCVBar } from '../types/market'

interface VPBin {
  price: number
  volume: number
}

export interface VPResult {
  bins: VPBin[]
  poc: number
  vah: number
  val: number
}

/**
 * Calculates a Volume Profile from OHLCV bars.
 * Distributes bar volume across price bins proportionally by overlap.
 * Value Area = 70% of total volume, expanded from POC outward.
 *
 * @param bars - OHLCV bars to analyze
 * @param binSize - Price step per bin (default 2.0 ticks)
 */
export function calculateVolumeProfile(bars: OHLCVBar[], binSize = 2.0): VPResult {
  if (!bars.length) return { bins: [], poc: 0, vah: 0, val: 0 }

  const priceMin = bars.reduce((min, b) => Math.min(min, b.low), Infinity)
  const priceMax = bars.reduce((max, b) => Math.max(max, b.high), -Infinity)

  // Build bin map: key = lower edge of bin
  const binMap = new Map<number, number>()
  for (
    let p = Math.floor(priceMin / binSize) * binSize;
    p <= priceMax + binSize;
    p = Math.round((p + binSize) * 1e6) / 1e6
  ) {
    binMap.set(p, 0)
  }

  // Distribute each bar's volume proportionally across overlapping bins
  for (const bar of bars) {
    const barRange = bar.high - bar.low || binSize
    for (const [binPrice] of binMap) {
      const binHigh = binPrice + binSize
      const overlapLow = Math.max(bar.low, binPrice)
      const overlapHigh = Math.min(bar.high, binHigh)
      const overlap = overlapHigh - overlapLow
      if (overlap > 0) {
        binMap.set(
          binPrice,
          (binMap.get(binPrice) ?? 0) + bar.volume * (overlap / barRange),
        )
      }
    }
  }

  // Convert to sorted array (high price first for top-down rendering)
  const bins: VPBin[] = Array.from(binMap.entries())
    .map(([price, volume]) => ({ price, volume }))
    .sort((a, b) => b.price - a.price)

  if (!bins.length) return { bins: [], poc: 0, vah: 0, val: 0 }

  // POC = bin with the highest volume
  const pocBin = bins.reduce((max, b) => (b.volume > max.volume ? b : max), bins[0])
  const pocLowerEdge = pocBin.price

  // Value Area: expand from POC until 70% of total volume is covered
  const totalVol = bins.reduce((s, b) => s + b.volume, 0)
  const targetVol = totalVol * 0.7

  let vaVol = pocBin.volume
  let vaHigh = pocLowerEdge
  let vaLow = pocLowerEdge

  const pocIdx = bins.findIndex((b) => b.price === pocLowerEdge)
  let hi = pocIdx - 1 // higher prices (lower index because array is descending)
  let lo = pocIdx + 1 // lower prices

  while (vaVol < targetVol && (hi >= 0 || lo < bins.length)) {
    const hiVol = hi >= 0 ? bins[hi].volume : 0
    const loVol = lo < bins.length ? bins[lo].volume : 0

    if (hiVol >= loVol && hi >= 0) {
      vaVol += hiVol
      vaHigh = bins[hi].price
      hi--
    } else if (lo < bins.length) {
      vaVol += loVol
      vaLow = bins[lo].price
      lo++
    } else {
      break
    }
  }

  return {
    bins,
    // Return midpoint of each key level bin
    poc: pocLowerEdge + binSize / 2,
    vah: vaHigh + binSize,
    val: vaLow,
  }
}
