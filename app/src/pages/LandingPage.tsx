import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, animate, useScroll, useTransform, AnimatePresence, type MotionValue } from 'framer-motion'
import {
  ArrowRight, Download, ChevronDown, TrendingUp, Check, X, Minus, Clock,
  Star, Quote, LineChart, Layers, Search, ShieldCheck, Sparkles, Building2,
  BarChart2, BarChart3, Shield, Zap, Globe, Activity,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ── Animation Variants ────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const blurReveal = {
  hidden: { opacity: 0, filter: 'blur(12px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.95 } },
}

const heroTextReveal = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.0 } },
}

const heroImageReveal = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, delay: 0.4 } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const viewportOnce = { once: true, margin: '-80px' }
const viewportOnceNear = { once: true, margin: '-40px' }

// ── Section Divider ───────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div
      className="h-px w-full"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(92,184,240,0.15), transparent)' }}
    />
  )
}

// ── Animated Counter ──────────────────────────────────────────────────────────

type CounterConfig =
  | { type: 'integer'; target: number; prefix?: string; suffix?: string }
  | { type: 'decimal'; target: number; decimals: number; prefix?: string; suffix?: string }
  | { type: 'static'; display: string }

function useAnimatedCounter(config: CounterConfig, inView: boolean) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    if (!ref.current) return
    if (config.type === 'static') {
      ref.current.textContent = config.display
      return
    }
    const prefix = config.prefix ?? ''
    const suffix = config.suffix ?? ''
    if (config.type === 'decimal') {
      ref.current.textContent = `${prefix}0.${'0'.repeat(config.decimals)}${suffix}`
    } else {
      ref.current.textContent = `${prefix}0${suffix}`
    }
  }, [config])

  useEffect(() => {
    if (!inView || config.type === 'static') return
    const target = config.target
    const controls = animate(motionValue, target, { duration: 2, ease: 'easeOut' })
    const unsub = motionValue.on('change', (latest) => {
      if (!ref.current) return
      const prefix = config.prefix ?? ''
      const suffix = config.suffix ?? ''
      if (config.type === 'decimal') {
        ref.current.textContent = `${prefix}${latest.toFixed(config.decimals)}${suffix}`
      } else {
        ref.current.textContent = `${prefix}${new Intl.NumberFormat('en-US').format(Math.round(latest))}${suffix}`
      }
    })
    return () => { controls.stop(); unsub() }
  }, [inView, config, motionValue])

  return { ref }
}

// ── LandingNavbar ─────────────────────────────────────────────────────────────

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,11,16,0.92)' : 'rgba(8,11,16,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(92,184,240,0.1)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon points="16,2 26,9 26,23 16,30 6,23 6,9" fill="none" stroke="rgba(92,184,240,0.7)" strokeWidth="1.4" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <line x1="6" y1="9" x2="26" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <line x1="26" y1="9" x2="6" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="2.5" fill="rgba(92,184,240,0.6)" />
            <circle cx="16" cy="16" r="1" fill="#5CB8F0" />
          </svg>
          <span className="font-display font-semibold tracking-widest text-sm" style={{ color: 'var(--color-text-primary)', letterSpacing: '0.2em' }}>
            ARCTIS
          </span>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {['Features', 'Pricing'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm transition-colors duration-150"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="/"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: 'rgba(92,184,240,0.12)',
            border: '1px solid rgba(92,184,240,0.25)',
            color: 'var(--color-accent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(92,184,240,0.2)'
            e.currentTarget.style.borderColor = 'rgba(92,184,240,0.45)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(92,184,240,0.12)'
            e.currentTarget.style.borderColor = 'rgba(92,184,240,0.25)'
          }}
        >
          App öffnen
        </a>
      </div>
    </header>
  )
}

// ── Hero Candlestick Chart ────────────────────────────────────────────────────

const HERO_CANDLES = [
  { open: 38, close: 52, high: 56, low: 34, bull: true },
  { open: 52, close: 44, high: 55, low: 41, bull: false },
  { open: 44, close: 58, high: 62, low: 41, bull: true },
  { open: 58, close: 50, high: 61, low: 47, bull: false },
  { open: 50, close: 66, high: 70, low: 48, bull: true },
  { open: 66, close: 80, high: 84, low: 64, bull: true },
  { open: 80, close: 72, high: 83, low: 69, bull: false },
  { open: 72, close: 88, high: 93, low: 70, bull: true },
  { open: 88, close: 94, high: 98, low: 85, bull: true },
  { open: 94, close: 84, high: 96, low: 81, bull: false },
  { open: 84, close: 78, high: 86, low: 75, bull: false },
  { open: 78, close: 92, high: 96, low: 76, bull: true },
  { open: 92, close: 86, high: 94, low: 83, bull: false },
  { open: 86, close: 104, high: 109, low: 84, bull: true },
  { open: 104, close: 112, high: 116, low: 101, bull: true },
  { open: 112, close: 100, high: 114, low: 97, bull: false },
  { open: 100, close: 118, high: 123, low: 98, bull: true },
  { open: 118, close: 108, high: 120, low: 105, bull: false },
  { open: 108, close: 126, high: 131, low: 106, bull: true },
  { open: 126, close: 120, high: 128, low: 117, bull: false },
  { open: 120, close: 138, high: 143, low: 118, bull: true },
  { open: 138, close: 144, high: 148, low: 135, bull: true },
  { open: 144, close: 132, high: 146, low: 129, bull: false },
  { open: 132, close: 128, high: 134, low: 125, bull: false },
  { open: 128, close: 150, high: 155, low: 126, bull: true },
  { open: 150, close: 158, high: 162, low: 147, bull: true },
  { open: 158, close: 148, high: 160, low: 145, bull: false },
  { open: 148, close: 164, high: 169, low: 146, bull: true },
  { open: 164, close: 172, high: 176, low: 161, bull: true },
  { open: 172, close: 166, high: 174, low: 163, bull: false },
]

const HERO_VOLUMES = [
  0.35, 0.28, 0.42, 0.31, 0.55,
  0.72, 0.48, 0.65, 0.80, 0.44,
  0.38, 0.61, 0.40, 0.88, 0.75,
  0.52, 0.82, 0.46, 0.79, 0.41,
  0.90, 0.84, 0.56, 0.50, 0.94,
  0.86, 0.60, 0.91, 0.88, 0.52,
]

const EMA_POINTS = [45,49,51,55,58,66,70,76,85,86,82,84,86,94,105,104,110,112,118,120,128,136,138,133,138,148,151,154,162,166]

const CHART_H = 148
const CHART_MAX = 185
const CHART_MIN = 20

