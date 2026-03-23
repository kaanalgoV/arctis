import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── RightPanelSection ─────────────────────────────────────────────────────────

interface RightPanelSectionProps {
  title: string
  count?: string | number
  children: ReactNode
  className?: string
  /** Animate entry of the section */
  animate?: boolean
}

export function RightPanelSection({
  title,
  count,
  children,
  className,
  animate = true,
}: RightPanelSectionProps) {
  const Container = animate ? motion.div : 'div'
  const containerProps = animate
    ? {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      }
    : {}

  return (
    <Container
      {...(containerProps as Record<string, unknown>)}
      className={cn('flex flex-col', className)}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5 shrink-0">
        <span
          className={cn(
            'font-mono text-[9px] uppercase tracking-widest leading-none',
            'text-[var(--color-text-muted)]',
          )}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            className={cn(
              'font-mono text-[9px] leading-none',
              'px-1.5 py-0.5 rounded-[3px]',
              'bg-[var(--color-surface-raised)]',
              'text-[var(--color-text-muted)]',
              'border border-[var(--color-border-subtle)]',
            )}
          >
            {count}
          </span>
        )}
      </div>

      {/* Section content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </Container>
  )
}

// ── Section divider ────────────────────────────────────────────────────────────

export function RightPanelDivider() {
  return (
    <div className="w-full h-px bg-[var(--color-border-subtle)] shrink-0" />
  )
}

// ── RightPanel ────────────────────────────────────────────────────────────────

interface RightPanelProps {
  children: ReactNode
  className?: string
}

export function RightPanel({ children, className }: RightPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col h-full w-full',
        'bg-[var(--color-surface-secondary)]/95',
        'border-l border-[var(--color-border-subtle)]',
        'overflow-y-auto overflow-x-hidden',
        className,
      )}
    >
      {children}
    </motion.aside>
  )
}
