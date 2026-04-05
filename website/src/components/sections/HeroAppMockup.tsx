'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Candle {
  o: number
  h: number
  l: number
  c: number
  bull: boolean
}

interface Setup {
  candleIdx: number
  type: 'long' | 'short'
  label: string
  entry: number
  stop: number
  target: number
  rr: number
  confidence: number
}

// ─── Static Candle Data (first 27 candles) ─────────────────────────────────

const BASE_CANDLES: Candle[] = [
  { o: 23420, h: 23445, l: 23415, c: 23440, bull: true },
  { o: 23440, h: 23455, l: 23430, c: 23435, bull: false },
  { o: 23435, h: 23470, l: 23430, c: 23465, bull: true },
  { o: 23465, h: 23475, l: 23450, c: 23455, bull: false },
  { o: 23455, h: 23490, l: 23450, c: 23485, bull: true },
  { o: 23485, h: 23510, l: 23480, c: 23505, bull: true },
  { o: 23505, h: 23515, l: 23490, c: 23495, bull: false },
  { o: 23495, h: 23530, l: 23490, c: 23525, bull: true },
  { o: 23525, h: 23545, l: 23520, c: 23540, bull: true },
  { o: 23540, h: 23550, l: 23525, c: 23530, bull: false },
  { o: 23530, h: 23535, l: 23510, c: 23515, bull: false },
  { o: 23515, h: 23550, l: 23510, c: 23545, bull: true },
  { o: 23545, h: 23555, l: 23535, c: 23540, bull: false },
  { o: 23540, h: 23580, l: 23535, c: 23575, bull: true },
  { o: 23575, h: 23600, l: 23570, c: 23595, bull: true },
  { o: 23595, h: 23605, l: 23580, c: 23585, bull: false },
  { o: 23585, h: 23620, l: 23580, c: 23615, bull: true },
  { o: 23615, h: 23625, l: 23600, c: 23605, bull: false },
  { o: 23605, h: 23645, l: 23600, c: 23640, bull: true },
  { o: 23640, h: 23650, l: 23630, c: 23635, bull: false },
  { o: 23635, h: 23670, l: 23630, c: 23665, bull: true },
  { o: 23665, h: 23690, l: 23660, c: 23685, bull: true },
  { o: 23685, h: 23695, l: 23670, c: 23675, bull: false },
  { o: 23675, h: 23680, l: 23660, c: 23665, bull: false },
  { o: 23665, h: 23710, l: 23660, c: 23705, bull: true },
  { o: 23705, h: 23730, l: 23700, c: 23725, bull: true },
  { o: 23725, h: 23735, l: 23710, c: 23715, bull: false },
]

// Volume data (synthetic)
const BASE_VOLUMES = [
  120, 80, 150, 90, 160, 200, 110, 180, 170, 95,
  85, 190, 100, 210, 195, 105, 220, 115, 230, 100,
  200, 210, 120, 110, 240, 225, 130,
]

// ─── Setup Definitions ─────────────────────────────────────────────────────

const SETUPS: Setup[] = [
  {
    candleIdx: 13,
    type: 'long',
    label: 'ORB Breakout',
    entry: 23575,
    stop: 23535,
    target: 23655,
    rr: 2.0,
    confidence: 72,
  },
  {
    candleIdx: 24,
    type: 'long',
    label: 'IB Extension',
    entry: 23705,
    stop: 23660,
    target: 23795,
    rr: 2.0,
    confidence: 81,
  },
]

// ─── Chart Constants ───────────────────────────────────────────────────────

const PRICE_MIN = 23400
const PRICE_MAX = 23820
const CHART_W = 600
const CHART_H = 320
const VOL_H = 50
const CANDLE_W = 8
const CANDLE_GAP = 3
const CANDLE_STEP = CANDLE_W + CANDLE_GAP
const CHART_LEFT = 30
const CHART_RIGHT = CHART_W - 50
const TOTAL_CANDLES = 30

function priceToY(price: number): number {
  return CHART_H - ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * (CHART_H - 30)
}

function candleX(i: number): number {
  return CHART_LEFT + 10 + i * CANDLE_STEP
}

