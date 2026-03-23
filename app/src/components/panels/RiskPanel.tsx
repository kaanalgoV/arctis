import { Skeleton } from '@/components/ui/Skeleton'

interface TradingConfig {
  account_size: number
  risk_percent: number
  daily_loss_limit: number
  max_daily_trades: number
  tick_value_es: number
  tick_size_es: number
  tick_value_nq: number
  tick_size_nq: number
}

interface RiskPanelProps {
  trades?: number
  contracts?: number
  config?: TradingConfig | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function RiskSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/[0.02] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-2.5 flex flex-col items-center gap-1"
        >
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-2 w-10" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RiskPanel({ trades = 0, contracts = 0, config, loading, error }: RiskPanelProps) {
  // Loading state
  if (loading && config == null) {
    return <RiskSkeleton />
  }

  // Error state
  if (error && config == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-loss)]">{error}</span>
      </div>
    )
  }

  // No config yet — show waiting state
  if (config == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-text-muted)]">Waiting for data...</span>
      </div>
    )
  }

  const maxTrades = config.max_daily_trades
  const riskAmount = config.account_size * (config.risk_percent / 100)
  const limitPercent = config.risk_percent

  const tradesExceeded = trades >= maxTrades

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <RiskCell
        value={
          <>
            {trades}
            <span className="text-[11px] text-[var(--color-text-muted)]">/{maxTrades}</span>
          </>
        }
        label="Trades"
        color={tradesExceeded ? 'var(--color-loss)' : 'var(--color-text-primary)'}
      />
      <RiskCell
        value={`$${riskAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        label="Risk"
      />
      <RiskCell value={`${limitPercent}%`} label="Limit" />
      <RiskCell value={String(contracts)} label="Contracts" />
    </div>
  )
}

function RiskCell({
  value,
  label,
  color,
}: {
  value: React.ReactNode
  label: string
  color?: string
}) {
  return (
    <div className="bg-white/[0.02] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-2.5 text-center hover:border-[var(--color-border)] transition-colors">
      <div
        className="font-mono text-[16px] font-bold tabular-nums"
        style={{ color: color || 'var(--color-text-primary)' }}
      >
        {value}
      </div>
      <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{label}</div>
    </div>
  )
}
