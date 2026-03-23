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
    <div className="grid grid-cols-2 gap-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#161B22] border border-[#21262D] rounded-md p-2 flex flex-col items-center gap-1"
        >
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-2 w-8" />
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
        <span className="text-[10px] text-[#EF4444]">{error}</span>
      </div>
    )
  }

  // No config yet — show waiting state
  if (config == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[#8B949E]">Waiting for data...</span>
      </div>
    )
  }

  const maxTrades = config.max_daily_trades
  const riskAmount = config.account_size * (config.risk_percent / 100)
  const limitPercent = config.risk_percent

  const tradesExceeded = trades >= maxTrades

  return (
    <div className="grid grid-cols-2 gap-1">
      <RiskCell
        value={
          <>
            {trades}
            <span className="text-[10px] text-[#484F58]">/{maxTrades}</span>
          </>
        }
        label="Trades"
        color={tradesExceeded ? '#EF4444' : '#E6EDF3'}
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
    <div className="bg-[#161B22] border border-[#21262D] rounded-md p-2 text-center hover:border-[#30363D] transition-colors">
      <div
        className="font-mono text-[15px] font-bold tabular-nums"
        style={{ color: color ?? '#E6EDF3' }}
      >
        {value}
      </div>
      <div className="text-[9px] text-[#8B949E] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}
