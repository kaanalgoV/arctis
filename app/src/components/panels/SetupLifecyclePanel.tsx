import { cn } from '@/lib/utils'
import type { SetupData, SetupStatus } from '@/hooks/useSetups'
import { isTerminalStatus } from '@/hooks/useSetups'

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
  armed: {
    label: 'ARMED',
    color: 'var(--color-warning)',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
  triggered: {
    label: 'TRIGGERED',
    color: '#5CB8F0',
    bg: 'rgba(92,184,240,0.08)',
    border: 'rgba(92,184,240,0.3)',
  },
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
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 18,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 3,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
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

function PriceRow({ setup }: { setup: SetupData }) {
  const risk = setup.entry_trigger_price > 0 && setup.stop_price > 0
    ? Math.abs(setup.entry_trigger_price - setup.stop_price)
    : 0
  const reward = setup.entry_trigger_price > 0 && setup.tp1_price > 0
    ? Math.abs(setup.tp1_price - setup.entry_trigger_price)
    : 0
  const total = risk + reward

  return (
    <div className="flex flex-col gap-1">
      {/* Price values */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        {/* Entry */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Entry
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {formatPrice(setup.entry_trigger_price)}
          </span>
        </div>
        {/* Stop */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Stop
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-loss)',
            }}
          >
            {formatPrice(setup.stop_price)}
          </span>
        </div>
        {/* TP1 */}
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            TP1
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-profit)',
            }}
          >
            {formatPrice(setup.tp1_price)}
          </span>
        </div>
      </div>

      {/* R:R bar */}
      {total > 0 && (
        <div className="flex items-center gap-0.5" style={{ height: 4 }}>
          <div
            style={{
              flex: risk,
              height: 4,
              borderRadius: 2,
              background: 'var(--color-loss)',
              opacity: 0.55,
            }}
          />
          <div
            style={{
              flex: reward,
              height: 4,
              borderRadius: 2,
              background: 'var(--color-profit)',
              opacity: 0.55,
            }}
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

      {/* Status badge */}
      <div className="flex items-center gap-1.5">
        <StatusBadge status={setup.status} />
        {setup.exit_reason && (
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            {setup.exit_reason}
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-5">
      <span
        style={{
          fontSize: 11,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
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
}

export function SetupLifecyclePanel({
  setups,
  isLoading = false,
  error = null,
  className,
}: SetupLifecyclePanelProps) {
  if (isLoading && setups.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState message="Loading setups..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState message={`Error: ${error}`} />
      </div>
    )
  }

  const activeSetups = setups.filter(s => !isTerminalStatus(s.status))
  const historicalSetups = setups.filter(s => isTerminalStatus(s.status))

  if (setups.length === 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <EmptyState message="No active setups" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
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
