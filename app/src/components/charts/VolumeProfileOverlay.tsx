import { useMemo } from 'react'

interface VPBin {
  price: number
  volume: number
}

interface VolumeProfileOverlayProps {
  bins: VPBin[]
  poc: number
  vah: number
  val: number
  /** Pixel height of the chart container. */
  chartHeight: number
  /** Highest visible price (top of chart). */
  priceHigh: number
  /** Lowest visible price (bottom of chart). */
  priceLow: number
  visible?: boolean
}

/**
 * Sidebar Volume Profile histogram rendered as an absolutely-positioned
 * div overlay on the right side of the chart canvas.
 *
 * - Width: 120px, offset 60px from right (avoids the LWC price axis)
 * - POC bin: ice blue (#5AAED8), opacity 0.6, left border accent
 * - Value Area bins: ice-blue tint (rgba(90,174,216,0.15))
 * - Other bins: neutral (rgba(139,148,158,0.15))
 * - Labels: POC / VAH / VAL in 9px font-mono
 */
export function VolumeProfileOverlay({
  bins,
  poc,
  vah,
  val,
  chartHeight,
  priceHigh,
  priceLow,
  visible = true,
}: VolumeProfileOverlayProps) {
  const priceRange = priceHigh - priceLow

  const maxVol = useMemo(
    () => (bins.length > 0 ? bins.reduce((max, b) => Math.max(max, b.volume), -Infinity) : 1),
    [bins],
  )

  if (!visible || bins.length === 0 || priceRange <= 0 || chartHeight <= 0) {
    return null
  }

  const priceToY = (price: number): number =>
    ((priceHigh - price) / priceRange) * chartHeight

  const binHeight = Math.max(1, chartHeight / bins.length)

  return (
    <div
      className="absolute top-0 pointer-events-none overflow-hidden"
      style={{ right: 60, width: 120, height: chartHeight }}
    >
      {/* Histogram bars */}
      {bins.map((bin, i) => {
        const y = priceToY(bin.price)
        const widthPct = maxVol > 0 ? (bin.volume / maxVol) * 100 : 0
        // Compare bin midpoint to poc for reliable POC detection
        const binMid = bin.price + binHeight / 2
        const isPOCBin = Math.abs(binMid - poc) < binHeight * 1.5
        const isVA = bin.price <= vah && bin.price >= val

        return (
          <div
            key={i}
            className="absolute right-0"
            style={{
              top: Math.round(y),
              height: Math.max(Math.round(binHeight), 1),
              width: '100%',
            }}
          >
            <div
              style={{
                width: `${widthPct}%`,
                height: '100%',
                marginLeft: 'auto',
                backgroundColor: isPOCBin
                  ? 'rgba(90, 174, 216, 0.6)'
                  : isVA
                    ? 'rgba(90, 174, 216, 0.15)'
                    : 'rgba(139, 148, 158, 0.15)',
                borderLeft: isPOCBin ? '2px solid #5AAED8' : undefined,
              }}
            />
          </div>
        )
      })}

      {/* POC label */}
      <div
        className="absolute left-0 text-[9px] font-mono leading-none select-none"
        style={{
          top: priceToY(poc),
          color: '#5AAED8',
          transform: 'translateY(-50%)',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        POC
      </div>

      {/* VAH label */}
      <div
        className="absolute left-0 text-[9px] font-mono leading-none select-none"
        style={{
          top: priceToY(vah),
          color: '#5AAED8',
          transform: 'translateY(-50%)',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        VAH
      </div>

      {/* VAL label */}
      <div
        className="absolute left-0 text-[9px] font-mono leading-none select-none"
        style={{
          top: priceToY(val),
          color: '#5AAED8',
          transform: 'translateY(-50%)',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        VAL
      </div>

      {/* VAH dashed line */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: priceToY(vah),
          height: 1,
          borderTop: '1px dashed rgba(90, 174, 216, 0.4)',
        }}
      />

      {/* VAL dashed line */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: priceToY(val),
          height: 1,
          borderTop: '1px dashed rgba(90, 174, 216, 0.4)',
        }}
      />
    </div>
  )
}
