'use client'

import { type ReactNode, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

// ── RightPanelSection (Collapsible) ────────────────────────────────────────────

interface RightPanelSectionProps {
  title: string
  count?: string | number
  children: ReactNode
  className?: string
  /** Start collapsed */
  defaultCollapsed?: boolean
  /** Accent color for the left border when expanded */
  accent?: 'ice' | 'profit' | 'loss' | 'warning' | 'none'
}

export function RightPanelSection({
  title,
  count,
  children,
  className,
  defaultCollapsed = false,
  accent = 'none',
}: RightPanelSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const toggle = useCallback(() => setCollapsed(prev => !prev), [])

  const accentColors: Record<string, string> = {
    ice: 'var(--color-accent)',
    profit: 'var(--color-profit)',
    loss: 'var(--color-loss)',
    warning: 'var(--color-warning)',
    none: 'transparent',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{
        borderLeft: accent !== 'none' && !collapsed
          ? `2px solid ${accentColors[accent]}`
          : '2px solid transparent',
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* Section header — clickable to toggle */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer select-none group"
        style={{
          background: collapsed
            ? 'transparent'
            : 'rgba(var(--color-surface-raised-rgb, 34, 40, 48), 0.3)',
          transition: 'background 0.2s ease',
        }}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronDown
              size={12}
              strokeWidth={2}
              style={{
                color: collapsed
                  ? 'var(--color-text-muted)'
                  : 'var(--color-accent)',
                transition: 'color 0.2s ease',
              }}
            />
          </motion.div>
          <span
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{
              color: collapsed
                ? 'var(--color-text-muted)'
                : 'var(--color-text-secondary)',
              transition: 'color 0.2s ease',
            }}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {count !== undefined && (
            <span
              className="font-mono text-[9px] leading-none px-1.5 py-0.5 rounded tabular-nums"
              style={{
                background: 'var(--color-surface-raised, #222830)',
                color: 'var(--color-text-muted, #6E7681)',
              }}
            >
              {count}
            </span>
          )}
        </div>
      </button>

      {/* Section content — smooth collapse */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Section divider ────────────────────────────────────────────────────────────

export function RightPanelDivider() {
  return (
    <div
      className="w-full shrink-0"
      style={{
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--color-border-subtle, #272F3A), transparent)',
      }}
    />
  )
}

// ── RightPanel ─────────────────────────────────────────────────────────────────

interface RightPanelProps {
  children: ReactNode
  className?: string
}

export function RightPanel({ children, className }: RightPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--color-surface-primary, #0F1318)',
        borderLeft: '1px solid var(--color-border-subtle, #272F3A)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {children}
    </motion.aside>
  )
}
