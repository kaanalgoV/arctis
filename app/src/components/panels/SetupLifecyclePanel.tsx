import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { SetupData, SetupStatus } from '@/hooks/useSetups'
import { isTerminalStatus } from '@/hooks/useSetups'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Status metadata ───────────────────────────────────────────────────────────

interface StatusMeta {
  label: string
  color: string
  bg: string
  border: string
}

const STATUS_META: Record<SetupStatus, StatusMeta> = {
  candidate: {
    label: 'CANDIDATE',
    color: 'var(--color-text-secondary)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
  },
  qualified: {
    label: 'QUALIFIED',
    color: 'var(--color-text-secondary)',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.18)',
  },
  armed: {
    label: 'ARMED',
    color: 'var(--color-warning)',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
  triggered: {
    label: 'TRIGGERED',
    color: 'var(--color-accent)',
    bg: 'rgba(92,184,240,0.08)',
    border: 'rgba(92,184,240,0.3)',
  },
  in_position: {
    label: 'IN POSITION',
    color: 'var(--color-accent)',
    bg: 'rgba(92,184,240,0.1)',
    border: 'rgba(92,184,240,0.4)',
  },
  partial_taken: {
    label: 'PARTIAL',
    color: 'var(--color-profit)',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.3)',
  },
  exited: {
    label: 'EXITED',
    color: 'var(--color-profit)',
    bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.2)',
  },
  // Legacy aliases
  partial_tp1: {
    label: 'PARTIAL TP1',
    color: 'var(--color-profit)',
    bg: 'rgba(0,135,87,0.08)',
    border: 'rgba(0,135,87,0.3)',
  },
  stopped: {
    label: 'STOPPED',
    color: 'var(--color-loss)',
    bg: 'rgba(239,65,54,0.06)',
    border: 'rgba(239,65,54,0.2)',
  },
  invalidated: {
    label: 'INVALIDATED',
    color: 'var(--color-text-muted)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
  },
  expired: {
    label: 'EXPIRED',
    color: 'var(--color-text-muted)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
  },
  completed: {
    label: 'COMPLETED',
    color: 'var(--color-profit)',
    bg: 'rgba(0,135,87,0.06)',
    border: 'rgba(0,135,87,0.2)',
  },
}

const SETUP_TYPE_LABELS: Record<string, string> = {
  orb_break: 'ORB Break',
  ib_break: 'IB Break',
  poc_rejection: 'POC Reject',
  va_edge: 'VA Edge',
  bos: 'BOS / NPOC',
  sammelzone_breakout: 'Sammelzone',
  absorption: 'Absorption',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (!price || price === 0) return '—'
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function confidenceColor(confidence: string): string {
  if (confidence === 'high') return 'var(--color-profit)'
  if (confidence === 'medium') return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function directionColor(direction: string): string {
  return direction === 'long' ? 'var(--color-profit)' : 'var(--color-loss)'
}

function directionBg(direction: string): string {
  return direction === 'long'
    ? 'rgba(0,135,87,0.15)'
    : 'rgba(239,65,54,0.15)'
}

function directionBorder(direction: string): string {
  return direction === 'long'
    ? 'rgba(0,135,87,0.4)'
    : 'rgba(239,65,54,0.4)'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 40,
        height: 18,
        borderRadius: 3,
        background: directionBg(direction),
        border: `1px solid ${directionBorder(direction)}`,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: directionColor(direction),
        }}
      >
        {direction === 'long' ? 'LONG' : 'SHORT'}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: SetupStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.candidate
  const isArmed = status === 'armed'

  return (
    <div
      className={cn('flex items-center justify-center', isArmed && 'animate-pulse')}
      style={{
        height: 18,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 3,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        boxShadow: isArmed ? '0 0 8px rgba(251,191,36,0.4)' : undefined,
      }}
    >
      <span
        style={{
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.07em',
          color: meta.color,
        }}
      >
        {meta.label}
      </span>
    </div>
  )
}

// ticks = price difference / 0.25 (NQ tick size)
function toTicks(priceDiff: number): number {
  return Math.round(Math.abs(priceDiff) / 0.25)
}

