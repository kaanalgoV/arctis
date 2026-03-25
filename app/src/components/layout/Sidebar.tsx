import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CandlestickChart,
  Zap,
  Play,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItemId = 'dashboard' | 'chart' | 'patterns' | 'replay' | 'settings'

interface NavItem {
  id: NavItemId
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'chart', icon: CandlestickChart, label: 'Chart' },
  { id: 'patterns', icon: Zap, label: 'Patterns' },
  { id: 'replay', icon: Play, label: 'Replay' },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { id: 'settings', icon: SlidersHorizontal, label: 'Settings' },
]

interface SidebarNavItemProps {
  item: NavItem
  isActive: boolean
  onClick: (id: NavItemId) => void
}

function SidebarNavItem({ item, isActive, onClick }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <div className="relative flex items-center w-full justify-center">
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-[var(--color-accent)]"
          initial={false}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick(item.id)}
        title={item.label}
        className={cn(
          'relative flex items-center justify-center',
          'w-10 h-10 rounded-[var(--radius-md)]',
          'transition-colors duration-150',
          'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          isActive
            ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)]',
        )}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={16} strokeWidth={1.75} />
      </motion.button>
    </div>
  )
}

interface SidebarProps {
  /** Controlled active item — managed externally by App */
  activeItem?: NavItemId
  /** Legacy prop — kept for backwards compat, ignored when activeItem is provided */
  defaultActive?: NavItemId
  onNavigate?: (id: NavItemId) => void
}

export function Sidebar({ activeItem, defaultActive = 'chart', onNavigate }: SidebarProps) {
  // Use controlled prop when provided, otherwise fall back to defaultActive for
  // scenarios where Sidebar is used standalone (e.g. storybook / tests)
  const resolvedActive: NavItemId = activeItem ?? defaultActive

  const handleNavigate = (id: NavItemId) => {
    onNavigate?.(id)
  }

  return (
    <aside
      className={cn(
        'flex flex-col items-center h-full w-full',
        'bg-[var(--color-surface-void)]',
        'shadow-[2px_0_8px_rgba(0,0,0,0.3)]',
        'py-3 gap-1',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center w-9 h-9 mb-3 shrink-0">
        <ArctisLogo />
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-[var(--color-border-subtle)] mb-2 shrink-0" />

      {/* Main nav items */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 w-full" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={resolvedActive === item.id}
            onClick={handleNavigate}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        {/* Settings */}
        {BOTTOM_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={resolvedActive === item.id}
            onClick={handleNavigate}
          />
        ))}

        {/* Connection status dot */}
        <ConnectionDot />
      </div>
    </aside>
  )
}

function ConnectionDot() {
  return (
    <div className="relative flex items-center justify-center w-5 h-5 mb-1">
      {/* Pulse ring */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--color-profit)]"
        animate={{ scale: [1, 1.8], opacity: [0.35, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      {/* Solid dot */}
      <span className="relative w-2 h-2 rounded-full bg-[var(--color-profit)]" />
    </div>
  )
}

function ArctisLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Arctis"
    >
      <defs>
        <linearGradient id="at-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DCBF5" />
          <stop offset="100%" stopColor="#3A9FD8" />
        </linearGradient>
      </defs>
      {/* "A" character — geometric, sharp */}
      <path
        d="M8 24L13.5 6h1.2L9.8 24H8zm2.8-7h6.4l.6 1.6H10.2L10.8 17z"
        fill="url(#at-grad)"
      />
      {/* "T" character — clean, right-aligned */}
      <path
        d="M18 6h8v1.6h-3.1V24h-1.8V7.6H18V6z"
        fill="url(#at-grad)"
      />
    </svg>
  )
}
