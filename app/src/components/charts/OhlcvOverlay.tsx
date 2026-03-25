/**
 * OhlcvOverlay — compact one-line OHLCV display in the top-left of the chart.
 *
 * Shows O / H / L / C / V values for the currently hovered candle (via crosshair).
 * Falls back to the latest candle when no candle is hovered.
 */

interface OhlcvData {
  open: number
  high: number
  low: number
  close: number
  volume: number
  time: number
}

interface OhlcvOverlayProps {
  /** Hovered candle data from crosshair; null = show latest candle */
  data: OhlcvData | null
  /** Ticker symbol shown as prefix */
  symbol: string
}

function fmt(n: number): string {
  // NQ futures: show 2 decimal places
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface FieldProps {
  label: string
  value: string
  valueStyle?: React.CSSProperties
}

function Field({ label, value, valueStyle }: FieldProps) {
  return (
    <span className="flex items-center gap-[2px]">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </span>
  )
}

const DIVIDER = (
  <span
    style={{
      display: 'inline-block',
      width: 1,
      height: 10,
      background: 'var(--color-text-muted)',
      opacity: 0.25,
      margin: '0 4px',
      verticalAlign: 'middle',
    }}
  />
)

export function OhlcvOverlay({ data, symbol }: OhlcvOverlayProps) {
  if (!data) return null

  const isBullish = data.close >= data.open
  const closeColor = isBullish ? '#5CB8F0' : '#EF4136'

  return (
    <div
      className="absolute left-3 top-2 z-10 flex items-center gap-1 font-mono text-[10px] rounded px-[6px] py-[3px] select-none pointer-events-none"
      style={{
        background: 'color-mix(in srgb, var(--color-surface-base) 80%, transparent)',
        backdropFilter: 'blur(4px)',
        lineHeight: 1,
      }}
    >
      {/* Symbol */}
      <span
        className="font-semibold mr-[2px]"
        style={{ color: 'var(--color-text-muted)', opacity: 0.7, letterSpacing: '0.04em' }}
      >
        {symbol}
      </span>

      {DIVIDER}

      <Field label="O" value={fmt(data.open)} valueStyle={{ color: 'var(--color-text-base)' }} />
      {DIVIDER}
      <Field label="H" value={fmt(data.high)} valueStyle={{ color: 'var(--color-text-base)' }} />
      {DIVIDER}
      <Field label="L" value={fmt(data.low)} valueStyle={{ color: 'var(--color-text-base)' }} />
      {DIVIDER}
      <Field label="C" value={fmt(data.close)} valueStyle={{ color: closeColor, fontWeight: 600 }} />
      {DIVIDER}
      <Field label="V" value={fmtVol(data.volume)} valueStyle={{ color: 'var(--color-text-muted)' }} />
    </div>
  )
}
