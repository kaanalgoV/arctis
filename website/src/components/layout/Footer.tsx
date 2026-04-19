'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LOGIN_URL } from '@/lib/app-urls'

// ─── Logo ─────────────────────────────────────────────────────────────────────

function ArctisCrystal({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer crystal facets */}
      <polygon
        points="16,2 26,9 26,23 16,30 6,23 6,9"
        fill="none"
        stroke="rgba(92,184,240,0.7)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Inner facet lines */}
      <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
      <line x1="6" y1="9" x2="26" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
      <line x1="26" y1="9" x2="6" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
      {/* Center highlight */}
      <circle cx="16" cy="16" r="2.5" fill="rgba(92,184,240,0.6)" />
      <circle cx="16" cy="16" r="1" fill="#5CB8F0" />
    </svg>
  )
}

function FooterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <ArctisCrystal size={22} />
      <span className="font-display text-base font-semibold tracking-tight text-frost-white">
        Arctis
      </span>
    </div>
  )
}

// ─── Social Icons ─────────────────────────────────────────────────────────────

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Engine', href: '#engine' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Login', href: LOGIN_URL },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Support', href: 'mailto:support@arctis.app' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Imprint', href: '/imprint' },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(53,61,72,0.8) 20%, rgba(53,61,72,0.8) 80%, transparent 100%)',
      }}
    />
  )
}

function FooterColumnGroup() {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
      {/* Column 1 — Brand */}
      <div className="col-span-2 md:col-span-1">
        <FooterLogo />
        <p className="mt-2 text-xs leading-relaxed text-frost-muted">
          Analyse-Infrastruktur für Futures-Märkte.
        </p>
        {/* Social row */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Arctis on GitHub"
            className="cursor-pointer text-frost-muted transition-colors duration-200 hover:text-ice rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
          >
            <GithubIcon size={15} />
          </button>
          <button
            type="button"
            aria-label="Arctis on X / Twitter"
            className="cursor-pointer text-frost-muted transition-colors duration-200 hover:text-ice rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
          >
            <TwitterIcon size={15} />
          </button>
          <button
            type="button"
            aria-label="Arctis Discord community"
            className="cursor-pointer text-frost-muted transition-colors duration-200 hover:text-ice rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
          >
            <DiscordIcon size={15} />
          </button>
        </div>
      </div>

      {/* Columns 2-4 — Link groups */}
      {FOOTER_COLUMNS.map((col) => (
        <div key={col.heading}>
          <h3 className="font-sans mb-3 text-xs font-medium uppercase tracking-[0.12em] text-frost-muted">
            {col.heading}
          </h3>
          <ul className="space-y-2">
            {col.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-[13px] font-light text-frost-secondary/70 transition-colors duration-200 hover:text-ice cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Newsletter() {
  const [isInvalid, setIsInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = inputRef.current
    if (!input) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.value.trim())) {
      setIsInvalid(true)
      window.setTimeout(() => setIsInvalid(false), 600)
      return
    }
    // Valid — clear any error state; real submission handled elsewhere
    setIsInvalid(false)
  }

  return (
    <div>
      <style>{`
        @keyframes newsletterShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-newsletter-form] { animation: none !important; }
        }
      `}</style>
      <Divider />
      <div className="my-8 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left copy */}
        <div className="max-w-md">
          <p className="font-sans text-sm font-semibold text-frost-white">
            Platform Updates
          </p>
          <p className="mt-1 text-xs leading-relaxed text-frost-muted">
            Release Notes und Plattform-Neuigkeiten. Kein Marketing-Spam.
          </p>
        </div>

        {/* Right — email form with unified, polished surface */}
        <form
          data-newsletter-form
          onSubmit={handleSubmit}
          className={cn(
            'group flex w-full max-w-md items-stretch overflow-hidden rounded-xl',
            'border bg-arctic-secondary/60 backdrop-blur-sm',
            'transition-colors duration-200',
            'focus-within:border-ice/50 focus-within:bg-arctic-secondary',
            'focus-within:shadow-[0_0_0_3px_rgba(92,184,240,0.08)]',
            isInvalid ? 'border-loss' : 'border-frost-border-subtle',
          )}
          style={isInvalid ? { animation: 'newsletterShake 0.45s ease-in-out' } : undefined}
          aria-label="Newsletter signup"
          noValidate
        >
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            ref={inputRef}
            type="email"
            autoComplete="email"
            placeholder="trader@example.com"
            aria-invalid={isInvalid}
            onChange={() => isInvalid && setIsInvalid(false)}
            className={cn(
              'flex-1 bg-transparent px-4 py-2.5 text-sm text-frost-white placeholder:text-frost-muted',
              'outline-none border-0 min-h-[44px]',
            )}
          />
          <button
            type="submit"
            className={cn(
              'font-display cursor-pointer bg-ice',
              'px-5 py-2.5 text-sm font-semibold text-arctic-base min-h-[44px]',
              'transition-colors duration-200 hover:bg-ice-light',
              'border-l border-ice/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
            )}
          >
            Abonnieren
          </button>
        </form>
      </div>
    </div>
  )
}

function BottomBar() {
  return (
    <div>
      <Divider />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-frost-muted">
          &copy; 2026 Arctis. All rights reserved.
        </p>
        <nav aria-label="Legal links">
          <ul className="flex items-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Imprint', href: '/imprint' },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-xs text-frost-muted transition-colors duration-200 hover:text-frost-secondary cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer
      className="border-t bg-arctic-base"
      style={{ borderColor: 'rgba(39,47,58,0.5)' }}
    >
      <div className="section-container py-10 lg:py-14">
        <FooterColumnGroup />
        <Newsletter />
        <BottomBar />
      </div>
    </footer>
  )
}
