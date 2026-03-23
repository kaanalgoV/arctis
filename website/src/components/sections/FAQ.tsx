'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/animations'

// ─── FAQ Data ────────────────────────────────────────────────────────────────

interface FAQItem {
  id: string
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'markets',
    question: 'What markets does Arctis support?',
    answer:
      'Arctis currently supports 21 futures markets including ES (S&P 500), NQ (Nasdaq 100), CL (Crude Oil), GC (Gold), and major currency futures. We\'re adding more markets every quarter based on user demand.',
  },
  {
    id: 'data-feed',
    question: 'Do I need a data feed subscription?',
    answer:
      'Arctis connects to your existing data provider. We support Rithmic, Tradovate, and direct exchange connections. If you already have a funded trading account, you likely already have the data access you need.',
  },
  {
    id: 'bias-module',
    question: 'How is the BIAS module different from a moving average crossover?',
    answer:
      'The BIAS module analyzes 7 independent factors including volume profile, session structure, momentum divergence, and order flow imbalance — not just price crossovers. It produces a directional score that adapts to current market regime.',
  },
  {
    id: 'platforms',
    question: 'Is Arctis available on Mac and Windows?',
    answer:
      'Yes. Arctis is built with Tauri, delivering native performance on both macOS and Windows. The app weighs under 15MB and uses significantly less memory than Electron-based alternatives.',
  },
  {
    id: 'latency',
    question: "What's the latency for real-time data?",
    answer:
      'P95 latency is under 50 milliseconds from exchange feed to rendered display. The Rust-based backend minimizes processing overhead at every layer of the data pipeline.',
  },
  {
    id: 'backtesting',
    question: 'Can I use Arctis for backtesting?',
    answer:
      'Yes. The analysis engine includes a backtesting module that replays historical data through the same BIAS, confluence, and pattern detection algorithms you use live. Results include detailed trade logs and performance metrics.',
  },
  {
    id: 'data-privacy',
    question: 'Is my trading data stored on your servers?',
    answer:
      'Arctis processes all data locally on your machine. No trading data, positions, or account information is transmitted to or stored on external servers.',
  },
  {
    id: 'free-tier',
    question: 'What happens when my free trial ends?',
    answer:
      'The Free tier has no expiration date. You retain permanent access to 3 markets and core features. Pro capabilities become available when you upgrade.',
  },
  {
    id: 'cancel',
    question: 'How do I cancel my Pro subscription?',
    answer:
      'Navigate to Settings, then Billing, then Cancel. Your Pro features remain active through the end of the current billing period. No additional steps required.',
  },
  {
    id: 'api',
    question: 'Is there an API for custom integrations?',
    answer:
      'Enterprise plans include full API access for custom integrations with your existing trading infrastructure, risk systems, and reporting tools. Contact our team to discuss your requirements.',
  },
]

// ─── Accordion Item ───────────────────────────────────────────────────────────

interface AccordionItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="border-b border-frost-border-subtle/50 last:border-b-0"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between py-5 text-left"
      >
        <span
          className={cn(
            'font-display text-base font-medium transition-colors duration-200 sm:text-lg',
            isOpen
              ? 'text-ice-light'
              : 'text-frost-white group-hover:text-ice-light',
          )}
        >
          {item.question}
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'ml-4 shrink-0 transition-colors duration-200',
            isOpen ? 'text-ice' : 'text-frost-muted group-hover:text-frost-secondary',
          )}
          aria-hidden="true"
        >
          <ChevronDown size={20} strokeWidth={1.75} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pt-1 text-sm leading-relaxed text-frost-secondary sm:text-base">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="lg:sticky lg:top-28 lg:self-start"
    >
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
        FAQ
      </p>

      <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl">
        Frequently asked{' '}
        <span className="text-gradient-frost">questions.</span>
      </h2>

      <p className="mt-4 max-w-sm text-base leading-relaxed text-frost-secondary">
        Everything you need to know about Arctis. Can&apos;t find what you&apos;re
        looking for?
      </p>

      <div className="mt-6">
        <a
          href="mailto:support@arctis.app"
          className={cn(
            'inline-flex items-center gap-1.5',
            'text-sm font-medium text-ice underline underline-offset-4',
            'transition-colors duration-200 hover:text-ice-light',
          )}
        >
          Contact Support
        </a>
      </div>

      {/* Decorative accent line */}
      <div
        aria-hidden="true"
        className="mt-10 hidden h-px max-w-[120px] lg:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(92,184,240,0.5) 0%, transparent 100%)',
        }}
      />
    </motion.div>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function handleToggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section id="faq" className="section-padding relative">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '30%',
            transform: 'translate(-50%, -50%)',
            width: '900px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(92,184,240,0.035) 0%, transparent 65%)',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        {/* ── Mobile / Tablet: stacked header ── */}
        <div className="mb-10 lg:hidden">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-ice">
              FAQ
            </p>
            <h2 className="font-display text-3xl font-bold text-frost-white sm:text-4xl">
              Questions?{' '}
              <span className="text-gradient-frost">We&apos;ve got answers.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-frost-secondary">
              Everything you need to know about Arctis.{' '}
              <a
                href="mailto:support@arctis.app"
                className="text-ice underline underline-offset-4 transition-colors duration-200 hover:text-ice-light"
              >
                Contact Support
              </a>{' '}
              if you can&apos;t find what you&apos;re looking for.
            </p>
          </motion.div>
        </div>

        {/* ── Two-column layout (desktop) ── */}
        <div className="lg:grid lg:grid-cols-[1fr_1.6fr] lg:gap-20 xl:gap-28">
          {/* Left: Sticky header + CTA — hidden on mobile (rendered above) */}
          <div className="hidden lg:block">
            <LeftPanel />
          </div>

          {/* Right: Accordion */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="divide-y-0"
          >
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
