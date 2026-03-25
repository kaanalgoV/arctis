'use client'

import { type ReactNode, useState, useCallback, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronsUpDown, PanelRightClose } from 'lucide-react'

// ── Collapse-All Context ──────────────────────────────────────────────────────

interface CollapseAllCtx {
  signal: number
  action: 'collapse' | 'expand'
}

const CollapseAllContext = createContext<CollapseAllCtx>({ signal: 0, action: 'collapse' })

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
  const { signal, action } = useContext(CollapseAllContext)

  useEffect(() => {
    if (signal > 0) setCollapsed(action === 'collapse')
  }, [signal, action])

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
      style={{ position: 'relative' }}
    >
      {/* Accent line — left edge, visible only when expanded */}
      <AnimatePresence initial={false}>
        {!collapsed && accent !== 'none' && (
          <motion.div
            key="accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              background: accentColors[accent],
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Section header — clickable to toggle */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 cursor-pointer select-none group"
        style={{
          height: 36,
          background: 'transparent',
          transition: 'background-color 100ms ease',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--color-surface-raised)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <ChevronDown
              size={11}
              strokeWidth={2.5}
              style={{
                color: collapsed
                  ? 'var(--color-text-muted)'
                  : 'var(--color-accent)',
                transition: 'color 0.15s ease',
              }}
            />
          </motion.div>
          <span
            className="font-sans text-[12px] font-semibold tracking-[0.04em] uppercase"
            style={{
              color: collapsed
                ? 'var(--color-text-muted)'
                : 'var(--color-text-secondary)',
              transition: 'color 0.15s ease',
            }}
          >
            {title}
          </span>
        </div>

        {count !== undefined && (
          <span
            className="font-mono text-[9px] leading-none px-1.5 py-0.5 rounded-full tabular-nums"
            style={{
              background: 'var(--color-surface-raised)',
              color: 'var(--color-text-muted)',
            }}
          >
            {count}
          </span>
        )}
      </button>

      {/* Section content — smooth collapse */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 py-2">
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
      className="h-px w-full shrink-0"
      style={{ background: 'var(--color-border-subtle)' }}
    />
  )
}

// ── RightPanel ─────────────────────────────────────────────────────────────────

interface RightPanelProps {
  children: ReactNode
  className?: string
  onClose?: () => void
}

export function RightPanel({ children, className, onClose }: RightPanelProps) {
  const [signal, setSignal] = useState(0)
  const [allCollapsed, setAllCollapsed] = useState(false)
  const action = allCollapsed ? 'expand' : 'collapse'

  const handleToggleAll = useCallback(() => {
    setAllCollapsed(prev => !prev)
    setSignal(prev => prev + 1)
  }, [])

  return (
    <CollapseAllContext.Provider value={{ signal, action }}>
      <motion.aside
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: 'var(--right-panel-width, 300px)',
          background: 'var(--color-surface-primary)',
          boxShadow: 'inset 1px 0 0 var(--color-border-subtle)',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent',
        }}
      >
        {/* Panel header with collapse-all and close */}
        <div
          className="flex items-center justify-end gap-1 px-2 shrink-0"
          style={{
            height: 32,
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={handleToggleAll}
            title={allCollapsed ? 'Alle Sektionen aufklappen' : 'Alle Sektionen einklappen'}
            className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)] transition-colors duration-100"
          >
            <ChevronsUpDown size={13} strokeWidth={1.75} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Panel schliessen"
              className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)] transition-colors duration-100"
            >
              <PanelRightClose size={13} strokeWidth={1.75} />
            </button>
          )}
        </div>
        {children}
      </motion.aside>
    </CollapseAllContext.Provider>
  )
}
