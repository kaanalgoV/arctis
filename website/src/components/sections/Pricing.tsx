'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHECKOUT_URL } from '@/lib/app-urls'
import {
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureGroup {
  label: string
  items: string[]
}

interface PricingTier {
  id: string
  icon: React.ComponentType<{ className?: string }>
  name: string
  tagline: string
  price: string | { monthly: string; annual: string }
  priceNote?: string | { annual: string }
  featureGroups: FeatureGroup[]
  cta: string
  highlighted?: boolean
}

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const tiers: PricingTier[] = [
  {
    id: 'pro',
    icon: Sparkles,
    name: 'Pro',
    tagline: 'Der gesamte Analyse-Stack für aktive Trader.',
    price: { monthly: '49€/Monat', annual: '39€/Monat' },
    priceNote: { annual: '468€/Jahr · spare 120€' },
    featureGroups: [
      {
        label: 'Analyse-Engine',
        items: [
          '5-Punkte Confluence-Score',
          'BIAS über 5 Zustände + Switch Level',
          'Cumulative Delta mit Divergenz-Warnung',
          'Volumenprofil (POC, VAH, VAL, Naked POCs)',
        ],
      },
      {
        label: 'Setups & Patterns',
        items: [
          '6 automatisch erkannte Setups (ORB, POC, VWAP, Fade, Breakout)',
          '2 Pattern-Detektoren (Double Fake, Opening Fake)',
          'Entry, Stop und Target — pro Setup berechnet',
        ],
      },
      {
        label: 'Daten & Tools',
        items: [
          'ES & NQ Live-Daten via Rithmic',
          'Replay-Modus mit Proberun',
          'Web App — keine Installation, keine Cloud-Daten',
          'Priority Support per Email & Discord',
        ],
      },
    ],
    cta: 'Jetzt starten',
    highlighted: true,
  },
  {
    id: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    tagline: 'Für Prop-Firms, Teams und Integrationen.',
    price: 'Custom',
    priceNote: 'Individuelles Angebot nach Gespräch',
    featureGroups: [
      {
        label: 'Inklusive',
        items: [
          'Alles aus Pro — für dein gesamtes Team',
          'Unbegrenzte Team-Seats',
          'On-Premise Deployment möglich',
        ],
      },
      {
        label: 'Enterprise-only',
        items: [
          'API & Webhook-Integrationen nach Mass',
          'Dedizierter Support-Ingenieur',
          'SLA mit 99.9% Uptime-Garantie',
        ],
      },
    ],
    cta: 'Kontakt aufnehmen',
  },
]

// ─── Billing Toggle ───────────────────────────────────────────────────────────

interface BillingToggleProps {
  isAnnual: boolean
  onToggle: (value: boolean) => void
}

function BillingToggle({ isAnnual, onToggle }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          'text-sm font-medium transition-colors duration-200',
          !isAnnual ? 'text-frost-white' : 'text-frost-muted'
        )}
      >
        Monatlich
      </span>

      <button
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className="relative flex items-center rounded-full bg-arctic-secondary p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
        style={{ width: 52, height: 28 }}
      >
        <motion.span
          layout
          layoutId="toggle-pill"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-1 size-5 rounded-full bg-ice"
          style={{ left: isAnnual ? 'calc(100% - 24px)' : 4 }}
          aria-hidden="true"
        />
        <span className="sr-only">
          {isAnnual ? 'Zu monatlicher Abrechnung wechseln' : 'Zu jährlicher Abrechnung wechseln'}
        </span>
      </button>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            isAnnual ? 'text-frost-white' : 'text-frost-muted'
          )}
        >
          Jährlich
        </span>
        <span className="rounded-full bg-profit/20 px-2 py-0.5 text-xs font-medium text-profit">
          20% sparen
        </span>
      </div>
    </div>
  )
}

// ─── Price Display ────────────────────────────────────────────────────────────

interface PriceDisplayProps {
  tier: PricingTier
  isAnnual: boolean
}