function PriceRow({ setup }: { setup: SetupData }) {
  const entry = setup.entry_trigger_price
  const stop = setup.stop_price
  const tp1 = setup.tp1_price
  const tp2 = setup.tp2_price
  const zoneHigh = setup.entry_zone_high
  const zoneLow = setup.entry_zone_low

  const risk = entry > 0 && stop > 0 ? Math.abs(entry - stop) : 0
  const reward = entry > 0 && tp1 > 0 ? Math.abs(tp1 - entry) : 0
  const total = risk + reward

  const stopTicks = entry > 0 && stop > 0 ? toTicks(entry - stop) : null
  const tp1Ticks = entry > 0 && tp1 > 0 ? toTicks(tp1 - entry) : null
  const tp2Ticks = entry > 0 && tp2 > 0 ? toTicks(tp2 - entry) : null

  const isLong = setup.direction === 'long'

  return (
    <div className="flex flex-col gap-1.5">
      {/* Entry zone band — if zone is set */}
      {zoneLow > 0 && zoneHigh > 0 && (
        <div
          className="flex items-center justify-between px-2 py-1 rounded-[var(--radius-xs)]"
          style={{
            background: isLong ? 'rgba(0,135,87,0.06)' : 'rgba(239,65,54,0.06)',
            border: `1px solid ${isLong ? 'rgba(0,135,87,0.2)' : 'rgba(239,65,54,0.2)'}`,
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Entry Zone
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: isLong ? 'var(--color-profit)' : 'var(--color-loss)',
            }}
          >
            {formatPrice(zoneLow)} – {formatPrice(zoneHigh)}
          </span>
        </div>
      )}

      {/* Price grid */}
      <div className="grid gap-1" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Entry trigger */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Trigger
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            {formatPrice(entry)}
          </span>
        </div>

        {/* Stop */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Stop
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-loss)' }}
          >
            {formatPrice(stop)}
          </span>
          {stopTicks != null && (
            <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-loss)', opacity: 0.7 }}>
              -{stopTicks}t
            </span>
          )}
        </div>

        {/* TP1 */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            TP1
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-profit)' }}
          >
            {formatPrice(tp1)}
          </span>
          {tp1Ticks != null && (
            <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-profit)', opacity: 0.7 }}>
              +{tp1Ticks}t
            </span>
          )}
        </div>
      </div>

      {/* TP2 if available */}
      {tp2 > 0 && tp2Ticks != null && (
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            TP2
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="tabular-nums" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-profit)' }}>
              {formatPrice(tp2)}
            </span>
            <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-profit)', opacity: 0.7 }}>
              +{tp2Ticks}t
            </span>
          </div>
        </div>
      )}

      {/* R:R bar */}
      {total > 0 && (
        <div className="flex items-center gap-0.5" style={{ height: 4 }}>
          <div
            style={{ flex: risk, height: 4, borderRadius: 2, background: 'var(--color-loss)', opacity: 0.55 }}
          />
          <div
            style={{ flex: reward, height: 4, borderRadius: 2, background: 'var(--color-profit)', opacity: 0.55 }}
          />
        </div>
      )}
    </div>
  )
}

function WhySection({ setup }: { setup: SetupData }) {
  return (
    <div className="flex flex-col gap-1">
      {setup.why_now && (
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Why Now
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {setup.why_now}
          </p>
        </div>
      )}
      {setup.why_here && (
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Why Here
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {setup.why_here}
          </p>
        </div>
      )}
    </div>
  )
}

