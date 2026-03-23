import { cn } from '@/lib/utils'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-arctic-secondary rounded animate-pulse',
        className,
      )}
    />
  )
}

// ─── ShimmerSkeleton ──────────────────────────────────────────────────────────

export function ShimmerSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-arctic-secondary rounded',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(240,246,252,0.04) 50%, transparent 100%)',
          animation: 'shimmer 1.8s infinite',
        }}
      />
    </div>
  )
}
