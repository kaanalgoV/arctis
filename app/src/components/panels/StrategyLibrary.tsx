/**
 * StrategyLibrary — interactive panel showing all trading strategies with real backtest metrics.
 * Users can toggle strategies ON/OFF to control which signals appear on the chart.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '@/lib/config'
import { Skeleton } from '@/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Strategy {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
  is_implemented: boolean
  total_trades: number
  total_wins: number
  win_rate: number | null
  profit_factor: number | null
  avg_win: number | null
  avg_loss: number | null
  best_pf: number | null
  profitable_runs: number
  total_runs: number
  profitable: boolean
}

interface StrategiesAPIResponse {
  strategies: Strategy[]
}

type FilterTab = 'all' | 'profitable' | 'active'

// ---------------------------------------------------------------------------
// Default active strategies — top 3 performers by profit factor
// ---------------------------------------------------------------------------

const DEFAULT_ACTIVE: Set<string> = new Set([
  'mbo_confluence_nq',
  'daily_breakout',
  'travis_double_fake_nq',
])

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function pfColor(pf: number | null): string {
  if (pf == null) return 'var(--color-text-muted, #484F58)'
  if (pf >= 1.5) return 'var(--color-profit, #22C55E)'
  if (pf >= 1.0) return '#F59E0B'
  return 'var(--color-loss, #EF4444)'
}

function wrColor(wr: number | null): string {
  if (wr == null) return 'var(--color-text-muted, #484F58)'
  if (wr >= 50) return 'var(--color-profit, #22C55E)'
  if (wr >= 40) return '#F59E0B'
  return 'var(--color-loss, #EF4444)'
}

function borderColor(strategy: Strategy): string {
  if (strategy.total_trades === 0) return 'transparent'
  if (strategy.profitable) return 'var(--color-profit, #22C55E)'
  return 'var(--color-loss, #EF4444)'
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
  strategyId: string
}

function ToggleSwitch({ checked, disabled, onChange, strategyId }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle strategy ${strategyId}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className="relative flex-shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
      style={{
        width: 28,
        height: 16,
        borderRadius: 8,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled
          ? 'var(--color-surface-tertiary, #21262D)'
          : checked
            ? 'var(--color-accent, #5CB8F0)'
            : 'var(--color-surface-tertiary, #21262D)',
        transition: 'background-color 150ms ease',
        padding: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <motion.span
        layout
        style={{
          position: 'absolute',
          top: 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#fff',
        }}
        animate={{ left: checked ? 14 : 2 }}
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Filter tabs skeleton */}
      <div className="flex gap-1 mb-1">
        {[60, 70, 55].map((w, i) => (
          <Skeleton key={i} className="h-5 rounded-full" style={{ width: w }} />
        ))}
      </div>
      {/* Card skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md px-2 py-2"
          style={{
            backgroundColor: 'var(--color-surface-secondary, #161B22)',
            border: '1px solid var(--color-border-subtle, #21262D)',
            borderLeft: '2px solid var(--color-border-subtle, #21262D)',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Skeleton className="h-4 w-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-10 ml-auto flex-shrink-0" />
          </div>
          <Skeleton className="h-2 w-40 mb-2" />
          <div className="flex gap-2 mb-1.5">
            {[36, 40, 28, 32].map((w, j) => (
              <Skeleton key={j} className="h-4 rounded" style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Strategy Card
// ---------------------------------------------------------------------------

interface StrategyCardProps {
  strategy: Strategy
  isActive: boolean
  onToggle: (id: string, active: boolean) => void
}

function StrategyCard({ strategy, isActive, onToggle }: StrategyCardProps) {
  const hasData = strategy.total_trades > 0
  const pf = strategy.profit_factor
  const wr = strategy.win_rate

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="rounded-md px-2 py-2 transition-colors"
      style={{
        backgroundColor: isActive
          ? 'var(--color-surface-secondary, #161B22)'
          : 'var(--color-surface-primary, #0D1117)',
        border: '1px solid var(--color-border-subtle, #21262D)',
        borderLeft: `2px solid ${borderColor(strategy)}`,
      }}
    >
      {/* Row 1: toggle + name + PF badge */}
      <div className="flex items-center gap-2 min-w-0">
        <ToggleSwitch
          strategyId={strategy.id}
          checked={isActive}
          disabled={!hasData}
          onChange={(v) => onToggle(strategy.id, v)}
        />

        <span
          className="text-[11px] font-semibold truncate flex-1 min-w-0"
          style={{
            color: isActive
              ? 'var(--color-text-primary, #E6EDF3)'
              : 'var(--color-text-secondary, #8B949E)',
            fontFamily: 'var(--font-display, inherit)',
          }}
          title={strategy.name}
        >
          {strategy.name}
        </span>

        {pf != null && (
          <span
            className="font-mono text-[9px] font-bold flex-shrink-0"
            style={{ color: pfColor(pf) }}
          >
            {pf.toFixed(2)}x
          </span>
        )}
      </div>

      {/* Row 2: description */}
      {strategy.description && (
        <div
          className="text-[9px] mt-1 truncate"
          style={{
            color: 'var(--color-text-muted, #484F58)',
            paddingLeft: 36,
          }}
        >
          {strategy.description}
        </div>
      )}

      {/* Row 3: stats chips */}
      {hasData ? (
        <>
          <div
            className="flex items-center gap-1 mt-1.5 flex-wrap"
            style={{ paddingLeft: 36 }}
          >
            {/* Win Rate */}
            <StatChip label="WR" value={wr != null ? `${wr.toFixed(1)}%` : '--'} color={wrColor(wr)} />

            {/* Profit Factor */}
            <StatChip label="PF" value={pf != null ? `${pf.toFixed(2)}x` : '--'} color={pfColor(pf)} />

            {/* Sample size */}
            <StatChip
              label="n"
              value={strategy.total_trades >= 1000
                ? `${(strategy.total_trades / 1000).toFixed(1)}k`
                : String(strategy.total_trades)
              }
              color="var(--color-text-secondary, #8B949E)"
            />

            {/* Profitable runs */}
            <StatChip
              label="R"
              value={`${strategy.profitable_runs}/${strategy.total_runs}`}
              color="var(--color-text-muted, #484F58)"
            />
          </div>

          {/* Win rate bar */}
          {wr != null && (
            <div
              className="mt-1.5 rounded-full overflow-hidden"
              style={{
                height: 3,
                backgroundColor: 'var(--color-surface-tertiary, #21262D)',
                marginLeft: 36,
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(wr, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  backgroundColor: wrColor(wr),
                  borderRadius: '999px',
                }}
              />
            </div>
          )}
        </>
      ) : (
        <div
          className="text-[9px] mt-1.5 italic"
          style={{ color: 'var(--color-text-muted, #484F58)', paddingLeft: 36 }}
        >
          No backtest data
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Stat chip helper
// ---------------------------------------------------------------------------

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-0.5 px-1 py-0.5 rounded"
      style={{ backgroundColor: 'var(--color-surface-tertiary, #21262D)' }}
    >
      <span className="text-[7px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted, #484F58)' }}>
        {label}
      </span>
      <span className="font-mono text-[9px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter Tab
// ---------------------------------------------------------------------------

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
      style={{
        backgroundColor: active ? 'var(--color-accent-muted, rgba(92,184,240,0.12))' : 'var(--color-surface-tertiary, #21262D)',
        color: active ? 'var(--color-accent, #5CB8F0)' : 'var(--color-text-muted, #484F58)',
        border: active ? '1px solid rgba(92,184,240,0.3)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Bottom Summary Bar
// ---------------------------------------------------------------------------

interface SummaryBarProps {
  strategies: Strategy[]
  activeIds: Set<string>
}

function SummaryBar({ strategies, activeIds }: SummaryBarProps) {
  const activeList = strategies.filter((s) => activeIds.has(s.id) && s.total_trades > 0)

  if (activeList.length === 0) {
    return (
      <div
        className="px-3 py-2 border-t"
        style={{ borderColor: 'var(--color-border-subtle, #21262D)' }}
      >
        <span className="text-[9px]" style={{ color: 'var(--color-text-muted, #484F58)' }}>
          No active strategies with data
        </span>
      </div>
    )
  }

  const totalTrades = activeList.reduce((s, x) => s + x.total_trades, 0)
  const totalWins = activeList.reduce((s, x) => s + x.total_wins, 0)
  const combinedWR = totalTrades > 0 ? ((totalWins / totalTrades) * 100) : null
  const avgPF = activeList.filter((x) => x.profit_factor != null).reduce((s, x) => s + (x.profit_factor ?? 0), 0)
  const countWithPF = activeList.filter((x) => x.profit_factor != null).length
  const combinedPF = countWithPF > 0 ? avgPF / countWithPF : null

  return (
    <div
      className="px-3 py-2 border-t flex flex-col gap-0.5"
      style={{ borderColor: 'var(--color-border-subtle, #21262D)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px]" style={{ color: 'var(--color-text-muted, #484F58)' }}>
          {activeList.length} of {strategies.length} active
        </span>
        {combinedPF != null && (
          <span className="font-mono text-[9px] font-semibold" style={{ color: pfColor(combinedPF) }}>
            PF {combinedPF.toFixed(2)}x
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-secondary, #8B949E)' }}>
          {totalTrades.toLocaleString()} trades
        </span>
        {combinedWR != null && (
          <span className="font-mono text-[8px]" style={{ color: wrColor(combinedWR) }}>
            {combinedWR.toFixed(1)}% WR
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface StrategyLibraryProps {
  /** Called when the number of toggled-on strategies changes (for parent badge). */
  onActiveCountChange?: (count: number) => void
}

export function StrategyLibrary({ onActiveCountChange }: StrategyLibraryProps = {}) {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIds, setActiveIds] = useState<Set<string>>(DEFAULT_ACTIVE)
  const [filter, setFilter] = useState<FilterTab>('all')

  // Fetch from API
  const fetchStrategies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${config.apiBase}/api/strategies`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = (await resp.json()) as StrategiesAPIResponse
      setStrategies(Array.isArray(data?.strategies) ? data.strategies : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load strategies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStrategies()
  }, [fetchStrategies])

  // Notify parent of active count changes
  useEffect(() => {
    onActiveCountChange?.(activeIds.size)
  }, [activeIds, onActiveCountChange])

  // Toggle handler
  const handleToggle = useCallback((id: string, active: boolean) => {
    setActiveIds((prev) => {
      const next = new Set(prev)
      if (active) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  // Filtered + sorted list
  const displayStrategies = useMemo(() => {
    let list = [...strategies]

    if (filter === 'profitable') {
      list = list.filter((s) => s.profitable && s.total_trades > 0)
    } else if (filter === 'active') {
      list = list.filter((s) => activeIds.has(s.id))
    }

    // Sort: profitable first, then by total_trades desc, then name
    list.sort((a, b) => {
      if (a.profitable !== b.profitable) return a.profitable ? -1 : 1
      if (b.total_trades !== a.total_trades) return b.total_trades - a.total_trades
      return a.name.localeCompare(b.name)
    })

    return list
  }, [strategies, filter, activeIds])

  const activeCount = strategies.filter((s) => activeIds.has(s.id)).length

  // Loading state
  if (loading) return <LibrarySkeleton />

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 px-3">
        <span className="text-[10px]" style={{ color: 'var(--color-loss, #EF4444)' }}>
          Strategy data unavailable
        </span>
        <span className="text-[9px] text-center" style={{ color: 'var(--color-text-muted, #484F58)' }}>
          {error}
        </span>
        <button
          onClick={() => void fetchStrategies()}
          className="px-3 py-1 rounded text-[9px] font-mono transition-colors"
          style={{
            backgroundColor: 'var(--color-surface-tertiary, #21262D)',
            color: 'var(--color-accent, #5CB8F0)',
            border: '1px solid rgba(92,184,240,0.2)',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ fontSize: 0 }}>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-2 pt-1.5 pb-2">
        {(['all', 'profitable', 'active'] as FilterTab[]).map((tab) => (
          <FilterTab
            key={tab}
            label={tab === 'active' ? `Active (${activeCount})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            active={filter === tab}
            onClick={() => setFilter(tab)}
          />
        ))}
      </div>

      {/* Strategy cards */}
      <div className="flex flex-col gap-1.5 px-2 overflow-y-auto" style={{ maxHeight: 480 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {displayStrategies.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-6"
            >
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted, #484F58)' }}>
                {filter === 'active' ? 'No strategies toggled on' : 'No strategies found'}
              </span>
            </motion.div>
          ) : (
            displayStrategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                isActive={activeIds.has(s.id)}
                onToggle={handleToggle}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Summary bar */}
      <SummaryBar strategies={strategies} activeIds={activeIds} />
    </div>
  )
}