function EvidenceList({ evidence }: { evidence: string[] }) {
  if (!evidence.length) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span
        style={{
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        Evidence
      </span>
      <ul style={{ margin: 0, paddingLeft: 12 }}>
        {evidence.map((e, i) => (
          <li
            key={i}
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Setup Card ────────────────────────────────────────────────────────────────

interface SetupCardProps {
  setup: SetupData
  dimmed?: boolean
}

function SetupCard({ setup, dimmed = false }: SetupCardProps) {
  const meta = STATUS_META[setup.status] ?? STATUS_META.candidate
  const typeLabel =
    SETUP_TYPE_LABELS[setup.setup_type] ?? setup.setup_type.toUpperCase()

  return (
    <div
      className="flex flex-col gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] border"
      style={{
        background: meta.bg,
        borderColor: meta.border,
        opacity: dimmed ? 0.45 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header: direction + type + status + R:R */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DirectionBadge direction={setup.direction} />
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Confidence */}
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: confidenceColor(setup.confidence),
            }}
          >
            {setup.confidence}
          </span>
          {/* R:R */}
          {setup.risk_reward > 0 && (
            <span
              className="tabular-nums"
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color:
                  setup.risk_reward >= 2.5
                    ? 'var(--color-profit)'
                    : setup.risk_reward >= 1.5
                    ? 'var(--color-warning)'
                    : 'var(--color-text-secondary)',
              }}
            >
              {setup.risk_reward.toFixed(1)}R
            </span>
          )}
        </div>
      </div>

      {/* Status badge + reason + P&L */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={setup.status} />
          {(setup.exit_reason || setup.status_reason) && (
            <span
              style={{
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {setup.exit_reason || setup.status_reason}
            </span>
          )}
        </div>
        {/* P&L ticks badge — only shown when position has exited */}
        {setup.pnl_ticks != null && (
          <span
            className="tabular-nums"
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: setup.pnl_ticks >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
            }}
          >
            {setup.pnl_ticks >= 0 ? '+' : ''}{setup.pnl_ticks}t
          </span>
        )}
      </div>

      {/* Prices + R:R bar */}
      <PriceRow setup={setup} />

      {/* Why section */}
      {!dimmed && <WhySection setup={setup} />}

      {/* Evidence */}
      {!dimmed && setup.evidence.length > 0 && (
        <EvidenceList evidence={setup.evidence} />
      )}

      {/* Thesis (compact, last line) */}
      {setup.thesis && (
        <p
          style={{
            margin: 0,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            opacity: dimmed ? 0.7 : 1,
          }}
        >
          {setup.thesis}
        </p>
      )}
    </div>
  )
}

// ── Staleness Dot ─────────────────────────────────────────────────────────────

function StalenessDot({ lastUpdateTs }: { lastUpdateTs?: number | null }) {
  const [age, setAge] = useState(0)

  useEffect(() => {
    if (!lastUpdateTs) return
    const tick = () => setAge(Math.floor((Date.now() - lastUpdateTs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastUpdateTs])

  if (!lastUpdateTs) return null

  const color =
    age < 5
      ? 'var(--color-profit)'
      : age < 30
        ? 'var(--color-warning)'
        : 'var(--color-loss)'

  const shadow = age < 5 ? '0 0 5px var(--color-profit)' : age < 30 ? '0 0 4px var(--color-warning)' : 'none'
  const label = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`

  return (
    <div className="flex items-center gap-1" title={`Last updated ${label}`}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: shadow }} />
      <span className="font-mono text-[8px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SetupSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 px-3 py-2.5 rounded-[var(--radius-sm)]"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-[18px] w-10" style={{ borderRadius: 3 }} />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          {/* Status badge */}
          <Skeleton className="h-[18px] w-20" style={{ borderRadius: 3 }} />
          {/* Price grid */}
          <div className="grid gap-1" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex flex-col gap-0.5">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
          {/* R:R bar */}
          <Skeleton className="h-1 w-full" style={{ borderRadius: 2 }} />
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message, showIcon = false }: { message: string; showIcon?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6">
      {showIcon && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          style={{ opacity: 0.3 }}
        >
          {/* Grid icon suggesting empty table */}
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="11" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )}
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
        }}
      >
        {message}
      </span>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-1.5 px-0.5">
      <span
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
        }}
      >
        ({count})
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface SetupLifecyclePanelProps {
  setups: SetupData[]
  isLoading?: boolean
  error?: string | null
  className?: string
  lastUpdateTs?: number | null
}

export function SetupLifecyclePanel({
  setups,
  isLoading = false,
  error = null,
  className,
  lastUpdateTs,
}: SetupLifecyclePanelProps) {
  if (isLoading && setups.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <SetupSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState message={`Error: ${error}`} showIcon />
      </div>
    )
  }

  const activeSetups = setups.filter(s => !isTerminalStatus(s.status))
  const historicalSetups = setups.filter(s => isTerminalStatus(s.status))

  if (setups.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState message="No setups detected" showIcon />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Staleness indicator */}
      {lastUpdateTs != null && (
        <div className="flex justify-end">
          <StalenessDot lastUpdateTs={lastUpdateTs} />
        </div>
      )}

      {/* Active setups */}
      {activeSetups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionHeader label="Active" count={activeSetups.length} />
          {activeSetups.map(setup => (
            <SetupCard key={setup.setup_id} setup={setup} dimmed={false} />
          ))}
        </div>
      )}

      {/* Historical / terminal setups — dimmed */}
      {historicalSetups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionHeader label="History" count={historicalSetups.length} />
          {historicalSetups.map(setup => (
            <SetupCard key={setup.setup_id} setup={setup} dimmed />
          ))}
        </div>
      )}
    </div>
  )
}