function PriceDisplay({ tier, isAnnual }: PriceDisplayProps) {
  const variablePrice =
    typeof tier.price === 'object' ? tier.price : null
  const displayPrice = variablePrice
    ? isAnnual
      ? variablePrice.annual
      : variablePrice.monthly
    : (tier.price as string)

  const isVariable = variablePrice !== null

  const showStrikethrough = isVariable && isAnnual
  const annualNote =
    typeof tier.priceNote === 'object' ? tier.priceNote.annual : null
  const staticNote =
    typeof tier.priceNote === 'string' ? tier.priceNote : null

  return (
    <div className="mt-6">
      <div className="flex items-end gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={`price-${tier.id}-${isAnnual ? 'annual' : 'monthly'}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="font-display text-5xl font-bold text-frost-white"
          >
            {displayPrice}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-1.5 flex flex-col gap-1 min-h-[20px]">
        {showStrikethrough && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-frost-muted line-through">49€/Monat</span>
            <span className="rounded-full bg-profit/20 px-2 py-0.5 text-xs font-medium text-profit">
              spare 20%
            </span>
          </div>
        )}
        {showStrikethrough && annualNote && (
          <span className="text-sm font-semibold text-ice">{annualNote}</span>
        )}
        {staticNote && (
          <span className="text-sm text-frost-muted">{staticNote}</span>
        )}
      </div>
    </div>
  )
}

// ─── Feature Group List ───────────────────────────────────────────────────────

interface FeatureListProps {
  groups: FeatureGroup[]
  accent: 'ice' | 'muted'
}

function FeatureList({ groups, accent }: FeatureListProps) {
  const checkClass = accent === 'ice' ? 'text-ice' : 'text-ice/55'
  return (
    <div className="mt-8 flex flex-1 flex-col gap-6">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-frost-border-subtle" aria-hidden="true" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-frost-muted">
              {group.label}
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className={cn('mt-0.5 size-4 shrink-0', checkClass)} strokeWidth={2.5} />
                <span className="text-sm leading-relaxed text-frost-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ─── Pro Tier Card ────────────────────────────────────────────────────────────

interface ProTierCardProps {
  tier: PricingTier
  isAnnual: boolean
}

function ProTierCard({ tier, isAnnual }: ProTierCardProps) {
  const Icon = tier.icon

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'glass-card frost-glow relative flex flex-col rounded-2xl p-8',
        'border-2 border-ice/30',
        // Ice-tinted overlay
        'bg-ice-subtle'
      )}
    >
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.7) 30%, rgba(125,211,252,0.9) 50%, rgba(92,184,240,0.7) 70%, transparent 100%)',
        }}
      >
        {/* Shimmer sweep — left-to-right 4s infinite */}
        <div
          data-pro-shimmer
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/3"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            animation: 'proAccentShimmer 4s linear infinite',
          }}
        />
      </div>

      {/* Most Popular badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-ice px-4 py-1.5 font-display text-xs font-semibold text-arctic-base">
          Für aktive Trader
        </span>
      </div>

      {/* Subtle radial background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(92,184,240,0.1) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.18)] p-3 w-fit">
          <Icon className="size-5 text-ice" />
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <p className="font-display text-xl font-semibold text-frost-white">
            {tier.name}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ice/60">
            Empfohlen
          </span>
        </div>
        <p className="mt-1 text-sm text-frost-muted">{tier.tagline}</p>

        <PriceDisplay tier={tier} isAnnual={isAnnual} />

        <FeatureList groups={tier.featureGroups} accent="ice" />

        <motion.a
          href={CHECKOUT_URL}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'mt-8 w-full block text-center rounded-xl bg-ice px-6 py-3 min-h-[44px] cursor-pointer',
            'font-display text-sm font-semibold text-arctic-base',
            'transition-colors duration-200',
            'hover:bg-ice-light',
            'shadow-[0_0_24px_rgba(92,184,240,0.25)]',
            'hover:shadow-[0_0_32px_rgba(92,184,240,0.4)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base'
          )}
        >
          {tier.cta}
        </motion.a>

        {/* Money-back guarantee — strongest conversion lever */}
        <div
          data-guarantee
          className="mt-4 rounded-lg border border-profit/20 bg-profit/5 px-3 py-2 text-center"
          style={{ animation: 'guaranteePulse 3.2s ease-in-out 0.6s 3' }}
        >
          <p className="font-display text-xs font-semibold text-profit">
            14 Tage Geld-zurück-Garantie
          </p>
          <p className="mt-0.5 text-[11px] text-frost-muted">
            Nicht überzeugt? Volle Rückerstattung, keine Fragen.
          </p>
        </div>

        {/* Trust signals */}
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-frost-muted">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-profit" aria-hidden="true" />
            Jederzeit kündbar
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-profit" aria-hidden="true" />
            Daten bleiben lokal
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-profit" aria-hidden="true" />
            SEPA & Kreditkarte
          </li>
        </ul>
      </div>
    </motion.div>
  )
}