// Compute smooth EMA-like line through candle closes
function smoothLine(candles: Candle[], offset: number): string {
  const pts = candles.map((c, i) => ({
    x: candleX(i) + CANDLE_W / 2,
    y: priceToY(c.c + offset),
  }))
  if (pts.length < 2) return ''
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + CANDLE_STEP * 0.4
    const cp1y = pts[i - 1].y
    const cp2x = pts[i].x - CANDLE_STEP * 0.4
    const cp2y = pts[i].y
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i].x},${pts[i].y}`
  }
  return d
}

// ─── Live Price Simulation ─────────────────────────────────────────────────

function useLiveCandles(inView: boolean) {
  const [liveCandles, setLiveCandles] = useState<Candle[]>([])
  const [liveVolumes, setLiveVolumes] = useState<number[]>([])
  // How many candles have been "revealed" so far (for staggered entry animation)
  const [revealedCount, setRevealedCount] = useState(0)
  const tickRef = useRef(0)
  const candleTickRef = useRef(0)

  const generateTick = useCallback((current: number): number => {
    const delta = (Math.random() - 0.45) * 8
    return Math.round(Math.max(PRICE_MIN + 50, Math.min(PRICE_MAX - 30, current + delta)) * 100) / 100
  }, [])

  useEffect(() => {
    if (!inView) return

    let tickIntervalId: ReturnType<typeof setInterval> | null = null

    // Stagger candle reveal: reveal 1 candle every 80ms
    let revealed = 0
    const revealInterval = setInterval(() => {
      revealed++
      setRevealedCount(revealed)
      if (revealed >= BASE_CANDLES.length + 3) {
        clearInterval(revealInterval)
      }
    }, 80)

    // Start live candles after base candles are revealed
    const liveTimeout = setTimeout(() => {
      setLiveCandles([
        { o: 23715, h: 23755, l: 23710, c: 23750, bull: true },
        { o: 23750, h: 23770, l: 23745, c: 23765, bull: true },
        { o: 23765, h: 23775, l: 23755, c: 23770, bull: true },
      ])
      setLiveVolumes([250, 235, 180])
    }, BASE_CANDLES.length * 80)

    // Tick the last candle every 150ms
    const tickTimeout = setTimeout(() => {
      tickIntervalId = setInterval(() => {
        tickRef.current++

        setLiveCandles(prev => {
          if (prev.length === 0) return prev
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          const newClose = generateTick(last.c)
          last.c = newClose
          last.h = Math.max(last.h, newClose)
          last.l = Math.min(last.l, newClose)
          last.bull = newClose >= last.o
          updated[updated.length - 1] = last
          return updated
        })

        candleTickRef.current++
        if (candleTickRef.current >= 40) {
          candleTickRef.current = 0
          setLiveCandles(prev => {
            if (prev.length === 0) return prev
            const last = prev[prev.length - 1]
            const newOpen = last.c
            const newCandle: Candle = {
              o: newOpen,
              h: newOpen + 3,
              l: newOpen - 3,
              c: newOpen + 1,
              bull: true,
            }
            if (prev.length >= 3) return [...prev.slice(1), newCandle]
            return [...prev, newCandle]
          })
          setLiveVolumes(prev => {
            const newVol = 100 + Math.floor(Math.random() * 200)
            if (prev.length >= 3) return [...prev.slice(1), newVol]
            return [...prev, newVol]
          })
        }
      }, 150)
    }, (BASE_CANDLES.length + 3) * 80 + 200)

    return () => {
      clearInterval(revealInterval)
      clearTimeout(liveTimeout)
      clearTimeout(tickTimeout)
      if (tickIntervalId) clearInterval(tickIntervalId)
    }
  }, [inView, generateTick])

  const allCandles = [...BASE_CANDLES, ...liveCandles].slice(-TOTAL_CANDLES)
  const allVolumes = [...BASE_VOLUMES, ...liveVolumes].slice(-TOTAL_CANDLES)

  return {
    candles: allCandles,
    volumes: allVolumes,
    currentPrice: liveCandles.length > 0 ? liveCandles[liveCandles.length - 1].c : 23770,
    revealedCount,
  }
}

// ─── Sidebar Panels ─────────────────────────────────────────────────────────

function PanelHeader({ label, badge }: { label: string; badge?: string | number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#272F3A]">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#6E7681]">{'\u25BC'}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#949DA8]">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[rgba(90,174,216,0.15)] text-[#5AAED8]">
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Setup Card (Sidebar) ──────────────────────────────────────────────────

function SetupCard({ setup, active }: { setup: Setup; active?: boolean }) {
  const isLong = setup.type === 'long'
  return (
    <div className={`rounded border p-2 transition-colors ${active ? 'border-[#5AAED8] bg-[rgba(90,174,216,0.06)]' : 'border-[#272F3A] bg-[#0F1318]'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${isLong ? 'bg-[#34D399]' : 'bg-[#F87171]'}`} />
        <span className="font-mono text-[10px] text-[#F0F6FC] font-semibold">{setup.label}</span>
        {active && (
          <span className="ml-auto text-[8px] font-mono px-1 py-0.5 rounded bg-[rgba(52,211,153,0.15)] text-[#34D399]">
            ACTIVE
          </span>
        )}
      </div>
      <div className="font-mono text-[9px] text-[#6E7681] space-y-0.5">
        <div>Entry <span className="text-[#F0F6FC]">{setup.entry.toLocaleString()}</span>  Stop <span className="text-[#F87171]">{setup.stop.toLocaleString()}</span></div>
        <div>Target <span className="text-[#34D399]">{setup.target.toLocaleString()}</span>  R:R <span className="text-[#5AAED8]">{setup.rr.toFixed(1)}</span></div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-[#1A1F26] overflow-hidden">
          <div className="h-full rounded-full bg-[#5AAED8]" style={{ width: `${setup.confidence}%`, opacity: 0.7 }} />
        </div>
        <span className="font-mono text-[8px] text-[#5AAED8]">{setup.confidence}%</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HeroAppMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const { candles, volumes, currentPrice, revealedCount } = useLiveCandles(inView)

  // Only compute paths for revealed candles
  const revealedCandles = candles.slice(0, revealedCount)
  const vwapPath = smoothLine(revealedCandles, -15)
  const emaPath = smoothLine(revealedCandles, 10)

  // Price grid
  const priceLevels = [23500, 23600, 23700]
  const timeTicks = [
    { label: '09:30', i: 0 },
    { label: '10:00', i: 10 },
    { label: '10:30', i: 20 },
    { label: '11:00', i: 29 },
  ]

  const lastRevealed = revealedCandles[revealedCandles.length - 1]
  const lastPriceY = lastRevealed ? priceToY(lastRevealed.c) : priceToY(23420)
  const maxVol = Math.max(...volumes, 1)
  const priceUp = lastRevealed ? lastRevealed.c >= lastRevealed.o : true

  // Setups only appear when their candle has been revealed
  const visibleSetups = SETUPS.filter(s => s.candleIdx < revealedCount && s.candleIdx < candles.length)

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes onlinePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
        @keyframes priceTick {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>

      <div ref={ref} className="w-full max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="rounded-2xl overflow-hidden border border-[#353D48] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          style={{ background: '#0A0D12' }}
        >
          {/* ═══ Browser Chrome ═══ */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#272F3A]" style={{ background: 'rgba(10,13,18,0.9)' }}>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
              </div>
              <div className="font-mono text-[11px] text-[#6E7681] bg-[#0F1318] rounded px-3 py-0.5 border border-[#272F3A]">
                arctis://analysis/NQ
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-[#949DA8]">NQH5</span>
              <span className="text-[#F0F6FC]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={priceUp ? 'text-[#34D399]' : 'text-[#F87171]'}>
                {priceUp ? '\u2197' : '\u2198'} {priceUp ? '+' : ''}{((currentPrice - 23540) / 23540 * 100).toFixed(2)}%
              </span>
              <span className="flex items-center gap-1 text-[#34D399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" style={{ animation: 'livePulse 1.5s infinite' }} />
                LIVE
              </span>
            </div>
          </div>

          {/* ═══ App Grid ═══ */}
          <div className="grid grid-cols-[40px_1fr_220px] grid-rows-[auto_auto_1fr_auto] md:grid-cols-[40px_1fr_220px] max-md:grid-cols-[1fr] max-md:grid-rows-[auto_1fr_auto]">

            {/* ─── Left Nav Sidebar ─── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="row-span-3 border-r border-[#272F3A] flex flex-col items-center py-3 gap-3 max-md:hidden"
              style={{ background: '#080B0F' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="mb-2">
                <polygon points="10,1 18,6 18,14 10,19 2,14 2,6" fill="none" stroke="#5AAED8" strokeWidth="1.2" opacity="0.7" />
                <polygon points="10,4 15,7 15,13 10,16 5,13 5,7" fill="rgba(90,174,216,0.15)" stroke="#5AAED8" strokeWidth="0.6" opacity="0.5" />
              </svg>
              {[
                <rect key="bar" x="2" y="6" width="3" height="8" rx="0.5" fill="#949DA8" opacity="0.6" />,
                <><rect key="c1" x="3" y="4" width="2" height="10" rx="0.3" fill="#949DA8" opacity="0.6" /><line x1="4" y1="2" x2="4" y2="14" stroke="#949DA8" strokeWidth="0.8" opacity="0.4" /></>,
                <polygon key="bolt" points="8,2 4,9 7,9 6,14 12,7 9,7" fill="#949DA8" opacity="0.6" />,
                <polygon key="play" points="4,3 4,13 13,8" fill="#949DA8" opacity="0.6" />,
              ].map((icon, i) => (
                <div key={i} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1A1F26] cursor-pointer">
                  <svg width="14" height="16" viewBox="0 0 16 16">{icon}</svg>
                </div>
              ))}
              <div className="flex-1" />
              <svg width="14" height="14" viewBox="0 0 16 16" className="opacity-40">
                <circle cx="8" cy="8" r="3" fill="none" stroke="#949DA8" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="6" fill="none" stroke="#949DA8" strokeWidth="1.2" strokeDasharray="2 3" />
              </svg>
              <span className="text-[8px] font-mono text-[#6E7681]">v0.1</span>
            </motion.div>

            {/* ─── Top Bar ─── */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="col-span-1 md:col-span-2 border-b border-[#272F3A] px-3 py-1.5"
              style={{ background: '#0F1318' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-y-1">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[#F0F6FC] font-semibold">NQM5</span>
                  <span className="text-[#F0F6FC]" style={{ fontVariantNumeric: 'tabular-nums', animation: 'priceTick 0.3s' }}>
                    {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={priceUp ? 'text-[#34D399]' : 'text-[#F87171]'}>
                    +{(currentPrice - BASE_CANDLES[0].o).toFixed(2)} (+{((currentPrice - BASE_CANDLES[0].o) / BASE_CANDLES[0].o * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-[#6E7681] max-md:hidden">
                  <span>RVOL <span className="text-[#949DA8]">1.2x</span></span>
                  <span className="text-[#272F3A]">|</span>
                  <span>RSI <span className="text-[#949DA8]">62.4</span></span>
                  <span className="text-[#272F3A]">|</span>
                  <span>DIV <span className="text-[#34D399]">Bullish</span></span>
                  <span className="text-[#272F3A]">|</span>
                  <span>EMA <span className="text-[#34D399]">Bull</span></span>
                  <span className="text-[#272F3A]">|</span>
                  <span>VWAP <span className="text-[#34D399]">Above</span></span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-[#6E7681] max-md:hidden">
                  <span>SESSION <span className="text-[#949DA8]">NY Open 67%</span></span>
                  <span className="text-[#272F3A]">|</span>
                  <span>BARS <span className="text-[#949DA8]">1637</span></span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 max-md:hidden">
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-[rgba(90,174,216,0.15)] text-[#5AAED8] border border-[rgba(90,174,216,0.3)]">LIVE</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded text-[#6E7681]">REPLAY</span>
              </div>
            </motion.div>

            {/* ─── OHLCV Strip ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="col-span-1 md:col-span-1 border-b border-[#272F3A] px-3 py-1 font-mono text-[9px] text-[#6E7681] max-md:hidden"
              style={{ background: '#0D1016' }}
            >
              {lastRevealed && (
                <>
                  <span className="text-[#949DA8]">NQM5</span>
                  {' '}O:<span className="text-[#F0F6FC]">{lastRevealed.o.toLocaleString()}</span>
                  {' '}H:<span className="text-[#F0F6FC]">{lastRevealed.h.toLocaleString()}</span>
                  {' '}L:<span className="text-[#F0F6FC]">{lastRevealed.l.toLocaleString()}</span>
                  {' '}C:<span className={priceUp ? 'text-[#34D399]' : 'text-[#F87171]'}>{lastRevealed.c.toLocaleString()}</span>
                  {' '}V:<span className="text-[#F0F6FC]">1.8K</span>
                </>
              )}
            </motion.div>

            {/* ─── OHLCV strip spacer for right sidebar row ─── */}
            <div className="border-b border-[#272F3A] max-md:hidden" style={{ background: 'rgba(15,19,24,0.95)' }} />

            {/* ─── Chart Area ─── */}
            <div className="relative overflow-hidden" style={{ background: '#0A0D12' }}>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H + VOL_H + 20}`}
                className="w-full h-auto"
                style={{ display: 'block' }}
              >
                {/* Grid lines */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {priceLevels.map((p) => (
                    <line key={p} x1={CHART_LEFT} y1={priceToY(p)} x2={CHART_RIGHT + 10} y2={priceToY(p)} stroke="rgba(92,184,240,0.04)" strokeWidth="1" />
                  ))}
                  {timeTicks.map(({ i }) => (
                    <line key={i} x1={candleX(i) + CANDLE_W / 2} y1={10} x2={candleX(i) + CANDLE_W / 2} y2={CHART_H} stroke="rgba(92,184,240,0.04)" strokeWidth="1" />
                  ))}
                </motion.g>

                {/* Y-axis price labels */}
                {priceLevels.map((p) => (
                  <text key={p} x={CHART_RIGHT + 16} y={priceToY(p) + 3} fill="#6E7681" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                    {p.toLocaleString()}
                  </text>
                ))}

                {/* X-axis time labels */}
                {timeTicks.map(({ label, i }) => (
                  <text key={label} x={candleX(i) + CANDLE_W / 2} y={CHART_H + 10} fill="#6E7681" fontSize="7" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                    {label}
                  </text>
                ))}

                {/* Session separators */}
                {[10, 20].map((idx) => (
                  <g key={`sess-${idx}`}>
                    <line x1={candleX(idx) + CANDLE_W / 2} y1={15} x2={candleX(idx) + CANDLE_W / 2} y2={CHART_H - 5} stroke="rgba(90,174,216,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
                    <text x={candleX(idx) + CANDLE_W / 2} y={12} fill="rgba(90,174,216,0.25)" fontSize="6" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                      SESSION
                    </text>
                  </g>
                ))}

                {/* Supply zone (top) */}
                <rect x={CHART_LEFT} y={priceToY(23780)} width={CHART_RIGHT - CHART_LEFT} height={priceToY(23740) - priceToY(23780)} fill="#F87171" rx="2" opacity="0.06" />

                {/* Demand zone (bottom) */}
                <rect x={CHART_LEFT} y={priceToY(23470)} width={CHART_RIGHT - CHART_LEFT} height={priceToY(23420) - priceToY(23470)} fill="#5AAED8" rx="2" opacity="0.06" />

                {/* Candlesticks — only draw revealed candles */}
                {candles.map((c, i) => {
                  if (i >= revealedCount) return null
                  const x = candleX(i)
                  const bodyTop = priceToY(Math.max(c.o, c.c))
                  const bodyBot = priceToY(Math.min(c.o, c.c))
                  const bodyH = Math.max(bodyBot - bodyTop, 1)
                  const wickX = x + CANDLE_W / 2
                  const color = c.bull ? '#34D399' : '#F87171'
                  const opacity = c.bull ? 0.85 : 0.75
                  const isLast = i === revealedCount - 1
                  return (
                    <g key={i}>
                      <line x1={wickX} y1={priceToY(c.h)} x2={wickX} y2={priceToY(c.l)} stroke={color} strokeWidth="1" opacity={opacity * 0.7} />
                      <rect x={x} y={bodyTop} width={CANDLE_W} height={bodyH} fill={color} opacity={opacity} rx="0.5" />
                      {isLast && (
                        <rect x={x - 1} y={bodyTop - 1} width={CANDLE_W + 2} height={bodyH + 2} fill="none" stroke={color} strokeWidth="0.5" opacity={0.4} rx="1" style={{ animation: 'breathe 1.5s infinite' }} />
                      )}
                    </g>
                  )
                })}

                {/* VWAP line */}
                <path d={vwapPath} fill="none" stroke="rgba(168,130,240,0.45)" strokeWidth="1.4" />

                {/* EMA line */}
                <path d={emaPath} fill="none" stroke="rgba(92,184,240,0.45)" strokeWidth="1.5" />

                {/* Last price line + pulsing dot — only after some candles revealed */}
                {revealedCount > 3 && lastRevealed && (
                  <>
                    <line x1={CHART_LEFT} y1={lastPriceY} x2={CHART_RIGHT + 10} y2={lastPriceY} stroke={priceUp ? '#34D399' : '#F87171'} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
                    <circle cx={candleX(revealedCount - 1) + CANDLE_W + 6} cy={lastPriceY} r="3" fill={priceUp ? '#34D399' : '#F87171'} style={{ animation: 'breathe 2s infinite' }} />
                    <text x={CHART_RIGHT + 14} y={lastPriceY + 3} fill={priceUp ? '#34D399' : '#F87171'} fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                      {Math.round(revealedCount >= BASE_CANDLES.length + 3 ? currentPrice : lastRevealed.c).toLocaleString()}
                    </text>
                  </>
                )}

                {/* ─── Setup Entry Markers — appear when candle is revealed ─── */}
                {visibleSetups.map((setup, si) => {
                  const cx = candleX(setup.candleIdx) + CANDLE_W / 2
                  const candle = candles[setup.candleIdx]
                  if (!candle) return null
                  const isLong = setup.type === 'long'
                  const markerY = isLong ? priceToY(candle.l) + 5 : priceToY(candle.h) - 5
                  const color = isLong ? '#34D399' : '#F87171'
                  const entryY = priceToY(setup.entry)
                  const stopY = priceToY(setup.stop)
                  const targetY = priceToY(setup.target)

                  return (
                    <motion.g
                      key={`setup-${si}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
                      style={{ transformOrigin: `${cx}px ${markerY}px` }}
                    >
                      {/* Entry arrow */}
                      {isLong ? (
                        <polygon points={`${cx},${markerY} ${cx - 4},${markerY + 8} ${cx + 4},${markerY + 8}`} fill={color} opacity="0.8" />
                      ) : (
                        <polygon points={`${cx},${markerY} ${cx - 4},${markerY - 8} ${cx + 4},${markerY - 8}`} fill={color} opacity="0.8" />
                      )}

                      {/* Label */}
                      <text x={cx} y={isLong ? markerY + 18 : markerY - 14} fill={color} fontSize="6" fontFamily="'JetBrains Mono', monospace" textAnchor="middle" fontWeight="600">
                        {setup.label.toUpperCase()}
                      </text>

                      {/* Entry line */}
                      <motion.line
                        x1={cx + 6} y1={entryY} x2={CHART_RIGHT + 10} y2={entryY}
                        stroke={color} strokeWidth="0.5" strokeDasharray="2 2"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 0.2, duration: 0.3 }}
                      />

                      {/* Stop line */}
                      <motion.line
                        x1={cx} y1={stopY} x2={cx + 30} y2={stopY}
                        stroke="#F87171" strokeWidth="0.5" strokeDasharray="1 1"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.3, duration: 0.3 }}
                      />

                      {/* Target line */}
                      <motion.line
                        x1={cx} y1={targetY} x2={cx + 30} y2={targetY}
                        stroke="#34D399" strokeWidth="0.5" strokeDasharray="1 1"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.4, duration: 0.3 }}
                      />

                      {/* R:R label */}
                      <motion.text
                        x={cx + 33} y={targetY + 3} fill="#5AAED8" fontSize="6" fontFamily="'JetBrains Mono', monospace"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        {setup.rr.toFixed(1)}R
                      </motion.text>
                    </motion.g>
                  )
                })}

                {/* Volume bars — only revealed */}
                {volumes.map((v, i) => {
                  if (i >= revealedCount) return null
                  const barH = (v / maxVol) * VOL_H
                  const color = candles[i]?.bull ? '#34D399' : '#F87171'
                  return (
                    <rect
                      key={`vol-${i}`}
                      x={candleX(i)}
                      y={CHART_H + 15 + (VOL_H - barH)}
                      width={CANDLE_W}
                      height={barH}
                      fill={color}
                      opacity={0.25}
                      rx="0.3"
                    />
                  )
                })}
              </svg>
            </div>

            {/* ─── Right Sidebar ─── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 2.0, duration: 0.4 }}
              className="row-span-2 border-l border-[#272F3A] overflow-y-auto max-md:hidden"
              style={{ background: 'rgba(15,19,24,0.95)', maxHeight: 480 }}
            >
              {/* SETUPS Panel — cards appear as their candle is revealed */}
              <div>
                <PanelHeader label="Setups" badge={visibleSetups.length || '\u2013'} />
                <div className="px-3 py-2 border-b border-[#272F3A] space-y-2">
                  {visibleSetups.length === 0 ? (
                    <div className="font-mono text-[9px] text-[#6E7681] text-center py-2">Scanning...</div>
                  ) : (
                    visibleSetups.map((setup, i) => (
                      <motion.div
                        key={setup.label}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        transition={{ duration: 0.35 }}
                      >
                        <SetupCard setup={setup} active={i === visibleSetups.length - 1} />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* SIGNALS Panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 2.15, duration: 0.3 }}
              >
                <PanelHeader label="Signals" badge={2} />
                <div className="px-3 py-2 border-b border-[#272F3A] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#949DA8]">BIAS</span>
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(52,211,153,0.15)] text-[#34D399]">LONG +7</span>
                  </div>
                  <div className="border-t border-[#272F3A]" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#5AAED8]" />
                      <span className="font-mono text-[9px] text-[#F0F6FC]">IB Extension</span>
                    </div>
                    <div className="font-mono text-[8px] text-[#6E7681] pl-2.5">
                      Entry 23,705 {'\u2192'} 23,780
                    </div>
                  </div>
                  <div className="border-t border-[#272F3A]" />
                  <div className="text-right font-mono text-[8px] text-[#6E7681]">
                    <span className="w-1 h-1 rounded-full bg-[#34D399] inline-block mr-1" style={{ animation: 'livePulse 1.5s infinite' }} />
                    0s ago
                  </div>
                </div>
              </motion.div>

              {/* SESSION Panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 2.3, duration: 0.3 }}
              >
                <PanelHeader label="Session" badge="NY" />
                <div className="px-3 py-2 border-b border-[#272F3A] font-mono text-[9px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#949DA8]">09:47 ET</span>
                    <span className="text-[#6E7681]">RTH</span>
                  </div>
                  {[
                    { label: 'Overnight', time: '18:00-09:30', status: 'done' as const },
                    { label: 'Pre-Mkt', time: '08:00-09:30', status: 'done' as const },
                    { label: 'IB', time: '09:30-10:00', status: 'active' as const, pct: 57 },
                    { label: 'AM', time: '10:00-12:00', status: 'upcoming' as const },
                    { label: 'Lunch', time: '12:00-13:30', status: 'upcoming' as const },
                    { label: 'PM', time: '13:30-16:00', status: 'upcoming' as const },
                  ].map(({ label, time, status, pct }) => (
                    <div key={label} className="flex items-center gap-2 mb-1">
                      <span className={`w-14 text-right ${status === 'active' ? 'text-[#F0F6FC]' : status === 'done' ? 'text-[#6E7681]' : 'text-[#4A5158]'}`}>
                        {label}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-[#1A1F26] overflow-hidden">
                        {status === 'done' && (
                          <div className="h-full w-full rounded-full bg-[#34D399]" style={{ opacity: 0.25 }} />
                        )}
                        {status === 'active' && (
                          <div className="h-full rounded-full bg-[#5AAED8]" style={{ width: `${pct}%`, opacity: 0.7 }} />
                        )}
                      </div>
                      <span className={`w-8 text-right ${status === 'active' ? 'text-[#5AAED8]' : status === 'done' ? 'text-[#6E7681]' : 'text-[#4A5158]'}`}>
                        {status === 'active' ? `${pct}%` : status === 'done' ? '\u2713' : '\u2013'}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1.5 border-t border-[#272F3A] pt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6E7681]">IB Range</span>
                      <span className="text-[#949DA8]">23,640 - 23,715</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[#6E7681]">IB End in</span>
                      <span className="text-[#5AAED8]">13m</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CONFLUENCE Panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 2.45, duration: 0.3 }}
              >
                <PanelHeader label="Confluence" badge={8} />
                <div className="px-3 py-2 border-b border-[#272F3A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-[#F0F6FC]">8 / 14</span>
                    <span className="font-mono text-[9px] font-semibold text-[#34D399]">HIGH</span>
                  </div>
                  <div className="font-mono text-[8px] text-[#6E7681] mb-1 uppercase tracking-wider">{'\u2500\u2500'} Bullish {'\u2500\u2500'}</div>
                  {[
                    { label: 'Marktstruktur', val: '+2', bull: true },
                    { label: 'EMA Ribbon', val: '+2', bull: true },
                    { label: 'VWAP Bias', val: '+2', bull: true },
                    { label: 'RSI', val: '+1', bull: true },
                    { label: 'Volume', val: '+1', bull: true },
                    { label: 'Prev Day', val: '-1', bull: false },
                    { label: 'Session', val: '+1', bull: true },
                  ].map(({ label, val, bull }) => (
                    <div key={label} className="flex items-center justify-between font-mono text-[9px] py-0.5">
                      <span className="text-[#949DA8]">{label}</span>
                      <span className={bull ? 'text-[#34D399]' : 'text-[#F87171]'}>{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* BIAS Panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 2.6, duration: 0.3 }}
              >
                <PanelHeader label="Bias" badge="LONG" />
                <div className="px-3 py-2">
                  <div className="font-mono text-[14px] text-[#F0F6FC] font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="font-mono text-[9px] text-[#34D399] mt-0.5">+{(currentPrice - 23555).toFixed(2)} above VWAP</div>
                  <div className="font-mono text-[9px] text-[#949DA8] mt-1">Score: <span className="text-[#34D399]">+7</span> / 10</div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[#1A1F26] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#F87171] via-[#FBBF24] to-[#34D399]" style={{ width: '100%', opacity: 0.3 }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#34D399] border border-[#0A0D12]" style={{ left: '70%', transform: 'translate(-50%, -50%)' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* ─── Status Bar ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 2.8, duration: 0.3 }}
              className="col-span-1 md:col-span-2 border-t border-[#272F3A] px-3 py-1 flex items-center justify-between font-mono text-[9px] text-[#6E7681]"
              style={{ background: '#0D1016' }}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" style={{ animation: 'onlinePulse 1.5s infinite' }} />
                  <span className="text-[#34D399]">ONLINE</span>
                </span>
                <span className="text-[#272F3A]">|</span>
                <span>Latency: <span className="text-[#949DA8]">12ms</span></span>
                <span className="text-[#272F3A]">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />DB
                </span>
                <span className="text-[#272F3A]">|</span>
                <span>1637 bars loaded</span>
                <span className="text-[#272F3A]">|</span>
                <span>Last bar: <span className="text-[#949DA8]">09:47:00 ET</span></span>
              </div>
              <span className="text-[#6E7681] max-md:hidden">Arctis Engine v0.1.0</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
