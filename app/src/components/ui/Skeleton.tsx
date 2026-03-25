import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('skeleton rounded-[var(--radius-md)]', className)} style={style} />
}

interface PanelSkeletonProps {
  /** Number of skeleton lines to render (default 4) */
  lines?: number
  /** Optional label shown below the skeleton, e.g. "Connecting..." */
  label?: string
}

export function PanelSkeleton({ lines = 4, label }: PanelSkeletonProps) {
  const widths = ['w-24', 'w-16', 'w-full', 'w-3/4', 'w-1/2', 'w-full', 'w-2/3']
  const heights = ['h-4', 'h-8', 'h-3', 'h-3', 'h-3', 'h-3', 'h-3']

  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`${heights[i % heights.length]} ${widths[i % widths.length]}`} />
      ))}
      {label && (
        <span
          className="font-mono text-[9px] tracking-[0.05em] mt-1"
          style={{ color: 'var(--color-text-inactive)' }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