// ─── Enterprise Tier Card ─────────────────────────────────────────────────────

interface EnterpriseTierCardProps {
  tier: PricingTier
  isAnnual: boolean
}

function EnterpriseTierCard({ tier, isAnnual }: EnterpriseTierCardProps) {
  const Icon = tier.icon

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card flex flex-col rounded-2xl p-8"
    >
      <div className="inline-flex items-center justify-center rounded-lg bg-[rgba(92,184,240,0.1)] p-3 w-fit">
        <Icon className="size-5 text-ice/60" />
      </div>

      <p className="mt-5 font-display text-xl font-semibold text-frost-white">
        {tier.name}
      </p>
      <p className="mt-1 text-sm text-frost-muted">{tier.tagline}</p>

      <PriceDisplay tier={tier} isAnnual={isAnnual} />

      <FeatureList groups={tier.featureGroups} accent="muted" />

      <a
        href="mailto:support@arctis.app"
        className={cn(
          'mt-8 w-full block text-center rounded-xl border border-frost-border px-6 py-3 min-h-[44px] cursor-pointer',
          'font-display text-sm font-medium text-frost-white',
          'transition-colors duration-200',
          'hover:border-frost-secondary hover:bg-arctic-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base'
        )}
      >
        {tier.cta}
      </a>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-frost-muted">
        <li>Anruf oder Email — unverbindlich</li>
      </ul>
    </motion.div>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="section-padding relative">
      <style>{`
        @keyframes proAccentShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes guaranteePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
          50% { box-shadow: 0 0 18px rgba(52,211,153,0.18); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-pro-shimmer], [data-guarantee] { animation: none !important; }
        }
      `}</style>
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '900px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(92,184,240,0.04) 0%, transparent 65%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          className="mb-10 text-center lg:mb-12"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <p className="mb-4 text-ice text-sm font-medium uppercase tracking-[0.15em]">
            Pricing
          </p>
          <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl">
            Transparente Preise.{' '}
            <span className="text-gradient-frost">Keine Überraschungen.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-frost-secondary">
            Wähle den Plan der zu deinem Trading passt. Jederzeit upgraden oder kündigen.
          </p>
        </motion.div>

        {/* ── Billing Toggle ── */}
        <motion.div
          className="mb-12 flex justify-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </motion.div>

        {/* ── Pricing Cards ── */}
        <div className="relative">
          {/* Radial blob behind Pro card */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.03] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(90,174,216,0.4), transparent 70%)',
            }}
          />
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-3xl mx-auto lg:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {tiers.map((tier) => {
            if (tier.id === 'pro') {
              return (
                <ProTierCard key={tier.id} tier={tier} isAnnual={isAnnual} />
              )
            }
            return (
              <EnterpriseTierCard
                key={tier.id}
                tier={tier}
                isAnnual={isAnnual}
              />
            )
          })}
        </motion.div>
        </div>

        {/* ── Bottom Note ── */}
        <motion.p
          className="mt-8 text-center text-sm text-frost-muted"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          Alle Pläne inkl. automatischer Updates. Keine Trading-Daten auf externen Servern.
        </motion.p>
      </div>
    </section>
  )
}
