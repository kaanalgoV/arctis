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
    id: 'profitability',
    question: 'Macht mich Arctis wirklich profitabler?',
    answer:
      'Arctis ersetzt kein Trading-Wissen — aber es macht deine Analyse objektiv und konsistent. Trader berichten von besserer Win-Rate und weniger emotionalen Fehlentscheidungen.',
  },
  {
    id: 'already-profitable',
    question: 'Ich bin schon profitabel. Bringt mir das trotzdem was?',
    answer:
      'Ja. Profitablen Tradern hilft Arctis am meisten beim Zeitsparen (14 statt 42 Min Pre-Market) und bei der Vermeidung von B-Setups. Du nimmst nur noch die besten Trades.',
  },
  {
    id: 'bias-score',
    question: 'Was bedeutet der BIAS-Score konkret?',
    answer:
      'Der Score von -10 bis +10 zeigt die Tagesrichtung. Positiv = Long-Bias, negativ = Short-Bias. Über +5 oder unter -5 ist ein starker Trend. Um 0 herum: Range-Tag, handle die Kanten.',
  },
  {
    id: 'signal-accuracy',
    question: 'Wie genau sind die Setup-Signale?',
    answer:
      'Arctis erkennt 7 datengetriebene Setups (ORB Breakout, MBO Confluence, Daily Breakout, POC Rejection, VWAP Mean Reversion, Session Fade, Sammelzonen-Ausbruch) plus 2 Pattern-Detektoren (Double Fake, Opening Fake). Jedes Setup liefert Entry, Stop und Target mit berechnetem R:R. Backtest-Kalibrierung auf 4,398 echten Trades über 8 Monate (Aug 2025 – März 2026) auf NQ-Futures: MBO Confluence 40.4% WR · PF 1.59 (n=1005), Daily Breakout 48.4% WR · PF 1.62 (n=188), Arctis Double Fake 45.8% WR · PF 1.74 (n=48), Opening Fake 16% WR · PF 3.83 bei R:R 6.72 (n=50, extreme Payoff). Aggressive Win-Rate-Claims wie 80%+ sind bewusst ausgelassen — kein Futures-Pattern erreicht das nachhaltig. Signale greifen nur bei Confluence ab Score 3.',
  },
  {
    id: 'markets',
    question: 'Welche Märkte werden unterstützt?',
    answer:
      'ES (S&P 500 E-mini) und NQ (Nasdaq 100 E-mini) — die liquidesten Index-Futures. Optimale Bedingungen für unsere Analyse.',
  },
  {
    id: 'data-feed',
    question: 'Brauche ich einen separaten Datenfeed?',
    answer:
      'Ja, Arctis verbindet sich über Rithmic mit der Börse. Du brauchst einen Rithmic-kompatiblen Broker (z.B. AMP, Optimus, Tradovate).',
  },
  {
    id: 'platforms',
    question: 'Läuft Arctis auf Mac und Windows?',
    answer:
      'Ja — Arctis läuft auf macOS und Windows. Die App ist unter 15 MB groß und läuft komplett lokal — keine Cloud, keine Verzögerung.',
  },
  {
    id: 'pricing',
    question: 'Was kostet es?',
    answer:
      'Pro: 49€/Monat (oder 39€ jährlich). Kein Free-Tier, keine abgespeckte Version. Du bekommst alles vom ersten Tag.',
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
      className={cn(
        'relative border-b border-frost-border-subtle/50 last:border-b-0',
        'transition-colors duration-300',
        isOpen && 'bg-gradient-to-r from-ice/[0.03] to-transparent',
      )}
    >
      {/* Left accent line when open */}
      <motion.div
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-ice"
        initial={false}
        animate={{ scaleY: isOpen ? 1 : 0, opacity: isOpen ? 0.7 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformOrigin: 'center' }}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'group flex w-full items-center justify-between py-5 pr-2 text-left cursor-pointer rounded-md',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
          !isOpen && 'hover:pl-3',
        )}
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
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.05 : 1,
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'ml-4 shrink-0 flex items-center justify-center rounded-full',
            'h-8 w-8 border transition-colors duration-200',
            isOpen
              ? 'border-ice/40 bg-ice/10 text-ice'
              : 'border-frost-border-subtle/70 text-frost-muted group-hover:border-ice/30 group-hover:text-frost-secondary',
          )}
          aria-hidden="true"
        >
          <ChevronDown size={16} strokeWidth={2} />
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
            <p className="max-w-2xl pb-6 pt-1 text-sm text-frost-secondary sm:text-base" style={{ lineHeight: 1.7 }}>
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
        Deine Fragen,{' '}
        <span className="text-gradient-frost">beantwortet.</span>
      </h2>

      <p className="mt-4 max-w-sm text-base leading-relaxed text-frost-secondary">
        Alles was du wissen musst, bevor du anfängst. Nicht gefunden was du suchst?
      </p>

      <div className="mt-6">
        <a
          href="mailto:support@arctis.app"
          className={cn(
            'inline-flex items-center gap-1.5 cursor-pointer rounded-sm',
            'text-sm font-medium text-ice underline underline-offset-4',
            'transition-colors duration-200 hover:text-ice-light',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-base',
          )}
        >
          Support kontaktieren
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
              Deine Fragen,{' '}
              <span className="text-gradient-frost">beantwortet.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-frost-secondary">
              Alles was du wissen musst, bevor du anfängst.{' '}
              <a
                href="mailto:support@arctis.app"
                className="text-ice underline underline-offset-4 transition-colors duration-200 hover:text-ice-light"
              >
                Support kontaktieren
              </a>{' '}
              falls du nicht findest was du suchst.
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
