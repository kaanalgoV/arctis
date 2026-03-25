/**
 * volume-profile-adapter.ts
 *
 * Converts Arctis analysis data + raw bars into DayVolumeProfile[] for the
 * SciChart CandlestickChart. The DailyVolumeProfile from the backend only
 * carries summary data (poc/vah/val/total_volume).  We rebuild per-day bins
 * by distributing each bar's volume into price buckets derived from that
 * bar's high/low range.
 */

import type { Bar } from '@/types/contracts'
import type { DailyVolumeProfile } from '@/types/analysis'
import type { DayVolumeProfile } from '@/components/charts/CandlestickChart'

// Number of price bins per day — higher = finer resolution
// NQ has ~50-150pt daily range, so 60 bins ≈ 1-2.5pt per bin
const DEFAULT_BIN_COUNT = 60

/**
 * Parse an ISO date string ("2026-03-20") from a Unix timestamp (seconds).
 * Returns "YYYY-MM-DD" in UTC so it matches the backend date strings.
 */
function tsToDateStr(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Build a DayVolumeProfile for a single day.
 *
 * Algorithm:
 *   1. Find the overall price range (min low … max high) across all day bars.
 *   2. Divide that range into `binCount` equal-width buckets.
 *   3. For each bar, distribute its volume proportionally across all bins
 *      that overlap [bar.low, bar.high].
 *   4. Treat volume proportionally split into buyVolume (close > open) and
 *      sellVolume (open >= close) per bar.
 *   5. Normalise each bin's totalVolume relative to the day's maximum bin.
 *   6. Override poc/vah/val with backend values when available (they are
 *      more accurate since the backend uses tick-level data).
 */
function buildDayProfile(
  dayBars: Bar[],
  startIndex: number,
  endIndex: number,
  summary: DailyVolumeProfile | undefined,
  binCount: number,
): DayVolumeProfile | null {
  if (dayBars.length === 0) return null

  // Price range for this day
  let rangeMin = Infinity
  let rangeMax = -Infinity
  for (const b of dayBars) {
    if (b.low  < rangeMin) rangeMin = b.low
    if (b.high > rangeMax) rangeMax = b.high
  }

  const priceRange = rangeMax - rangeMin
  if (priceRange <= 0) return null

  const binWidth = priceRange / binCount

  // Initialise bins
  const totalVolBins   = new Float64Array(binCount)
  const buyVolBins     = new Float64Array(binCount)

  for (const bar of dayBars) {
    const barRange  = bar.high - bar.low
    const isBuy     = bar.close > bar.open
    const vol       = bar.volume

    for (let i = 0; i < binCount; i++) {
      const binLow  = rangeMin + i * binWidth
      const binHigh = binLow + binWidth

      // Overlap between [bar.low, bar.high] and [binLow, binHigh]
      const overlapLow  = Math.max(bar.low,  binLow)
      const overlapHigh = Math.min(bar.high, binHigh)

      if (overlapHigh <= overlapLow) continue

      // Proportion of bar's range that falls in this bin
      const fraction = barRange > 0 ? (overlapHigh - overlapLow) / barRange : 1 / binCount
      const binVol   = vol * fraction

      totalVolBins[i] += binVol
      if (isBuy) buyVolBins[i] += binVol
    }
  }

  // Find max for normalisation
  let maxVol = 0
  for (let i = 0; i < binCount; i++) {
    if (totalVolBins[i] > maxVol) maxVol = totalVolBins[i]
  }

  const bins = Array.from({ length: binCount }, (_, i) => {
    const priceLow   = rangeMin + i * binWidth
    const priceHigh  = priceLow + binWidth
    const totalVolume = totalVolBins[i]
    const buyVolume   = buyVolBins[i]
    const sellVolume  = totalVolume - buyVolume
    const normalized  = maxVol > 0 ? totalVolume / maxVol : 0

    return { priceLow, priceHigh, totalVolume, buyVolume, sellVolume, normalized }
  })

  // Derive local poc/vah/val from bins if no backend summary is available
  let poc: number
  let vah: number
  let val: number

  if (summary) {
    poc = summary.poc
    vah = summary.vah
    val = summary.val
  } else {
    // POC: bin with highest volume
    let pocIdx = 0
    for (let i = 1; i < binCount; i++) {
      if (totalVolBins[i] > totalVolBins[pocIdx]) pocIdx = i
    }
    poc = rangeMin + (pocIdx + 0.5) * binWidth

    // Value Area: 70 % of total volume centred around POC
    const totalVol    = totalVolBins.reduce((acc, v) => acc + v, 0)
    const vaTarget    = totalVol * 0.7
    let   vaVol       = totalVolBins[pocIdx]
    let   vaLowIdx    = pocIdx
    let   vaHighIdx   = pocIdx

    while (vaVol < vaTarget) {
      const expandDown = vaLowIdx  > 0           ? totalVolBins[vaLowIdx  - 1] : -1
      const expandUp   = vaHighIdx < binCount - 1 ? totalVolBins[vaHighIdx + 1] : -1

      if (expandDown < 0 && expandUp < 0) break

      if (expandDown >= expandUp) {
        vaLowIdx--
        vaVol += totalVolBins[vaLowIdx]
      } else {
        vaHighIdx++
        vaVol += totalVolBins[vaHighIdx]
      }
    }

    val = rangeMin + vaLowIdx  * binWidth
    vah = rangeMin + (vaHighIdx + 1) * binWidth
  }

  return { startIndex, endIndex, bins, poc, vah, val }
}

/**
 * Convert Arctis bars + optional daily summary data into DayVolumeProfile[].
 *
 * @param bars            Raw OHLCV bars (must be sorted ascending by timestamp)
 * @param dailyProfiles   Optional per-day summary from analysis API
 * @param binCount        Number of price bins per day (default: 24)
 */
export function buildDayVolumeProfiles(
  bars: Bar[],
  dailyProfiles?: DailyVolumeProfile[] | null,
  binCount = DEFAULT_BIN_COUNT,
): DayVolumeProfile[] {
  if (bars.length === 0) return []

  // Build a lookup map: date string -> DailyVolumeProfile summary
  const summaryMap = new Map<string, DailyVolumeProfile>()
  if (dailyProfiles) {
    for (const dp of dailyProfiles) {
      summaryMap.set(dp.date, dp)
    }
  }

  // Group bar indices by day
  const dayGroups = new Map<string, { indices: number[] }>()

  for (let i = 0; i < bars.length; i++) {
    const dateStr = tsToDateStr(bars[i].timestamp)
    let group = dayGroups.get(dateStr)
    if (!group) {
      group = { indices: [] }
      dayGroups.set(dateStr, group)
    }
    group.indices.push(i)
  }

  const result: DayVolumeProfile[] = []

  for (const [dateStr, group] of dayGroups) {
    const { indices } = group
    if (indices.length === 0) continue

    const startIndex = indices[0]
    const endIndex   = indices[indices.length - 1]
    const dayBars    = indices.map((i) => bars[i])
    const summary    = summaryMap.get(dateStr)

    const profile = buildDayProfile(dayBars, startIndex, endIndex, summary, binCount)
    if (profile) result.push(profile)
  }

  // Sort ascending by startIndex (same order as bars)
  result.sort((a, b) => a.startIndex - b.startIndex)

  return result
}
