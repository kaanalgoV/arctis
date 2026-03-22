import { useRef } from 'react'
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReplayBarProps {
  isPlaying: boolean
  speed: number
  progress: number // 0-100
  currentTime: string
  totalTime: string
  date: string
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (progress: number) => void
  onDateChange: (direction: 'prev' | 'next') => void
}

// ── Speed options ─────────────────────────────────────────────────────────────

const SPEED_OPTIONS = [1, 5, 10, 25] as const

// ── Sub-components ────────────────────────────────────────────────────────────

interface TransportButtonProps {
  onClick: () => void
  children: React.ReactNode
  label: string
  disabled?: boolean
}

function TransportButton({ onClick, children, label, disabled = false }: TransportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex items-center justify-center w-5 h-5 rounded',
        'text-[var(--color-text-muted)]',
        'hover:text-[var(--color-text-secondary)] hover:bg-white/[0.04]',
        'transition-colors duration-100',
        'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
        'disabled:opacity-30 disabled:pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

// ── Progress Track ────────────────────────────────────────────────────────────

interface ProgressTrackProps {
  progress: number
  onSeek: (progress: number) => void
}

function ProgressTrack({ progress, onSeek }: ProgressTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateProgress(e)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return
    updateProgress(e)
  }

  function updateProgress(e: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    onSeek(pct)
  }

  const fillPct = Math.min(100, Math.max(0, progress))

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative flex-1 h-[3px] rounded-full bg-white/[0.06] cursor-pointer group mx-2"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fillPct)}
      aria-label="Replay position"
    >
      {/* Filled portion — ice-blue gradient */}
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${fillPct}%`,
          background: 'linear-gradient(90deg, #3a9fd8 0%, #5CB8F0 100%)',
        }}
      />
      {/* Draggable thumb */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
          'w-2.5 h-2.5 rounded-full',
          'bg-[#5CB8F0] shadow-md',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
          'pointer-events-none',
        )}
        style={{ left: `${fillPct}%` }}
      />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ReplayBar({
  isPlaying,
  speed,
  progress,
  currentTime,
  totalTime,
  date,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  onDateChange,
}: ReplayBarProps) {
  return (
    <div
      className={cn(
        'flex items-center h-full w-full px-3 gap-2',
        'bg-[var(--color-surface-primary)]',
        'border-t border-[var(--color-border-subtle)]',
        'select-none',
      )}
    >
      {/* Transport controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <TransportButton onClick={() => onSeek(0)} label="Skip to start">
          <SkipBack size={11} strokeWidth={1.75} />
        </TransportButton>
        <TransportButton onClick={() => onSeek(Math.max(0, progress - 5))} label="Step back">
          <ChevronLeft size={11} strokeWidth={1.75} />
        </TransportButton>
        <TransportButton
          onClick={isPlaying ? onPause : onPlay}
          label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={11} strokeWidth={1.75} />
          ) : (
            <Play size={11} strokeWidth={1.75} />
          )}
        </TransportButton>
        <TransportButton onClick={() => onSeek(Math.min(100, progress + 5))} label="Step forward">
          <ChevronRight size={11} strokeWidth={1.75} />
        </TransportButton>
        <TransportButton onClick={() => onSeek(100)} label="Skip to end">
          <SkipForward size={11} strokeWidth={1.75} />
        </TransportButton>
      </div>

      {/* Progress track */}
      <ProgressTrack progress={progress} onSeek={onSeek} />

      {/* Time display */}
      <div className="shrink-0">
        <span className="font-mono text-[10px] tabular-nums text-[var(--color-text-muted)] leading-none">
          {currentTime} / {totalTime}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[var(--color-border-subtle)] shrink-0" />

      {/* Speed selector */}
      <div className="flex items-center gap-0.5 shrink-0">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={cn(
              'px-1.5 py-0.5 rounded',
              'font-mono text-[10px] leading-none',
              'transition-colors duration-100',
              'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
              speed === s
                ? 'bg-[#5CB8F0]/15 text-[#5CB8F0]'
                : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[var(--color-border-subtle)] shrink-0" />

      {/* Date picker */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onDateChange('prev')}
          aria-label="Previous day"
          className={cn(
            'flex items-center justify-center w-4 h-4 rounded',
            'text-[var(--color-text-muted)]',
            'hover:text-[var(--color-text-secondary)] hover:bg-white/[0.04]',
            'transition-colors duration-100',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          )}
        >
          <ChevronLeft size={11} strokeWidth={1.75} />
        </button>
        <span className="font-mono text-[10px] tabular-nums text-[var(--color-text-secondary)] leading-none min-w-[68px] text-center">
          {date || '—'}
        </span>
        <button
          onClick={() => onDateChange('next')}
          aria-label="Next day"
          className={cn(
            'flex items-center justify-center w-4 h-4 rounded',
            'text-[var(--color-text-muted)]',
            'hover:text-[var(--color-text-secondary)] hover:bg-white/[0.04]',
            'transition-colors duration-100',
            'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          )}
        >
          <ChevronRight size={11} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
