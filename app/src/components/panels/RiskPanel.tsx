import { cn } from '@/lib/utils'

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
  config?: TradingConfig
}

const DEFAULTS = {
  maxTrades: 10,
  riskAmount: 500,
  limitPercent: 2,
}

export function RiskPanel({ trades = 0, contracts = 2, config }: RiskPanelProps) {
  const maxTrades = config?.max_daily_trades ?? DEFAULTS.maxTrades
  const riskAmount = config
    ? config.account_size * (config.risk_percent / 100)
    : DEFAULTS.riskAmount
  const limitPercent = config ? config.risk_percent : DEFAULTS.limitPercent

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
