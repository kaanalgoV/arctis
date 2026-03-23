'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Building2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingTier {
  id: string
  icon: React.ComponentType<{ className?: string }>
  name: string
  price: string | { monthly: string; annual: string }
  priceNote?: string | { annual: string }
  features: string[]
  cta: string
  highlighted?: boolean
}

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const tiers: PricingTier[] = [
  {
    id: 'free',
    icon: Zap,
    name: 'Free',
    price: '$0',
    priceNote: 'No time limit',
    features: [
      '3 markets (ES, NQ, CL)',
      'Real-time charts',
      'Basic session analytics',
      'Community support',
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    icon: Sparkles,
    name: 'Pro',
    price: { monthly: '$49/mo', annual: '$39/mo' },
    priceNote: { annual: 'billed annually' },
    features: [
      'All 21 markets',
      'BIAS analysis module',
      'Confluence scoring',
      'Pattern detection',
      'Risk framework',
      'Priority support',
      'Desktop app (macOS/Windows)',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'For firms and teams',
    features: [
      'Unlimited team seats',
      'Custom integrations',
      'Dedicated support engineer',
      'SLA guarantees',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
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
        Monthly
      </span>

      <button
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className="relative flex items-center rounded-full bg-arctic-secondary p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base"
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
          {isAnnual ? 'Switch to monthly billing' : 'Switch to annual billing'}
        </span>
      </button>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            isAnnual ? 'text-frost-white' : 'text-frost-muted'
          )}
        >
          Annual
        </span>
        <span className="rounded-full bg-profit/20 px-2 py-0.5 text-xs font-medium text-profit">
          Save 20%
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

      <div className="mt-1.5 flex items-center gap-2 min-h-[20px]">
        {showStrikethrough && (
          <span className="text-sm text-frost-muted line-through">$49</span>
        )}
        {showStrikethrough && annualNote && (
          <span className="text-xs text-frost-muted">{annualNote}</span>
        )}
        {staticNote && (
          <span className="text-sm text-frost-muted">{staticNote}</span>
        )}
      </div>
    </div>
  )
}

// ─── Free Tier Card ───────────────────────────────────────────────────────────

interface FreeTierCardProps {
  tier: PricingTier
  isAnnual: boolean
}

function FreeTierCard({ tier, isAnnual }: FreeTierCardProps) {
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

      <PriceDisplay tier={tier} isAnnual={isAnnual} />

      <ul className="mt-8 flex flex-col gap-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-ice/60" />
            <span className="text-sm text-frost-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={cn(
          'mt-8 w-full rounded-xl border border-frost-border px-6 py-3',
          'font-display text-sm font-medium text-frost-white',
          'transition-colors duration-200',
          'hover:border-frost-secondary hover:bg-arctic-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base'
        )}
      >
        {tier.cta}
      </button>
    </motion.div>
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
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.7) 30%, rgba(125,211,252,0.9) 50%, rgba(92,184,240,0.7) 70%, transparent 100%)',
        }}
      />

      {/* Most Popular badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-ice px-4 py-1.5 font-display text-xs font-semibold text-arctic-base">
          Most Popular
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

        <p className="mt-5 font-display text-xl font-semibold text-frost-white">
          {tier.name}
        </p>

        <PriceDisplay tier={tier} isAnnual={isAnnual} />

        <ul className="mt-8 flex flex-col gap-3 flex-1">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-ice" />
              <span className="text-sm text-frost-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'mt-8 w-full rounded-xl bg-ice px-6 py-3',
            'font-display text-sm font-semibold text-arctic-base',
            'transition-colors duration-200',
            'hover:bg-ice-light',
            'shadow-[0_0_24px_rgba(92,184,240,0.25)]',
            'hover:shadow-[0_0_32px_rgba(92,184,240,0.4)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base'
          )}
        >
          {tier.cta}
        </motion.button>
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

      <PriceDisplay tier={tier} isAnnual={isAnnual} />

      <ul className="mt-8 flex flex-col gap-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-ice/60" />
            <span className="text-sm text-frost-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={cn(
          'mt-8 w-full rounded-xl border border-frost-border px-6 py-3',
          'font-display text-sm font-medium text-frost-white',
          'transition-colors duration-200',
          'hover:border-frost-secondary hover:bg-arctic-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base'
        )}
      >
        {tier.cta}
      </button>
    </motion.div>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="section-padding relative">
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
            Transparent pricing.{' '}
            <span className="text-gradient-frost">No surprises.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-frost-secondary">
            Choose the plan that matches your trading operation. Upgrade or downgrade at any time.
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
          className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8"
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
            if (tier.id === 'enterprise') {
              return (
                <EnterpriseTierCard
                  key={tier.id}
                  tier={tier}
                  isAnnual={isAnnual}
                />
              )
            }
            return (
              <FreeTierCard key={tier.id} tier={tier} isAnnual={isAnnual} />
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
          All plans include automatic updates. No trading data is stored on external servers.
        </motion.p>
      </div>
    </section>
  )
}
