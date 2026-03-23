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
      {/* Section header — compact, consistent */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#8B949E]">
          {title}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[9px] leading-none px-1.5 py-0.5 rounded bg-[#21262D] text-[#8B949E] tabular-nums">
            {count}
          </span>
        )}
      </div>

      {/* Section content */}
      <div className="flex-1 min-h-0 px-3 pb-2">
        {children}
      </div>
    </Container>
  )
}

// ── Section divider ────────────────────────────────────────────────────────────

export function RightPanelDivider() {
  return (
    <div className="w-full h-px bg-[#21262D] shrink-0" />
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
        'bg-[#0D1117]',
        'border-l border-[#21262D]',
        'overflow-y-auto overflow-x-hidden',
        'scrollbar-thin scrollbar-thumb-[#21262D] scrollbar-track-transparent',
        className,
      )}
    >
      {children}
    </motion.aside>
  )
}
