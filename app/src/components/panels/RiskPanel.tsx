import { ShieldAlert, Layers, TrendingDown, Percent } from 'lucide-react'
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
  max_contracts?: number
  risk_per_trade?: number
}

interface RiskPanelProps {
  /** Number of trades taken today — pass undefined if not tracked. */
  trades?: number
  /** Current open contracts — pass undefined if not tracked. */
  contracts?: number
  config?: TradingConfig | null
  /** Whether data is currently being fetched. */
  loading?: boolean
  /** Error message when the last fetch failed. */
  error?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/** Returns a warning level based on how close `current` is to `limit`. */
function warningLevel(
  current: number | undefined,
  limit: number,
): 'ok' | 'warn' | 'danger' {
  if (current == null) return 'ok'
  const ratio = current / limit
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.75) return 'warn'
  return 'ok'
}

const WARNING_COLORS = {
  ok:     undefined,           // use default
  warn:   'var(--color-warning, #F7941D)',
  danger: 'var(--color-loss, #F87171)',
} as const

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RiskSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-md p-2.5 flex flex-col gap-1.5"
        >
          <Skeleton className="h-2 w-2.5" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-2 w-10" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

interface RiskCardProps {
  icon: React.ReactNode
  label: string
  value: string
  /** Override text color (e.g. for warning state). */
  valueColor?: string
  /** Show a warning indicator pill */
  warningState?: 'warn' | 'danger'
}

function RiskCard({ icon, label, value, valueColor, warningState }: RiskCardProps) {
  const borderColor =
    warningState === 'danger'
      ? 'border-[var(--color-loss)]/40'
      : warningState === 'warn'
      ? 'border-[var(--color-warning)]/40'
      : 'border-[var(--color-border)]'

  return (
    <div
      className={`bg-[var(--color-surface-secondary)] border ${borderColor} rounded-md p-2.5 flex flex-col gap-1 hover:border-[var(--color-border)] transition-colors`}
    >
      {/* Icon row */}
      <div className="flex items-center justify-between">
        <span className="text-[var(--color-text-inactive)]">{icon}</span>
        {warningState && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: warningState === 'danger' ? 'var(--color-loss, #F87171)' : 'var(--color-warning, #F7941D)',
            }}
            aria-label={warningState === 'danger' ? 'Limit reached' : 'Approaching limit'}
          />
        )}
      </div>

      {/* Value */}
      <div
        className="font-mono text-[14px] font-semibold tabular-nums leading-none"
        style={{ color: valueColor ?? '#E6EDF3' }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="font-sans text-[9px] text-[var(--color-text-inactive)] uppercase tracking-wider leading-none">
        {label}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskPanel({ trades, contracts, config, loading, error }: RiskPanelProps) {
  // Loading state
  if (loading && config == null) {
    return <RiskSkeleton />
  }

  // Error state
  if (error && config == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-loss,#F87171)]">{error}</span>
      </div>
    )
  }

  // No config yet
  if (config == null) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-[10px] text-[var(--color-text-inactive)]">Waiting for data...</span>
      </div>
    )
  }

  // Derived values
  const maxLoss   = config.daily_loss_limit > 0
    ? fmt$(config.daily_loss_limit)
    : config.account_size > 0
      ? fmt$(config.account_size * (config.risk_percent / 100))
      : '—'

  const posLimit  = config.max_contracts != null
    ? String(config.max_contracts)
    : config.max_daily_trades > 0
      ? String(config.max_daily_trades)
      : '—'

  const dailyLossLimitValue = config.daily_loss_limit > 0
    ? fmt$(config.daily_loss_limit)
    : '—'

  const riskPerTrade = config.risk_per_trade != null
    ? fmt$(config.risk_per_trade)
    : config.account_size > 0 && config.risk_percent > 0
      ? fmt$(config.account_size * (config.risk_percent / 100))
      : '—'

  // Warning state: only relevant if `contracts` data is actually passed
  const contractsWarn = warningLevel(
    contracts,
    config.max_contracts ?? config.max_daily_trades,
  )
  const contractColor =
    contractsWarn !== 'ok' ? WARNING_COLORS[contractsWarn] : undefined

  // Trades warning
  const tradesWarn  = warningLevel(trades, config.max_daily_trades)
  const tradesColor =
    tradesWarn !== 'ok' ? WARNING_COLORS[tradesWarn] : 'var(--color-text-primary)'

  // Display values — show "—" for unavailable live data
  const tradesDisplay   = trades    != null ? String(trades)    : '—'
  const contractsDisplay = contracts != null ? String(contracts) : '—'

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {/* Max Loss */}
      <RiskCard
        icon={<ShieldAlert size={10} strokeWidth={2} />}
        label="Max Loss"
        value={maxLoss}
        valueColor="var(--color-loss, #F87171)"
      />

      {/* Daily Loss Limit — previously hidden, now shown */}
      <RiskCard
        icon={<TrendingDown size={10} strokeWidth={2} />}
        label="Daily Limit"
        value={dailyLossLimitValue}
        valueColor="var(--color-loss, #F87171)"
      />

      {/* Position / Contract Limit */}
      <RiskCard
        icon={<Layers size={10} strokeWidth={2} />}
        label="Pos. Limit"
        value={posLimit}
      />

      {/* Risk per Trade */}
      <RiskCard
        icon={<Percent size={10} strokeWidth={2} />}
        label="Risk / Trade"
        value={riskPerTrade}
      />

      {/* Trades today — only render row if trades prop is passed */}
      {trades != null && (
        <RiskCard
          icon={<ShieldAlert size={10} strokeWidth={2} />}
          label={`Trades (/${config.max_daily_trades})`}
          value={tradesDisplay}
          valueColor={tradesColor}
          warningState={tradesWarn !== 'ok' ? tradesWarn : undefined}
        />
      )}

      {/* Open contracts — only render if prop is passed */}
      {contracts != null && (
        <RiskCard
          icon={<Layers size={10} strokeWidth={2} />}
          label="Open Contracts"
          value={contractsDisplay}
          valueColor={contractColor}
          warningState={contractsWarn !== 'ok' ? contractsWarn : undefined}
        />
      )}
    </div>
  )
}
