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
      'Die Setup-Erkennung (ORB, IB, POC, VA) liefert Entry, Stop und Target mit berechnetem R:R. Die historische Trefferquote liegt bei ca. 60-70% — aber nur wenn der Confluence-Score über 50 ist.',
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
            'inline-flex items-center gap-1.5',
            'text-sm font-medium text-ice underline underline-offset-4',
            'transition-colors duration-200 hover:text-ice-light',
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