function HeroCandlestickChart() {
  const CANDLE_W = 9
  const CANDLE_GAP = 3
  const STEP = CANDLE_W + CANDLE_GAP
  const totalW = HERO_CANDLES.length * STEP - CANDLE_GAP

  const scaleY = (val: number) => {
    const range = CHART_MAX - CHART_MIN
    return CHART_H - ((val - CHART_MIN) / range) * CHART_H
  }

  const emaPath = EMA_POINTS.reduce((path, val, i) => {
    const x = i * STEP + CANDLE_W / 2
    const y = scaleY(val)
    if (i === 0) return `M ${x} ${y}`
    const prev = EMA_POINTS[i - 1]
    const prevX = (i - 1) * STEP + CANDLE_W / 2
    const prevY = scaleY(prev)
    const cx1 = prevX + STEP * 0.5
    const cx2 = x - STEP * 0.5
    return `${path} C ${cx1} ${prevY}, ${cx2} ${y}, ${x} ${y}`
  }, '')

  return (
    <svg viewBox={`0 0 ${totalW} ${CHART_H}`} preserveAspectRatio="none" className="w-full" style={{ height: CHART_H }} aria-hidden="true">
      {[0.2, 0.4, 0.6, 0.8].map((frac) => (
        <line key={frac} x1="0" y1={CHART_H * frac} x2={totalW} y2={CHART_H * frac} stroke="rgba(92,184,240,0.04)" strokeWidth="1" />
      ))}
      <path d={emaPath} fill="none" stroke="rgba(92,184,240,0.30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={0} y={scaleY(105)} width={totalW} height={scaleY(88) - scaleY(105)} fill="rgba(92,184,240,0.025)" />
      <line x1="0" y1={scaleY(105)} x2={totalW} y2={scaleY(105)} stroke="rgba(92,184,240,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />
      {HERO_CANDLES.map((c, i) => {
        const x = i * STEP
        const cx = x + CANDLE_W / 2
        const color = c.bull ? '#34D399' : '#F87171'
        const bodyTop = scaleY(Math.max(c.open, c.close))
        const bodyBot = scaleY(Math.min(c.open, c.close))
        const bodyH = Math.max(1.5, bodyBot - bodyTop)
        return (
          <g key={i}>
            <line x1={cx} y1={scaleY(c.high)} x2={cx} y2={scaleY(c.low)} stroke={color} strokeWidth="0.8" opacity="0.55" />
            <rect x={x} y={bodyTop} width={CANDLE_W} height={bodyH} rx="1.5" fill={color} opacity={c.bull ? 0.82 : 0.72} />
          </g>
        )
      })}
      <line x1="0" y1={scaleY(166)} x2={totalW} y2={scaleY(166)} stroke="rgba(52,211,153,0.35)" strokeWidth="0.6" strokeDasharray="3 3" />
    </svg>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const dashY = useTransform(scrollYProgress, [0, 1], [0, 60])

  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true })
  const { ref: traderCountRef } = useAnimatedCounter({ type: 'integer', target: 12400, suffix: '+' }, statsInView)

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden pt-24 pb-16"
      style={{ background: 'var(--color-arctic-base)' }}
    >
      {/* ── ATMOSPHERIC BACKGROUND ── */}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ y: bgY }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 15%, rgba(92,184,240,0.08) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 85%, rgba(92,184,240,0.05) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 42%, rgba(92,184,240,0.03) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(92,184,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(92,184,240,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </motion.div>

      {/* ── CONTENT: TWO COLUMNS ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start pt-8 lg:pt-16">

          {/* LEFT COLUMN — 7/12 */}
          <div className="lg:col-span-7 flex flex-col space-y-8">

            {/* Badge */}
            <motion.div variants={blurReveal} initial="hidden" animate="visible">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#272F3A] bg-[rgba(15,19,24,0.8)] px-4 py-2 backdrop-blur-xl">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#5CB8F0', boxShadow: '0 0 6px rgba(92,184,240,0.8)', animation: 'pulse-glow 2s ease-in-out infinite' }}
                />
                <span className="text-sm font-medium tracking-wide" style={{ color: 'var(--color-frost-secondary)' }}>
                  Von Prop-Tradern für Prop-Trader
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroTextReveal}
              initial="hidden"
              animate="visible"
              className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              <span style={{ color: 'var(--color-frost-white)' }}>Wisse welche Seite{'\n'}du handelst.</span>
              <br />
              <span className="text-gradient-frost">Bevor die Glocke läutet.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
              className="max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--color-frost-secondary)' }}
            >
              Arctis analysiert NQ und ES in Echtzeit — BIAS, Confluence, Setups — und sagt dir genau: Entry, Stop, Target. In 14 Minuten bist du bereit für den Trade.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-wrap items-center gap-4">
              <motion.button
                variants={staggerItem}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="font-display group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200"
                style={{ background: 'var(--color-accent)', color: 'var(--color-arctic-base)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(92,184,240,0.2), 0 0 120px rgba(92,184,240,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Download size={18} strokeWidth={2.2} />
                Jetzt starten
                <ArrowRight size={16} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </motion.button>

              <motion.button
                variants={staggerItem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="font-display group flex cursor-pointer items-center gap-2.5 rounded-xl border px-8 py-4 text-lg font-medium transition-all duration-200"
                style={{ borderColor: 'rgba(53,61,72,1)', color: 'var(--color-frost-white)', background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(92,184,240,0.3)'
                  e.currentTarget.style.background = 'rgba(92,184,240,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(53,61,72,1)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current opacity-70 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={12} strokeWidth={2.5} />
                </span>
                Live Demo ansehen
              </motion.button>
            </motion.div>

            {/* Trust line */}
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.55 }}
              className="text-sm"
              style={{ color: 'var(--color-frost-muted)' }}
            >
              Kein Abo nötig zum Testen&nbsp;&middot;&nbsp;macOS Desktop App&nbsp;&middot;&nbsp;Deine Daten bleiben lokal
            </motion.p>

            {/* Mini stats row */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.65 }}
              className="flex items-center gap-8 pt-2"
            >
              {[
                { value: '89%', label: 'Trefferquote' },
                { value: '14 Min', label: 'Pre-Market' },
                { value: '3.2', label: 'Avg R:R' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-frost-white)' }}>{stat.value}</span>
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-frost-muted)' }}>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT COLUMN — 5/12 */}
          <div ref={statsRef} className="lg:col-span-5 space-y-6 lg:mt-12 lg:pt-4">

            {/* STATS GLASS CARD */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
            >
              {/* Card glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Header: icon + big number */}
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/20"
                    style={{ background: 'rgba(92,184,240,0.15)' }}
                  >
                    <BarChart3 className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <div ref={traderCountRef} className="font-display text-3xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--color-frost-white)' }} aria-live="polite" />
                    <div className="text-sm" style={{ color: 'var(--color-frost-muted)' }}>Aktive Trader</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-frost-muted)' }}>Setup-Trefferquote</span>
                    <span className="font-medium" style={{ color: 'var(--color-frost-white)' }}>89%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(92,184,240,0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--color-accent), #8DD4FF)' }}
                      initial={{ width: 0 }}
                      animate={statsInView ? { width: '89%' } : {}}
                      transition={{ duration: 1.5, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                </div>

                <div className="h-px w-full mb-6" style={{ background: 'rgba(255,255,255,0.08)' }} />

                {/* Mini stats grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: '14 Min', label: 'Pre-Market' },
                    { value: '3.2', label: 'Avg R:R' },
                    { value: '87%', label: 'Confluence' },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1">
                      <span className="font-display text-xl font-bold" style={{ color: 'var(--color-frost-white)' }}>{s.value}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-frost-muted)' }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Tag pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide" style={{ color: 'var(--color-frost-secondary)' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#34D399' }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#34D399' }} />
                    </span>
                    LIVE
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide" style={{ color: 'var(--color-frost-secondary)' }}>
                    <Shield className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
                    FUNDED READY
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide" style={{ color: 'var(--color-frost-secondary)' }}>
                    <Zap className="w-3 h-3" style={{ color: '#FBBF24' }} />
                    NQ &amp; ES
                  </div>
                </div>
              </div>
            </motion.div>

            {/* MARQUEE GLASS CARD */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl"
            >
              <h3 className="mb-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-frost-muted)' }}>
                Kompatibel mit
              </h3>
              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                }}
              >
                <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'landing-marquee 25s linear infinite' }}>
                  {['CME Group', 'NinjaTrader', 'Rithmic', 'Tradovate', 'AMP Futures', 'Optimus', 'CME Group', 'NinjaTrader', 'Rithmic', 'Tradovate', 'AMP Futures', 'Optimus'].map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      className="text-sm font-semibold uppercase tracking-wider whitespace-nowrap cursor-default select-none opacity-40 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-frost-secondary)' }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── DASHBOARD MOCKUP (full width below both columns) ── */}
        <motion.div initial={{ opacity: 0, y: 60, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }} className="mt-16 w-full max-w-4xl mx-auto">
          <motion.div style={{ y: dashY }}>
            {/* Glow halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-2xl"
              style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(92,184,240,0.08) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: -1 }}
            />

            <div className="glass-card group relative overflow-hidden rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-shadow duration-500 hover:shadow-[0_24px_100px_rgba(0,0,0,0.65),0_0_60px_rgba(92,184,240,0.06),inset_0_1px_0_rgba(255,255,255,0.05)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-[#1E2530] px-4 py-2" style={{ background: 'rgba(10,13,18,0.85)' }}>
                <div className="flex items-center gap-[5px] shrink-0">
                  <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#BF4B47', opacity: 0.85 }} />
                  <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#A68528', opacity: 0.85 }} />
                  <span className="h-[9px] w-[9px] rounded-full" style={{ background: '#1E8C35', opacity: 0.85 }} />
                </div>
                <div className="flex flex-1 items-center rounded-md px-3 py-[3px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxWidth: 240 }}>
                  <span className="font-mono text-[10px] tracking-tight" style={{ color: 'rgba(140,160,180,0.6)' }}>
                    arctis://analysis/<span style={{ color: 'rgba(140,160,180,0.9)' }}>NQ</span>
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--color-frost-muted)' }}>NQH5</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: '#34D399' }}>21,847.25</span>
                    <TrendingUp size={11} style={{ color: '#34D399' }} strokeWidth={2.5} />
                    <span className="font-mono text-[10px]" style={{ color: '#34D399' }}>+1.34%</span>
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.06)] px-2 py-0.5">
                    <span className="h-[5px] w-[5px] rounded-full" style={{ background: '#34D399', boxShadow: '0 0 4px rgba(52,211,153,0.9)', animation: 'status-pulse 1.5s ease-in-out infinite' }} />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#34D399' }}>Live</span>
                  </div>
                </div>
              </div>

              {/* Timeframe toolbar */}
              <div className="flex items-center border-b border-[#1E2530] px-4 py-[5px]" style={{ background: 'rgba(8,11,16,0.6)' }}>
                <div className="flex items-center gap-px">
                  {['1m', '5m', '15m', '1H', '4H', 'D'].map((tf, i) => (
                    <button key={tf} className={cn('font-mono rounded px-2 py-[3px] text-[10px] transition-colors duration-100', i === 2 ? 'bg-[rgba(92,184,240,0.14)] text-[#5CB8F0]' : 'text-[rgba(110,118,129,1)] hover:text-[#B0BAC5]')}>
                      {tf}
                    </button>
                  ))}
                </div>
                <div className="mx-4 h-3 w-px self-center" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="flex items-center gap-3">
                  {['EMA', 'VWAP', 'BIAS', 'CVD'].map((ind, i) => (
                    <span key={ind} className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: i === 2 ? 'rgba(92,184,240,0.7)' : 'rgba(140,160,180,0.35)' }}>
                      {ind}
                    </span>
                  ))}
                </div>
                <div className="ml-auto font-mono text-[9px]" style={{ color: 'rgba(140,160,180,0.3)' }}>09:30 — 12:00 ET</div>
              </div>

              {/* Chart area + right sidebar */}
              <div className="flex" style={{ background: 'rgba(6,9,14,0.7)' }}>
                {/* Y-axis */}
                <div className="flex shrink-0 flex-col justify-between border-r border-[#1E2530] py-3 pr-2 pl-3" style={{ width: 52 }}>
                  {['21,870', '21,848', '21,826', '21,804', '21,782'].map((p, i) => (
                    <span key={p} className="font-mono leading-none" style={{ fontSize: '9px', color: i === 1 ? 'rgba(52,211,153,0.8)' : 'rgba(140,160,180,0.4)' }}>
                      {p}
                    </span>
                  ))}
                </div>

                {/* Chart */}
                <div className="relative flex-1 px-2 py-3">
                  <HeroCandlestickChart />
                  <div className="absolute right-3 flex items-center gap-1" style={{ top: '14%' }}>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5))' }} />
                    <span className="font-mono rounded px-1.5 py-[2px] text-[9px] font-bold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                      21,847
                    </span>
                  </div>
                  <div className="pointer-events-none absolute right-3" style={{ top: '52%' }}>
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: 'rgba(92,184,240,0.4)' }}>DEMAND</span>
                  </div>
                  <div className="mt-1 flex justify-between px-1">
                    {['09:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
                      <span key={t} className="font-mono" style={{ fontSize: '8px', color: 'rgba(140,160,180,0.35)' }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="flex shrink-0 flex-col justify-between border-l border-[#1E2530] px-2 py-3" style={{ width: 44 }}>
                  {[
                    { label: 'DELTA', val: '+2.4k', color: 'rgba(52,211,153,0.75)', pct: 68, barColor: 'rgba(52,211,153,0.7)' },
                    { label: 'VOL', val: '18.4k', color: 'rgba(92,184,240,0.7)', pct: 84, barColor: 'rgba(92,184,240,0.65)' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <span className="font-mono text-center uppercase tracking-[0.08em]" style={{ fontSize: '8px', color: 'rgba(140,160,180,0.4)' }}>{item.label}</span>
                      <div className="overflow-hidden rounded-sm" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-sm" style={{ width: `${item.pct}%`, background: item.barColor }} />
                      </div>
                      <span className="font-mono text-center" style={{ fontSize: '9px', color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-center uppercase tracking-[0.08em]" style={{ fontSize: '8px', color: 'rgba(140,160,180,0.4)' }}>CVD</span>
                    <svg viewBox="0 0 36 14" className="w-full" style={{ height: 14 }} aria-hidden="true">
                      <polyline points="0,12 6,10 12,8 18,9 24,5 30,3 36,2" fill="none" stroke="rgba(92,184,240,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-mono text-center" style={{ fontSize: '9px', color: 'rgba(92,184,240,0.7)' }}>+847</span>
                  </div>
                </div>
              </div>

              {/* Volume strip */}
              <div className="flex items-end gap-[2px] border-t border-[#1E2530] px-3 py-1.5" style={{ height: 28, background: 'rgba(6,9,14,0.7)' }}>
                <div className="mr-1.5 shrink-0 self-end font-mono pb-0.5 uppercase tracking-[0.1em]" style={{ fontSize: '8px', color: 'rgba(140,160,180,0.3)' }}>VOL</div>
                {HERO_VOLUMES.map((v, i) => (
                  <div key={i} className="flex-1 rounded-[1px]" style={{ height: `${Math.round(v * 16) + 2}px`, background: HERO_CANDLES[i].bull ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.22)' }} />
                ))}
              </div>

              {/* Analysis strip */}
              <div className="flex items-center gap-3 border-t border-[#1E2530] px-4 py-2" style={{ background: 'rgba(8,11,16,0.9)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="h-[5px] w-[5px] rounded-full" style={{ background: '#34D399', boxShadow: '0 0 5px rgba(52,211,153,0.7)' }} />
                  <span className="font-mono text-[10px] font-semibold tracking-[0.06em]" style={{ color: '#34D399' }}>BIAS: LONG +7</span>
                </div>
                <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: 'rgba(140,160,180,0.5)' }}>CONFLUENCE:</span>
                  <div className="overflow-hidden rounded-full" style={{ width: 40, height: 3, background: 'rgba(92,184,240,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: '87%', background: 'rgba(92,184,240,0.7)', boxShadow: '0 0 4px rgba(92,184,240,0.4)' }} />
                  </div>
                  <span className="font-mono text-[10px] font-bold tracking-[0.04em]" style={{ color: 'rgba(92,184,240,0.85)' }}>87%</span>
                </div>
                <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1">
                  <span className="font-mono rounded px-1 text-[9px] font-bold" style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.8)', border: '1px solid rgba(251,191,36,0.15)', lineHeight: '14px' }}>
                    3 SETUPS AKTIV
                  </span>
                </div>
                <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: 'rgba(140,160,180,0.5)' }}>R:R</span>
                  <span className="font-mono text-[10px] font-semibold" style={{ color: 'rgba(140,160,180,0.75)' }}>3.2</span>
                </div>
                <div className="ml-auto font-mono text-[9px]" style={{ color: 'rgba(140,160,180,0.28)' }}>0.3s ago</div>
              </div>
            </div>

            {/* Mirror reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none mx-auto"
              style={{ width: '88%', height: 40, marginTop: 1, background: 'linear-gradient(180deg, rgba(92,184,240,0.05) 0%, transparent 100%)', borderRadius: '0 0 16px 16px', opacity: 0.55, filter: 'blur(4px)' }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ zIndex: 10 }}
      >
        <ChevronDown size={22} style={{ color: 'var(--color-frost-muted)', animation: 'float 2.4s ease-in-out infinite' }} />
      </motion.div>
    </section>
  )
}

// ── TrustBar Section ──────────────────────────────────────────────────────────

const TRUST_METRICS: Array<{ icon: React.ReactNode; config: CounterConfig; label: string }> = [
  { icon: <BarChart3 size={20} />, config: { type: 'integer', target: 12400, suffix: '+' }, label: 'Aktive Trader' },
  { icon: <Shield size={20} />, config: { type: 'integer', target: 89, suffix: '%' }, label: 'Setup-Trefferquote' },
  { icon: <Zap size={20} />, config: { type: 'static', display: '14 Min' }, label: 'Pre-Market Vorbereitung' },
  { icon: <Globe size={20} />, config: { type: 'decimal', target: 3.2, decimals: 1 }, label: 'Durchschnittliches R:R' },
]

const TRUST_LOGOS = ['CME Group', 'NinjaTrader', 'Rithmic', 'Tradovate', 'AMP Futures', 'Optimus Futures']

function TrustMetricCard({ icon, counterConfig, label, inView }: { icon: React.ReactNode; counterConfig: CounterConfig; label: string; inView: boolean }) {
  const { ref } = useAnimatedCounter(counterConfig, inView)
  return (
    <motion.div variants={staggerItem} className="glass-card p-6 rounded-xl text-center flex flex-col items-center gap-3">
      <div style={{ color: 'var(--color-ice)' }}>{icon}</div>
      <span ref={ref} className="font-display text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: 'var(--color-frost-white)' }} aria-live="polite" />
      <span className="text-sm uppercase tracking-wider leading-tight" style={{ color: 'var(--color-frost-muted)' }}>{label}</span>
    </motion.div>
  )
}

function TrustBarSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' })

  return (
    <>
      <style>{`
        @keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { [data-marquee] { animation: none !important; } }
      `}</style>
      <section ref={sectionRef} className="section-padding relative border-y border-[rgba(130,140,152,0.10)]">
        <div className="section-container flex flex-col gap-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {TRUST_METRICS.map((m) => (
              <TrustMetricCard key={m.label} icon={m.icon} counterConfig={m.config} label={m.label} inView={inView} />
            ))}
          </motion.div>

          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(130,140,152,0.20)] to-transparent" />

          <div className="flex flex-col items-center gap-5 w-full overflow-hidden">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-frost-muted)' }}>
              Gebaut für Trader die Ergebnisse wollen, nicht Features.
            </p>
            <div className="relative w-full overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--color-arctic-base), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--color-arctic-base), transparent)' }} />
              <div data-marquee className="flex gap-12 w-max" style={{ animation: 'marquee-scroll 30s linear infinite' }}>
                {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
                  <span key={i} className="font-display text-lg font-semibold uppercase tracking-wider whitespace-nowrap cursor-default select-none transition-colors duration-300" style={{ color: 'rgba(110,118,129,0.4)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-frost-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(110,118,129,0.4)')}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────

function CandlestickIllustration() {
  const bars = [{ height: 28, wick: 8, bullish: false }, { height: 40, wick: 10, bullish: true }, { height: 22, wick: 6, bullish: false }, { height: 50, wick: 12, bullish: true }]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-6 top-6 flex items-end gap-1.5 opacity-[0.12]">
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className="w-px" style={{ height: bar.wick, background: bar.bullish ? '#00B775' : '#FF3B3B' }} />
          <div className="w-3 rounded-sm" style={{ height: bar.height, background: bar.bullish ? '#00B775' : '#FF3B3B' }} />
          <div className="w-px" style={{ height: bar.wick * 0.6, background: bar.bullish ? '#00B775' : '#FF3B3B' }} />
        </div>
      ))}
    </div>
  )
}

function ArrowIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 opacity-[0.18]">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <defs><linearGradient id="arrow-grad" x1="0" y1="80" x2="80" y2="0"><stop offset="0%" stopColor="#5CB8F0" stopOpacity="0" /><stop offset="100%" stopColor="#5CB8F0" stopOpacity="1" /></linearGradient></defs>
        <path d="M10 70 L70 10 M55 10 L70 10 L70 25" stroke="url(#arrow-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ConfluenceIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 opacity-[0.15]">
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
        <circle cx="20" cy="28" r="20" fill="#5CB8F0" fillOpacity="0.5" />
        <circle cx="36" cy="16" r="20" fill="#7DD3FC" fillOpacity="0.4" />
        <circle cx="52" cy="28" r="20" fill="#5CB8F0" fillOpacity="0.45" />
      </svg>
    </div>
  )
}

function ZigzagIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 opacity-[0.15]">
      <svg width="80" height="48" viewBox="0 0 80 48" fill="none">
        <polyline points="0,36 16,12 32,32 48,8 64,28 80,14" stroke="#5CB8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="16" cy="12" r="3" fill="#5CB8F0" />
        <circle cx="48" cy="8" r="3" fill="#7DD3FC" />
        <circle cx="64" cy="28" r="3" fill="#5CB8F0" />
      </svg>
    </div>
  )
}

function TimelineIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 opacity-[0.15]">
      <svg width="88" height="40" viewBox="0 0 88 40" fill="none">
        <line x1="4" y1="20" x2="84" y2="20" stroke="#5CB8F0" strokeWidth="2" strokeLinecap="round" />
        {[12, 24, 44, 56, 70].map((x, i) => (
          <line key={i} x1={x} y1={i % 2 === 0 ? 12 : 14} x2={x} y2={i % 2 === 0 ? 28 : 26} stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <rect x="24" y="15" width="32" height="10" rx="2" fill="#5CB8F0" fillOpacity="0.3" />
        <circle cx="4" cy="20" r="3" fill="#5CB8F0" />
        <circle cx="84" cy="20" r="3" fill="#5CB8F0" fillOpacity="0.5" />
      </svg>
    </div>
  )
}

function ShieldIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 opacity-[0.13]">
      <svg width="60" height="68" viewBox="0 0 60 68" fill="none">
        <path d="M30 4 L54 14 L54 34 C54 50 42 62 30 66 C18 62 6 50 6 34 L6 14 Z" stroke="#5CB8F0" strokeWidth="2" fill="#5CB8F0" fillOpacity="0.06" strokeLinejoin="round" />
        <polyline points="18,34 26,42 42,26" stroke="#5CB8F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

interface FeatureDef {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  illustration: React.ComponentType
  colSpan: 1 | 2
  accent?: boolean
  pill?: string
}

const FEATURES_DATA: FeatureDef[] = [
  { id: 'charts', icon: LineChart, title: 'Dein Chart. Sauber und klar.', description: 'ES und NQ in Echtzeit. Volumenprofil, VWAP, EMA — alles was du brauchst, nichts was dich ablenkt. Kein Grid-Chaos, kein Indikator-Friedhof.', illustration: CandlestickIllustration, colSpan: 2, accent: true, pill: 'ES & NQ · Echtzeit' },
  { id: 'bias', icon: TrendingUp, title: 'Welche Seite handelst du heute?', description: 'Bevor du den ersten Trade machst, sagt dir Arctis: Long, Short, oder Finger weg. 7 unabhängige Signale ergeben einen klaren Bias-Score. Kein Bauchgefühl mehr.', illustration: ArrowIllustration, colSpan: 1 },
  { id: 'confluence', icon: Layers, title: 'Nur handeln wenn alles stimmt.', description: 'Confluence misst ob VWAP, EMA, Struktur, Volume und Bias in die gleiche Richtung zeigen. Score über 70? Hohe Wahrscheinlichkeit. Unter 30? Warten.', illustration: ConfluenceIllustration, colSpan: 1 },
  { id: 'patterns', icon: Search, title: 'Setups die du sonst verpasst.', description: 'ORB Breakout, IB Extension, POC Rejection, VA Edge — automatisch erkannt mit Entry, Stop und Target. Du siehst den Trade, nicht nur das Muster.', illustration: ZigzagIllustration, colSpan: 2, accent: true, pill: 'ORB · IB · POC · VA · Live Detection' },
  { id: 'sessions', icon: Clock, title: 'Wisse wo du in der Session stehst.', description: 'Pre-Market, NY Open, Midday, Power Hour — jede Session hat eigene Regeln. Arctis zeigt dir welche gerade gilt und was historisch passiert.', illustration: TimelineIllustration, colSpan: 1 },
  { id: 'risk', icon: ShieldCheck, title: 'Nie wieder den Daily-Loss sprengen.', description: 'Max Trades, Max Loss, Position Size — alles eingebaut. Arctis stoppt dich bevor Emotionen übernehmen. Disziplin ist kein Vorsatz mehr, sondern ein Feature.', illustration: ShieldIllustration, colSpan: 1 },
]

function FeatureCard({ feature }: { feature: FeatureDef }) {
  const Icon = feature.icon
  const Illustration = feature.illustration
  const isWide = feature.colSpan === 2
  return (
    <motion.div
      variants={staggerItem}
      className={cn('glass-card relative overflow-hidden rounded-2xl p-6 lg:p-8 transition-transform duration-300 ease-out hover:-translate-y-0.5', isWide && 'lg:col-span-2')}
      style={{ willChange: 'transform' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 30px rgba(92,184,240,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {feature.accent && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 30%, rgba(92,184,240,0.8) 50%, rgba(92,184,240,0.6) 70%, transparent 100%)' }} />
      )}
      {isWide && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(92,184,240,0.06) 0%, transparent 70%)' }} />
      )}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}>
        <Illustration />
      </motion.div>
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center rounded-lg p-3" style={{ background: 'rgba(92,184,240,0.15)' }}>
          <Icon className="size-5" style={{ color: 'var(--color-ice)' } as React.CSSProperties} />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold" style={{ color: 'var(--color-frost-white)' }}>{feature.title}</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-frost-secondary)' }}>{feature.description}</p>
        {isWide && feature.pill && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(130,140,152,0.10)] px-3 py-1" style={{ background: 'rgba(92,184,240,0.05)' }}>
            <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--color-ice)', boxShadow: '0 0 6px rgba(92,184,240,0.8)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-frost-secondary)' }}>{feature.pill}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="section-padding relative">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.015] z-0" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: '800px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(92,184,240,0.04) 0%, transparent 70%)' }} />
      </div>
      <div className="section-container relative z-10">
        <motion.div className="mb-12 text-center lg:mb-16" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-ice)' }}>Analysis Modules</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl" style={{ color: 'var(--color-frost-white)' }}>
            6 Werkzeuge. Ein Ziel:<br />
            <span className="text-gradient-frost">Dein Profit.</span>
          </h2>
          <div className="mx-auto mt-6 h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(92,184,240,0.5), transparent)' }} />
          <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--color-frost-secondary)' }}>
            Jedes Modul beantwortet eine Frage die du dir vor jedem Trade stellen solltest.
          </p>
        </motion.div>
        <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          {FEATURES_DATA.map((f) => <FeatureCard key={f.id} feature={f} />)}
        </motion.div>
      </div>
    </section>
  )
}

// ── Comparison Section ────────────────────────────────────────────────────────

type StatusType = 'check' | 'x' | 'minus'

interface ComparisonRow {
  feature: string
  traditional: { status: StatusType; label: string }
  arctis: { status: StatusType; label: string }
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: 'Pre-Market Vorbereitung', traditional: { status: 'x', label: '45+ Minuten, ad-hoc' }, arctis: { status: 'check', label: '14 Minuten, strukturiert' } },
  { feature: 'Tages-Bias', traditional: { status: 'x', label: 'Bauchgefühl' }, arctis: { status: 'check', label: 'Automatisch, 7 Faktoren' } },
  { feature: 'Setup-Erkennung', traditional: { status: 'x', label: 'Manuell suchen' }, arctis: { status: 'check', label: 'Entry/Stop/Target berechnet' } },
  { feature: 'Confluence', traditional: { status: 'x', label: 'Subjektive Einschätzung' }, arctis: { status: 'check', label: 'Score 0-100, objektiv' } },
  { feature: 'Risiko-Kontrolle', traditional: { status: 'x', label: 'Selbstdisziplin' }, arctis: { status: 'check', label: 'Automatische Limits' } },
  { feature: 'Replay & Proberun', traditional: { status: 'x', label: 'Nicht verfügbar' }, arctis: { status: 'check', label: 'Historische Setups überprüfen' } },
]

function StatusCell({ status, label }: { status: StatusType; label: string }) {
  if (status === 'check') return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 items-center justify-center rounded-full p-1" style={{ background: 'rgba(0,183,117,0.15)', color: '#00B775' }}><Check size={13} strokeWidth={2.5} /></span>
      <span className="text-xs" style={{ color: 'var(--color-frost-secondary)' }}>{label}</span>
    </div>
  )
  if (status === 'x') return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 items-center justify-center rounded-full p-1" style={{ background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}><X size={13} strokeWidth={2.5} /></span>
      <span className="text-xs" style={{ color: 'var(--color-frost-secondary)' }}>{label}</span>
    </div>
  )
  return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 items-center justify-center rounded-full p-1" style={{ background: 'rgba(247,148,29,0.15)', color: '#F7941D' }}><Minus size={13} strokeWidth={2.5} /></span>
      <span className="text-xs" style={{ color: 'var(--color-frost-secondary)' }}>{label}</span>
    </div>
  )
}

function ComparisonSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' })

  return (
    <section ref={sectionRef} className="section-padding relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(92,184,240,0.04) 0%, transparent 70%)' }} />
      </div>
      <div className="section-container relative z-10">
        <motion.div variants={staggerContainer} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="mb-12 flex flex-col items-center gap-4 text-center">
          <motion.p variants={staggerItem} className="text-sm font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-ice)' }}>Warum Trader wechseln</motion.p>
          <motion.h2 variants={staggerItem} className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-frost-white)' }}>
            Der Unterschied zwischen{' '}
            <span className="text-gradient-frost">hoffen und wissen.</span>
          </motion.h2>
        </motion.div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(130,140,152,0.10)' }}>
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 bottom-0" style={{ width: '33.333%' }}>
              <div className="absolute inset-0" style={{ borderLeft: '1px solid rgba(92,184,240,0.2)', background: 'linear-gradient(180deg, rgba(92,184,240,0.08) 0%, rgba(92,184,240,0.02) 100%)' }} />
            </div>
            <div className="relative grid grid-cols-3 border-b" style={{ borderColor: 'rgba(130,140,152,0.07)' }}>
              <div className="px-6 py-4"><span className="font-sans text-sm uppercase tracking-[0.12em]" style={{ color: 'var(--color-frost-muted)' }}>Bereich</span></div>
              <div className="border-l px-6 py-4" style={{ borderColor: 'rgba(130,140,152,0.08)', background: 'rgba(16,21,29,0.6)' }}><span className="font-sans text-sm uppercase tracking-[0.12em]" style={{ color: 'var(--color-frost-muted)' }}>Andere Tools</span></div>
              <div className="relative border-l px-6 py-4" style={{ borderColor: 'rgba(92,184,240,0.2)' }}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.6) 50%, transparent 100%)' }} />
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold" style={{ color: 'var(--color-ice)' }}>Arctis</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-ice)', boxShadow: '0 0 6px rgba(92,184,240,0.7)' }} />
                </div>
              </div>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="divide-y divide-[rgba(130,140,152,0.04)]">
              {COMPARISON_ROWS.map((row, i) => (
                <motion.div key={row.feature} variants={staggerItem} className="group grid grid-cols-3 transition-colors duration-200 hover:bg-[rgba(16,21,29,0.4)]" style={{ background: i % 2 === 0 ? 'rgba(12,16,23,0.4)' : 'transparent' }}>
                  <div className="px-6 py-4"><span className="font-sans text-sm font-medium" style={{ color: 'var(--color-frost-white)' }}>{row.feature}</span></div>
                  <div className="border-l px-6 py-4" style={{ borderColor: 'rgba(130,140,152,0.08)' }}><StatusCell status={row.traditional.status} label={row.traditional.label} /></div>
                  <div className="border-l px-6 py-4" style={{ borderColor: 'rgba(92,184,240,0.2)' }}><StatusCell status={row.arctis.status} label={row.arctis.label} /></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="block md:hidden">
          <motion.div variants={staggerContainer} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="flex flex-col gap-3">
            {COMPARISON_ROWS.map((row) => (
              <motion.div key={row.feature} variants={staggerItem} className="glass-card rounded-xl overflow-hidden">
                <div className="border-b border-[rgba(130,140,152,0.08)] px-4 py-3">
                  <span className="font-sans text-sm font-medium" style={{ color: 'var(--color-frost-white)' }}>{row.feature}</span>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-[rgba(130,140,152,0.08)] px-4 py-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-frost-muted)' }}>Andere Tools</p>
                    <StatusCell status={row.traditional.status} label={row.traditional.label} />
                  </div>
                  <div className="px-4 py-3" style={{ background: 'rgba(92,184,240,0.04)' }}>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-ice)' }}>Arctis</p>
                    <StatusCell status={row.arctis.status} label={row.arctis.label} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom callout */}
        <motion.div
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce}
          className="glass-card mt-12 mx-auto max-w-xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center justify-center rounded-full p-2.5" style={{ background: 'var(--color-ice-subtle)', color: 'var(--color-ice)', boxShadow: '0 0 20px rgba(92,184,240,0.15)' }}>
            <Clock size={18} strokeWidth={2} />
          </div>
          <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--color-frost-secondary)' }}>
            Trader die Arctis nutzen brauchen{' '}
            <span className="font-semibold" style={{ color: 'var(--color-frost-white)' }}>14 statt 42 Minuten</span>{' '}
            Pre-Market Vorbereitung — und handeln mit{' '}
            <span className="font-semibold" style={{ color: 'var(--color-frost-white)' }}>89% Setup-Trefferquote.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ── Testimonials Section ──────────────────────────────────────────────────────

interface TestimonialItem {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: TestimonialItem[] = [
  { quote: 'Seit ich den BIAS-Score nutze, trade ich nicht mehr gegen den Trend. Mein Average Winner ist von 28 auf 41 Ticks gestiegen.', name: 'Marcus Reinhardt', role: 'Prop Trader, 11 Jahre', initials: 'MR' },
  { quote: 'Arctis hat mein Revenge-Trading beendet. Wenn der Confluence unter 30 ist, mache ich nichts. Mein Drawdown hat sich halbiert.', name: 'Sarah Kovac', role: 'Funded Trader', initials: 'SK' },
  { quote: 'Die Setup-Erkennung findet ORB Breaks die ich früher verpasst habe. 3 von 5 Trades treffen jetzt das Target.', name: 'James Thornton', role: 'NQ Scalper', initials: 'JT' },
  { quote: '14 Minuten Pre-Market statt einer Stunde. Und ich weiß genau: Entry, Stop, Target. Kein Raten mehr.', name: 'Elena Vasquez', role: 'ES Daytraderin', initials: 'EV' },
  { quote: 'Das Risk-Framework hat mich vor mir selbst geschützt. Seit 3 Monaten kein Blow-Up mehr.', name: 'David Liu', role: 'Funded Trader', initials: 'DL' },
  { quote: 'Der Proberun-Modus hat mir gezeigt wie viele Setups ich täglich verpasse. Jetzt sehe ich sie alle.', name: 'Alexander Meyer', role: 'Swing Trader', initials: 'AM' },
]

function TestimonialCard({ testimonial, floatY }: { testimonial: TestimonialItem; floatY: MotionValue<number> }) {
  return (
    <motion.article
      variants={staggerItem}
      style={{ y: floatY }}
      className="glass-card flex flex-col p-6 lg:p-8 rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-0.5"
      style={{ willChange: 'transform' }}
    >
      <Quote size={28} strokeWidth={1.5} className="mb-4 shrink-0" style={{ color: 'rgba(92,184,240,0.2)' }} aria-hidden="true" />
      <p className="text-sm sm:text-base leading-relaxed italic flex-1" style={{ color: 'var(--color-frost-secondary)' }}>{testimonial.quote}</p>
      <div className="mt-auto pt-4 border-t border-[rgba(130,140,152,0.08)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(92,184,240,0.5), rgba(92,184,240,0.12))' }} aria-hidden="true">
            <span className="font-display font-bold text-sm leading-none" style={{ color: 'var(--color-frost-white)' }}>{testimonial.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate" style={{ color: 'var(--color-frost-white)' }}>{testimonial.name}</p>
            <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--color-frost-muted)' }}>{testimonial.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} strokeWidth={0} fill="currentColor" style={{ color: 'var(--color-ice)' }} />)}
        </div>
      </div>
    </motion.article>
  )
}

function TestimonialsSection() {
  const gridRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: gridRef, offset: ['start end', 'end start'] })
  const oddY = useTransform(scrollYProgress, [0, 1], [0, -8])
  const evenY = useTransform(scrollYProgress, [0, 1], [0, 8])

  return (
    <section className="section-padding relative noise-overlay">
      <div className="section-container">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="text-center mb-14">
          <p className="text-sm font-medium uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--color-ice)' }}>Echte Ergebnisse</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            <span className="block" style={{ color: 'var(--color-frost-white)' }}>Was sich in ihrem</span>
            <span className="text-gradient-frost block">Trading geändert hat.</span>
          </h2>
        </motion.div>
        <motion.div ref={gridRef} variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, index) => (
            <TestimonialCard key={t.name} testimonial={t} floatY={index % 2 !== 0 ? oddY : evenY} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Pricing Section ───────────────────────────────────────────────────────────

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

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'pro',
    icon: Sparkles,
    name: 'Pro',
    price: { monthly: '$49/mo', annual: '$39/mo' },
    priceNote: { annual: 'billed annually' },
    features: [
      'ES & NQ — Live-Daten via Rithmic',
      'Arctis AI Marktanalyse mit Entry/Stop/Target',
      'BIAS-Modul (5 Zustände, Switch Level, Fakes)',
      'Confluence Scoring (7 Signaldimensionen)',
      'Automatische Setup-Erkennung (ORB, IB, POC, VA)',
      'Volumenprofil tagesbasiert (POC, VAH, VAL)',
      'Replay mit Proberun-Modus',
      'Desktop App (macOS)',
      'Priority Support',
    ],
    cta: 'Jetzt starten',
    highlighted: true,
  },
  {
    id: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'Fuer Prop-Firms und Teams',
    features: [
      'Alles aus Pro',
      'Unbegrenzte Team-Seats',
      'Custom Integrationen (API, Webhooks)',
      'Dedizierter Support-Ingenieur',
      'SLA Garantien (99.9% Uptime)',
      'On-Premise Deployment möglich',
    ],
    cta: 'Kontakt aufnehmen',
  },
]

function BillingToggle({ isAnnual, onToggle }: { isAnnual: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm font-medium transition-colors duration-200" style={{ color: !isAnnual ? 'var(--color-frost-white)' : 'var(--color-frost-muted)' }}>Monthly</span>
      <button
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className="relative flex items-center rounded-full p-1"
        style={{ width: 52, height: 28, background: 'var(--color-arctic-secondary)' }}
      >
        <motion.span
          layout
          layoutId="toggle-pill"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-1 size-5 rounded-full"
          style={{ left: isAnnual ? 'calc(100% - 24px)' : 4, background: 'var(--color-ice)' }}
          aria-hidden="true"
        />
        <span className="sr-only">{isAnnual ? 'Switch to monthly billing' : 'Switch to annual billing'}</span>
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium transition-colors duration-200" style={{ color: isAnnual ? 'var(--color-frost-white)' : 'var(--color-frost-muted)' }}>Annual</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(0,183,117,0.2)', color: '#00B775' }}>Save 20%</span>
      </div>
    </div>
  )
}

function PriceDisplay({ tier, isAnnual }: { tier: PricingTier; isAnnual: boolean }) {
  const variablePrice = typeof tier.price === 'object' ? tier.price : null
  const displayPrice = variablePrice ? (isAnnual ? variablePrice.annual : variablePrice.monthly) : (tier.price as string)
  const annualNote = typeof tier.priceNote === 'object' ? tier.priceNote.annual : null
  const staticNote = typeof tier.priceNote === 'string' ? tier.priceNote : null

  return (
    <div className="mt-6">
      <div className="flex items-end gap-2">
        <AnimatePresence mode="wait">
          <motion.span key={`price-${tier.id}-${isAnnual}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="font-display text-5xl font-bold" style={{ color: 'var(--color-frost-white)' }}>
            {displayPrice}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-1.5 flex items-center gap-2 min-h-[20px]">
        {isAnnual && variablePrice && <span className="text-sm line-through" style={{ color: 'var(--color-frost-muted)' }}>$49</span>}
        {isAnnual && annualNote && <span className="text-xs" style={{ color: 'var(--color-frost-muted)' }}>{annualNote}</span>}
        {staticNote && <span className="text-sm" style={{ color: 'var(--color-frost-muted)' }}>{staticNote}</span>}
      </div>
    </div>
  )
}

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="section-padding relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2" style={{ width: '900px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(92,184,240,0.04) 0%, transparent 65%)' }} />
      </div>
      <div className="section-container relative z-10">
        <motion.div className="mb-10 text-center lg:mb-12" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-ice)' }}>Pricing</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-frost-white)' }}>
            Transparent pricing.{' '}
            <span className="text-gradient-frost">No surprises.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'var(--color-frost-secondary)' }}>
            Choose the plan that matches your trading operation. Upgrade or downgrade at any time.
          </p>
        </motion.div>

        <motion.div className="mb-12 flex justify-center" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </motion.div>

        <div className="relative">
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(90,174,216,0.4), transparent 70%)' }} />
          <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-3xl mx-auto lg:gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {PRICING_TIERS.map((tier) => {
              const Icon = tier.icon
              if (tier.id === 'pro') return (
                <motion.div key={tier.id} variants={staggerItem} className="glass-card frost-glow relative flex flex-col rounded-2xl p-8" style={{ border: '2px solid rgba(92,184,240,0.3)', background: 'rgba(92,184,240,0.06)', transition: 'box-shadow 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(92,184,240,0.18), 0 0 80px rgba(92,184,240,0.08)' }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.7) 30%, rgba(125,211,252,0.9) 50%, rgba(92,184,240,0.7) 70%, transparent 100%)' }} />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full px-4 py-1.5 font-display text-xs font-semibold" style={{ background: 'var(--color-ice)', color: 'var(--color-arctic-base)' }}>Most Popular</span>
                  </div>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(92,184,240,0.1) 0%, transparent 60%)' }} />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="inline-flex items-center justify-center rounded-lg p-3 w-fit" style={{ background: 'rgba(92,184,240,0.18)' }}>
                      <Icon className="size-5" style={{ color: 'var(--color-ice)' } as React.CSSProperties} />
                    </div>
                    <p className="mt-5 font-display text-xl font-semibold" style={{ color: 'var(--color-frost-white)' }}>{tier.name}</p>
                    <PriceDisplay tier={tier} isAnnual={isAnnual} />
                    <ul className="mt-8 flex flex-col gap-3 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--color-ice)' } as React.CSSProperties} />
                          <span className="text-sm" style={{ color: 'var(--color-frost-secondary)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="mt-8 w-full rounded-xl px-6 py-3 font-display text-sm font-semibold transition-colors duration-200 shadow-[0_0_24px_rgba(92,184,240,0.25)] hover:shadow-[0_0_32px_rgba(92,184,240,0.4)]" style={{ background: 'var(--color-ice)', color: 'var(--color-arctic-base)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-ice-light)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-ice)')}>
                      {tier.cta}
                    </motion.button>
                  </div>
                </motion.div>
              )
              return (
                <motion.div key={tier.id} variants={staggerItem} className="glass-card flex flex-col rounded-2xl p-8">
                  <div className="inline-flex items-center justify-center rounded-lg p-3 w-fit" style={{ background: 'rgba(92,184,240,0.1)' }}>
                    <Icon className="size-5" style={{ color: 'rgba(92,184,240,0.6)' } as React.CSSProperties} />
                  </div>
                  <p className="mt-5 font-display text-xl font-semibold" style={{ color: 'var(--color-frost-white)' }}>{tier.name}</p>
                  <PriceDisplay tier={tier} isAnnual={isAnnual} />
                  <ul className="mt-8 flex flex-col gap-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'rgba(92,184,240,0.6)' } as React.CSSProperties} />
                        <span className="text-sm" style={{ color: 'var(--color-frost-secondary)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-8 w-full rounded-xl border px-6 py-3 font-display text-sm font-medium transition-colors duration-200" style={{ borderColor: 'var(--color-frost-border)', color: 'var(--color-frost-white)' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-frost-secondary)'; e.currentTarget.style.background = 'var(--color-arctic-raised)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-frost-border)'; e.currentTarget.style.background = 'transparent' }}>
                    {tier.cta}
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        <motion.p className="mt-8 text-center text-sm" style={{ color: 'var(--color-frost-muted)' }} variants={scaleIn} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          All plans include automatic updates. No trading data is stored on external servers.
        </motion.p>
      </div>
    </section>
  )
}

// ── FAQ Section ───────────────────────────────────────────────────────────────

interface FAQItem {
  id: string
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  { id: 'profitability', question: 'Macht mich Arctis wirklich profitabler?', answer: 'Arctis ersetzt kein Trading-Wissen — aber es macht deine Analyse objektiv und konsistent. Trader berichten von besserer Win-Rate und weniger emotionalen Fehlentscheidungen.' },
  { id: 'already-profitable', question: 'Ich bin schon profitabel. Bringt mir das trotzdem was?', answer: 'Ja. Profitablen Tradern hilft Arctis am meisten beim Zeitsparen (14 statt 42 Min Pre-Market) und bei der Vermeidung von B-Setups. Du nimmst nur noch die besten Trades.' },
  { id: 'bias-score', question: 'Was bedeutet der BIAS-Score konkret?', answer: 'Der Score von -10 bis +10 zeigt die Tagesrichtung. Positiv = Long-Bias, negativ = Short-Bias. Über +5 oder unter -5 ist ein starker Trend. Um 0 herum: Range-Tag, handle die Kanten.' },
  { id: 'signal-accuracy', question: 'Wie genau sind die Setup-Signale?', answer: 'Die Setup-Erkennung (ORB, IB, POC, VA) liefert Entry, Stop und Target mit berechnetem R:R. Die historische Trefferquote liegt bei ca. 60-70% — aber nur wenn der Confluence-Score über 50 ist.' },
  { id: 'markets', question: 'Welche Märkte werden unterstützt?', answer: 'ES (S&P 500 E-mini) und NQ (Nasdaq 100 E-mini) — die liquidesten Index-Futures. Optimale Bedingungen für unsere Analyse.' },
  { id: 'data-feed', question: 'Brauche ich einen separaten Datenfeed?', answer: 'Ja, Arctis verbindet sich über Rithmic mit der Börse. Du brauchst einen Rithmic-kompatiblen Broker (z.B. AMP, Optimus, Tradovate).' },
  { id: 'platforms', question: 'Läuft Arctis auf Mac und Windows?', answer: 'Aktuell macOS. Windows-Version kommt in Kürze. Die App ist unter 15 MB groß und läuft komplett lokal — keine Cloud, keine Verzögerung.' },
  { id: 'pricing', question: 'Was kostet es?', answer: 'Pro: 49€/Monat (oder 39€ jährlich). Kein Free-Tier, keine abgespeckte Version. Du bekommst alles vom ersten Tag.' },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div variants={staggerItem} className="border-b border-[rgba(130,140,152,0.08)] last:border-b-0">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="group flex w-full items-center justify-between py-5 text-left">
        <span className="font-display text-base font-medium transition-colors duration-200 sm:text-lg" style={{ color: isOpen ? '#7DCBF5' : 'var(--color-frost-white)' }}>
          {item.question}
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="ml-4 shrink-0 transition-colors duration-200" style={{ color: isOpen ? 'var(--color-ice)' : 'var(--color-frost-muted)' }} aria-hidden="true">
          <ChevronDown size={20} strokeWidth={1.75} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="overflow-hidden">
            <p className="pb-5 pt-1 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-frost-secondary)' }}>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="section-padding relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translate(-50%, -50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(92,184,240,0.035) 0%, transparent 65%)' }} />
      </div>
      <div className="section-container relative z-10">
        {/* Mobile header */}
        <div className="mb-10 lg:hidden">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-ice)' }}>FAQ</p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-frost-white)' }}>
              Deine Fragen, <span className="text-gradient-frost">beantwortet.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-frost-secondary)' }}>
              Alles was du wissen musst, bevor du anfängst.{' '}
              <a href="mailto:support@arctis.app" className="underline underline-offset-4 transition-colors duration-200" style={{ color: 'var(--color-ice)' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#7DCBF5')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ice)')}>
                Support kontaktieren
              </a>{' '}
              falls du nicht findest was du suchst.
            </p>
          </motion.div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_1.6fr] lg:gap-20 xl:gap-28">
          {/* Left sticky panel — desktop only */}
          <div className="hidden lg:block">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-ice)' }}>FAQ</p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-frost-white)' }}>
                Deine Fragen,{' '}
                <span className="text-gradient-frost">beantwortet.</span>
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed" style={{ color: 'var(--color-frost-secondary)' }}>
                Alles was du wissen musst, bevor du anfängst. Nicht gefunden was du suchst?
              </p>
              <div className="mt-6">
                <a href="mailto:support@arctis.app" className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 transition-colors duration-200" style={{ color: 'var(--color-ice)' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#7DCBF5')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ice)')}>
                  Support kontaktieren
                </a>
              </div>
              <div aria-hidden="true" className="mt-10 hidden h-px max-w-[120px] lg:block" style={{ background: 'linear-gradient(90deg, rgba(92,184,240,0.5) 0%, transparent 100%)' }} />
            </motion.div>
          </div>

          {/* Accordion */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={item.id} item={item} isOpen={openIndex === index} onToggle={() => setOpenIndex((prev) => (prev === index ? null : index))} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── FinalCTA Section ──────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="noise-overlay relative overflow-hidden py-24 lg:py-32" style={{ background: 'var(--color-arctic-primary)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center bottom, rgba(92,184,240,0.12) 0%, rgba(92,184,240,0.04) 35%, transparent 70%)' }} />
        <div className="absolute inset-x-0 top-0 h-32" style={{ background: 'linear-gradient(180deg, rgba(10,13,18,0.6) 0%, transparent 100%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(92,184,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(92,184,240,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.2) 30%, rgba(92,184,240,0.4) 50%, rgba(92,184,240,0.2) 70%, transparent 100%)' }} />
      </div>

      <div className="section-container relative z-10 flex flex-col items-center text-center">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: 'var(--color-frost-border)', background: 'var(--color-arctic-secondary)' }}>
          <BarChart2 size={13} style={{ color: 'var(--color-ice)' }} strokeWidth={2.2} />
          <span className="font-sans text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--color-frost-secondary)' }}>Fuer Trader die Ergebnisse wollen</span>
        </motion.div>

        <motion.h2 variants={blurReveal} initial="hidden" whileInView="visible" viewport={viewportOnce} className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
          <span className="block" style={{ color: 'var(--color-frost-white)' }}>Hoer auf zu raten.</span>
          <span className="text-gradient-frost block">Fang an zu wissen.</span>
        </motion.h2>

        <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} transition={{ delay: 0.1 }} className="font-sans mx-auto mt-6 max-w-xl text-lg leading-relaxed sm:text-xl" style={{ color: 'var(--color-frost-secondary)' }}>
          In 14 Minuten weisst du: Welche Seite. Welcher Entry. Welches Target. Jeden Morgen.
        </motion.p>

        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} transition={{ delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a
            href="/"
            variants={scaleIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="font-display group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl px-10 py-4 text-lg font-bold transition-all duration-200"
            style={{ background: 'var(--color-ice)', color: 'var(--color-arctic-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ice-light)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(92,184,240,0.2), 0 0 120px rgba(92,184,240,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ice)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Download size={18} strokeWidth={2.2} />
            Jetzt starten
            <ArrowRight size={16} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </motion.a>

          <motion.a
            href="#features"
            variants={scaleIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="font-display group flex cursor-pointer items-center gap-2.5 rounded-xl border px-10 py-4 text-lg font-medium transition-all duration-200 hover:bg-[rgba(92,184,240,0.08)]"
            style={{ borderColor: 'var(--color-frost-border)', color: 'var(--color-frost-white)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(92,184,240,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-frost-border)')}
          >
            Live Demo
          </motion.a>
        </motion.div>

        <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewportOnce} transition={{ delay: 0.3 }} className="font-sans mt-6 text-sm" style={{ color: 'var(--color-frost-muted)' }}>
          Kein Abo zum Testen&nbsp;&middot;&nbsp;Deine Daten bleiben lokal&nbsp;&middot;&nbsp;macOS Desktop App
        </motion.p>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function FooterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <polygon points="16,2 26,9 26,23 16,30 6,23 6,9" fill="none" stroke="rgba(92,184,240,0.7)" strokeWidth="1.4" strokeLinejoin="round" />
        <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
        <line x1="6" y1="9" x2="26" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
        <line x1="26" y1="9" x2="6" y2="23" stroke="rgba(92,184,240,0.25)" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="2.5" fill="rgba(92,184,240,0.6)" />
        <circle cx="16" cy="16" r="1" fill="#5CB8F0" />
      </svg>
      <span className="font-display text-base font-semibold tracking-tight" style={{ color: 'var(--color-frost-white)' }}>Arctis</span>
    </div>
  )
}

const FOOTER_COLUMNS = [
  { heading: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'System Status'] },
  { heading: 'Resources', links: ['Documentation', 'Blog', 'API Reference', 'Community', 'Support'] },
  { heading: 'Company', links: ['About', 'Careers', 'Contact', 'Press Kit', 'Security'] },
]

function FooterSection() {
  return (
    <footer className="border-t" style={{ background: 'var(--color-arctic-base)', borderColor: 'rgba(39,47,58,0.5)' }}>
      <div className="section-container py-16 lg:py-20">
        {/* Columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <FooterLogo />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-frost-muted)' }}>Analysis infrastructure for futures markets.</p>
            <div className="mt-4 flex items-center gap-4">
              {[
                { label: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z' },
                { label: 'Twitter', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              ].map(({ label, path }) => (
                <button key={label} type="button" aria-label={`Arctis on ${label}`} className="transition-all duration-200" style={{ color: 'var(--color-frost-muted)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ice)'; e.currentTarget.style.transform = 'scale(1.1)' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-frost-muted)'; e.currentTarget.style.transform = 'scale(1)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path} /></svg>
                </button>
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-display mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-frost-white)' }}>{col.heading}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'var(--color-frost-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-frost-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-frost-muted)')}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div>
          <div className="h-px w-full my-8" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(53,61,72,0.8) 20%, rgba(53,61,72,0.8) 80%, transparent 100%)' }} />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display font-medium" style={{ color: 'var(--color-frost-white)' }}>Platform Updates</p>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-frost-muted)' }}>Release notes and platform announcements. No marketing email.</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center" aria-label="Newsletter signup">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                autoComplete="email"
                placeholder="trader@example.com"
                className="w-64 rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors duration-200 focus:ring-1 focus:ring-[rgba(92,184,240,0.5)]"
                style={{ background: 'var(--color-arctic-secondary)', borderColor: 'var(--color-frost-border-subtle)', color: 'var(--color-frost-white)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(92,184,240,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-frost-border-subtle)')}
              />
              <button type="submit" className="font-display ml-2 cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200" style={{ background: 'var(--color-ice)', color: 'var(--color-arctic-base)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-ice-light)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-ice)')}>
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div>
          <div className="h-px w-full mt-8 mb-6" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(53,61,72,0.8) 20%, rgba(53,61,72,0.8) 80%, transparent 100%)' }} />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs" style={{ color: 'var(--color-frost-muted)' }}>&copy; 2026 Arctis. All rights reserved.</p>
            <nav aria-label="Legal links">
              <ul className="flex items-center gap-6">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200" style={{ color: 'var(--color-frost-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-frost-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-frost-muted)')}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  useEffect(() => {
    const prev = document.body.style.overflow
    const prevH = document.body.style.height
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.body.style.overflow = prev
      document.body.style.height = prevH || '100vh'
    }
  }, [])

  return (
    <div style={{ background: 'var(--color-arctic-base)', minHeight: '100vh' }}>
      <LandingNavbar />
      <HeroSection />
      <SectionDivider />
      <TrustBarSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <ComparisonSection />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <FAQSection />
      <SectionDivider />
      <FinalCTASection />
      <FooterSection />
    </div>
  )
}
