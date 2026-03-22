import { useState } from 'react'
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(item.id)}
      className={cn(
        'relative flex items-center justify-center',
        'w-9 h-9 rounded-[var(--radius-md)]',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
        isActive
          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
      )}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active left border accent */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full bg-[var(--color-accent)]"
          initial={false}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <Icon size={16} strokeWidth={1.75} />
    </motion.button>
  )
}

interface SidebarProps {
  defaultActive?: NavItemId
  onNavigate?: (id: NavItemId) => void
}

export function Sidebar({ defaultActive = 'chart', onNavigate }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<NavItemId>(defaultActive)

  const handleNavigate = (id: NavItemId) => {
    setActiveItem(id)
    onNavigate?.(id)
  }

  return (
    <aside
      className={cn(
        'flex flex-col items-center h-full w-full',
        'bg-[var(--color-surface-secondary)]',
        'border-r border-[var(--color-border-subtle)]',
        'py-3 gap-1',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center w-9 h-9 mb-2 shrink-0">
        <ArctisMountainLogo />
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-[var(--color-border-subtle)] mb-2 shrink-0" />

      {/* Main nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
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
            isActive={activeItem === item.id}
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

function ArctisMountainLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Arctis logo"
    >
      <defs>
        {/* Main ice-blue gradient for primary peak */}
        <linearGradient id="peak-main" x1="14" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A8DAFF" />
          <stop offset="40%" stopColor="#5CB8F0" />
          <stop offset="100%" stopColor="#1A4A70" />
        </linearGradient>

        {/* Darker gradient for right face of main peak */}
        <linearGradient id="peak-main-shadow" x1="14" y1="4" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3A8CC4" />
          <stop offset="100%" stopColor="#0E2D48" />
        </linearGradient>

        {/* Left secondary peak gradient */}
        <linearGradient id="peak-left" x1="5" y1="8" x2="8" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CB8F0" />
          <stop offset="100%" stopColor="#1A3A58" />
        </linearGradient>

        {/* Right secondary peak gradient */}
        <linearGradient id="peak-right" x1="20" y1="10" x2="23" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4AACE8" />
          <stop offset="100%" stopColor="#1A3A58" />
        </linearGradient>

        {/* Reflection gradient (fades downward) */}
        <linearGradient id="reflection" x1="14" y1="22" x2="14" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CB8F0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1A4A70" stopOpacity="0" />
        </linearGradient>

        {/* Glow filter for north star */}
        <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background atmosphere glow ── */}
      <ellipse cx="14" cy="20" rx="11" ry="3" fill="#5CB8F0" fillOpacity="0.04" />

      {/* ── Left secondary peak ── */}
      <polygon
        points="5,19 9,9 13,19"
        fill="url(#peak-left)"
        opacity="0.75"
      />
      {/* Left peak snow cap */}
      <polygon
        points="9,9 7.5,14 10.5,14"
        fill="#D6EFFF"
        fillOpacity="0.55"
      />

      {/* ── Right secondary peak ── */}
      <polygon
        points="15,19 19,11 23,19"
        fill="url(#peak-right)"
        opacity="0.7"
      />
      {/* Right peak snow cap */}
      <polygon
        points="19,11 17.8,15 20.2,15"
        fill="#C8E8FF"
        fillOpacity="0.5"
      />

      {/* ── Main central peak — left face (light) ── */}
      <polygon
        points="14,2 7,22 14,18"
        fill="url(#peak-main)"
      />

      {/* ── Main central peak — right face (shadow) ── */}
      <polygon
        points="14,2 21,22 14,18"
        fill="url(#peak-main-shadow)"
      />

      {/* ── Snow cap on main peak ── */}
      <polygon
        points="14,2 11,9 14,8 17,9"
        fill="#E8F6FF"
        fillOpacity="0.85"
      />
      {/* Snow cap highlight line */}
      <line x1="14" y1="2" x2="11" y2="9" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.5" />

      {/* ── Base / waterline ── */}
      <line x1="4" y1="22" x2="24" y2="22" stroke="#5CB8F0" strokeOpacity="0.2" strokeWidth="0.75" />

      {/* ── Water reflection (mirrored, faded) ── */}
      <polygon
        points="14,22 7,28 21,28"
        fill="url(#reflection)"
      />
      {/* Reflection shimmer line */}
      <line x1="10" y1="24" x2="18" y2="24" stroke="#5CB8F0" strokeOpacity="0.12" strokeWidth="0.5" />
      <line x1="11.5" y1="26" x2="16.5" y2="26" stroke="#5CB8F0" strokeOpacity="0.08" strokeWidth="0.5" />

      {/* ── North star (top-right, above peak) ── */}
      <g filter="url(#star-glow)">
        {/* 4-point star shape */}
        <path
          d="M23 3 L23.5 4.2 L24.7 4.7 L23.5 5.2 L23 6.4 L22.5 5.2 L21.3 4.7 L22.5 4.2 Z"
          fill="#A8DAFF"
          fillOpacity="0.9"
        />
        {/* Tiny companion dots */}
        <circle cx="25.5" cy="2.5" r="0.4" fill="#5CB8F0" fillOpacity="0.7" />
        <circle cx="21" cy="2" r="0.3" fill="#5CB8F0" fillOpacity="0.5" />
      </g>
    </svg>
  )
}
