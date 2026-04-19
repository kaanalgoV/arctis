'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeInDown } from '@/lib/animations'
import { LOGIN_URL, CHECKOUT_URL } from '@/lib/app-urls'

// ─── Types ────────────────────────────────────────────────

interface NavLink {
  label: string
  href: string
}

// ─── Constants ────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Engine', href: '#engine' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Changelog', href: '/changelog' },
]

// ─── Ice Crystal SVG Logo ─────────────────────────────────

function IceCrystalIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Vertical axis */}
      <line x1="14" y1="2" x2="14" y2="26" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" />
      {/* Horizontal axis */}
      <line x1="2" y1="14" x2="26" y2="14" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal axis — top-left to bottom-right */}
      <line x1="5.8" y1="5.8" x2="22.2" y2="22.2" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal axis — top-right to bottom-left */}
      <line x1="22.2" y1="5.8" x2="5.8" y2="22.2" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" />
      {/* Inner hexagonal ring points */}
      <circle cx="14" cy="14" r="3.5" stroke="#5CB8F0" strokeWidth="1.2" fill="none" />
      {/* Branch tips — vertical */}
      <line x1="14" y1="2" x2="11" y2="5.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="2" x2="17" y2="5.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="26" x2="11" y2="22.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="26" x2="17" y2="22.5" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      {/* Branch tips — horizontal */}
      <line x1="2" y1="14" x2="5.5" y2="11" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="2" y1="14" x2="5.5" y2="17" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="26" y1="14" x2="22.5" y2="11" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="26" y1="14" x2="22.5" y2="17" stroke="#5CB8F0" strokeWidth="1" strokeLinecap="round" />
      {/* Outer glow ring */}
      <circle cx="14" cy="14" r="12" stroke="#5CB8F0" strokeWidth="0.4" fill="none" opacity="0.15" />
      {/* Center glow dot — gentle pulse */}
      <circle cx="14" cy="14" r="1.5" fill="#5CB8F0" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Sparkle dots at endpoints */}
      <circle cx="14" cy="2" r="0.5" fill="#5CB8F0" opacity="0.45" />
      <circle cx="26" cy="14" r="0.5" fill="#5CB8F0" opacity="0.45" />
      <circle cx="5.8" cy="22.2" r="0.5" fill="#5CB8F0" opacity="0.35" />
    </svg>
  )
}

// ─── Nav Link ─────────────────────────────────────────────

function NavLinkItem({ label, href }: NavLink) {
  return (
    <Link
      href={href}
      className="font-sans text-sm font-medium tracking-wide uppercase text-frost-secondary hover:text-frost-white transition-colors duration-200 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
    >
      {label}
    </Link>
  )
}

// ─── Mobile Menu ──────────────────────────────────────────

const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: 'easeIn' as const },
  },
}

const mobileItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'absolute top-full left-0 right-0 mt-2 mx-4 rounded-2xl overflow-hidden',
            'border border-frost-border-subtle',
          )}
          style={{
            background: 'rgba(15, 19, 24, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(92,184,240,0.06)',
          }}
        >
          <nav className="flex flex-col px-6 py-6 gap-1">
            {NAV_LINKS.map((link) => (
              <motion.div key={link.href} variants={mobileItemVariants}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center py-3 font-sans text-sm font-medium tracking-wide uppercase text-frost-secondary hover:text-frost-white transition-colors duration-200 border-b border-frost-border-subtle last:border-0 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base rounded-sm"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            <motion.div variants={mobileItemVariants} className="pt-4 grid gap-2">
              <a
                href={CHECKOUT_URL}
                onClick={onClose}
                className={cn(
                  'w-full block text-center bg-ice text-arctic-base font-display font-semibold text-sm',
                  'px-5 py-3 rounded-lg min-h-[44px] cursor-pointer',
                  'transition-colors duration-200 ease-out',
                  'hover:bg-ice-light',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
                )}
              >
                Jetzt starten
              </a>
              <a
                href={LOGIN_URL}
                onClick={onClose}
                className={cn(
                  'w-full block text-center font-sans font-medium text-sm tracking-wide uppercase',
                  'text-frost-secondary hover:text-frost-white',
                  'px-5 py-3 rounded-lg border border-frost-border-subtle min-h-[44px] cursor-pointer',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
                )}
              >
                Login
              </a>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Navbar ───────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { scrollY } = useScroll()

  // Track scroll threshold for state-based class switching
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 80)
  })

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Scroll-reactive background layer */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-300 ease-out',
          scrolled
            ? 'border-b border-frost-border-subtle'
            : 'border-b border-transparent',
        )}
        style={
          scrolled
            ? {
                background: 'rgba(15, 19, 24, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 1px 24px rgba(0,0,0,0.35)',
              }
            : {
                background: 'transparent',
              }
        }
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
            aria-label="ARCTIS — Home"
          >
            <IceCrystalIcon />
            <span className="font-display font-bold text-lg tracking-wide text-frost-white select-none">
              ARCTIS
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <NavLinkItem key={link.href} {...link} />
            ))}
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={LOGIN_URL}
              className={cn(
                'font-sans font-medium text-sm tracking-wide uppercase cursor-pointer rounded-sm',
                'text-frost-secondary hover:text-frost-white',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
              )}
            >
              Login
            </a>
            <a
              href={CHECKOUT_URL}
              className={cn(
                'group relative inline-flex items-center gap-1.5 cursor-pointer',
                'font-display font-semibold text-sm',
                'text-frost-white',
                'px-4 py-2 rounded-lg',
                'border border-frost-border-subtle hover:border-ice/60',
                'bg-frost-surface/40 hover:bg-frost-surface/70',
                'transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ice shadow-[0_0_8px_rgba(92,184,240,0.7)]" aria-hidden="true" />
              Jetzt starten
            </a>
          </div>

          {/* ── Mobile Hamburger ── */}
          <motion.button
            className="md:hidden relative flex items-center justify-center w-11 h-11 rounded-lg text-frost-secondary hover:text-frost-white hover:bg-frost-border-subtle transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            whileTap={{ scale: 0.92 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute"
                >
                  <X size={20} strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute"
                >
                  <Menu size={20} strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Mobile Menu Panel ── */}
        <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </motion.header>
  )
}
