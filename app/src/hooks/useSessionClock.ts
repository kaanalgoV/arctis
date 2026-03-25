import { useState, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Session boundaries (CME Futures, ET)
// All times in minutes-since-midnight ET
// ---------------------------------------------------------------------------

interface SessionBoundary {
  key: string
  displayName: string
  /** Start in minutes since midnight ET */
  startMin: number
  /** End in minutes since midnight ET */
  endMin: number
}

// NOTE: Overnight spans across midnight.
// We split it conceptually as two bands:
//   band A: 18:00 (1080) -> 24:00 (1440)  [same calendar day]
//   band B: 00:00 (0)    -> 04:00 (240)   [next calendar day]
// The lookup logic handles this special case.
const SESSIONS: SessionBoundary[] = [
  { key: 'overnight', displayName: 'Overnight', startMin: 0, endMin: 240 },       // 00:00-04:00
  { key: 'premarket', displayName: 'Pre-Mkt', startMin: 240, endMin: 570 },        // 04:00-09:30
  { key: 'ny_open', displayName: 'NY Open', startMin: 570, endMin: 630 },          // 09:30-10:30
  { key: 'midday', displayName: 'Midday', startMin: 630, endMin: 840 },            // 10:30-14:00
  { key: 'afternoon', displayName: 'Afternoon', startMin: 840, endMin: 900 },      // 14:00-15:00
  { key: 'power_hour', displayName: 'Power Hr', startMin: 900, endMin: 960 },      // 15:00-16:00
  { key: 'after_hours', displayName: 'After Hrs', startMin: 960, endMin: 1080 },   // 16:00-18:00
  // overnight 18:00-24:00 handled via OVERNIGHT_EVENING_START
]

const OVERNIGHT_EVENING_START = 1080 // 18:00 ET

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface SessionClockState {
  /** Session key, e.g. "ny_open", "premarket" */
  session: string
  /** Human-readable display name, e.g. "NY Open" */
  displayName: string
  /** Progress through current session, 0-1 */
  progress: number
  /** Seconds remaining until next session boundary */
  timeToNextSec: number
  /** Formatted time-to-next, e.g. "1h 23m" or "45m" */
  timeToNextLabel: string
  /** True during 09:30-16:00 ET (regular trading hours) */
  isRTH: boolean
  /** ET time string at last update, e.g. "14:22" */
  etTimeLabel: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns minutes since midnight in ET for the given Date.
 */
function getETMinutes(date: Date): number {
  // Use Intl.DateTimeFormat to get the ET wall-clock components
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })

  const parts = fmt.formatToParts(date)
  const get = (type: string) => {
    const p = parts.find((x) => x.type === type)
    return p ? parseInt(p.value, 10) : 0
  }

  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')

  // hour12:false returns 24 for midnight on some engines — normalise
  const normHour = hour === 24 ? 0 : hour
  return normHour * 60 + minute + second / 60
}

/**
 * Returns formatted ET time label "HH:MM".
 */
function getETTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format seconds as "Xh Ym" or "Ym" or "Xs".
 */
function formatTimeRemaining(totalSec: number): string {
  if (totalSec <= 0) return '0s'
  const sec = Math.floor(totalSec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m > 0) return s > 0 && m < 5 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

function computeSessionState(now: Date): SessionClockState {
  const etMinutes = getETMinutes(now)
  const etLabel = getETTimeLabel(now)

  // Determine current session
  let current: SessionBoundary | undefined
  let nextStartMin: number
  let durationMin: number

  if (etMinutes >= OVERNIGHT_EVENING_START) {
    // Evening overnight: 18:00-24:00
    current = SESSIONS.find((s) => s.key === 'overnight')!
    durationMin = (1440 - OVERNIGHT_EVENING_START) + 240 // 18:00->next 04:00 = 6h+4h = 10h = 600m
    // time remaining = minutes until 04:00 next day = (1440 - etMinutes) + 240
    const remMin = (1440 - etMinutes) + 240
    const progress = Math.min(1, Math.max(0, 1 - remMin / durationMin))
    const isRTH = false
    return {
      session: current.key,
      displayName: current.displayName,
      progress,
      timeToNextSec: remMin * 60,
      timeToNextLabel: formatTimeRemaining(remMin * 60),
      isRTH,
      etTimeLabel: etLabel,
    }
  }

  // Search in daytime sessions (including early overnight 0-04:00)
  current = SESSIONS.find(
    (s) => etMinutes >= s.startMin && etMinutes < s.endMin,
  )

  if (!current) {
    // Fallback: shouldn't happen, but treat as overnight
    current = SESSIONS.find((s) => s.key === 'overnight')!
    return {
      session: current.key,
      displayName: current.displayName,
      progress: 0,
      timeToNextSec: 0,
      timeToNextLabel: '—',
      isRTH: false,
      etTimeLabel: etLabel,
    }
  }

  // For early overnight (0:00-04:00), duration calculation is special:
  // the session started at 18:00 yesterday. Duration = 10h = 600m.
  if (current.key === 'overnight') {
    durationMin = 600 // 18:00 -> 04:00 next day
    // etMinutes is 0-240; elapsed from overnight start = (1440 - 1080) + etMinutes = 360 + etMinutes
    const elapsedMin = 360 + etMinutes
    const progress = Math.min(1, Math.max(0, elapsedMin / durationMin))
    const remMin = current.endMin - etMinutes
    nextStartMin = current.endMin
    return {
      session: current.key,
      displayName: current.displayName,
      progress,
      timeToNextSec: remMin * 60,
      timeToNextLabel: formatTimeRemaining(remMin * 60),
      isRTH: false,
      etTimeLabel: etLabel,
    }
  }

  durationMin = current.endMin - current.startMin
  const elapsedMin = etMinutes - current.startMin
  const progress = Math.min(1, Math.max(0, elapsedMin / durationMin))
  const remMin = current.endMin - etMinutes
  nextStartMin = current.endMin

  const isRTH = etMinutes >= 570 && etMinutes < 960 // 09:30-16:00

  return {
    session: current.key,
    displayName: current.displayName,
    progress,
    timeToNextSec: Math.max(0, remMin * 60),
    timeToNextLabel: formatTimeRemaining(Math.max(0, remMin * 60)),
    isRTH,
    etTimeLabel: etLabel,
  }

  void nextStartMin // used only implicitly via remMin
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Real-time session clock that updates every 30 seconds.
 * Returns the current session based on wall clock time (ET).
 * Independent of API data — works even when API is slow.
 */
export function useSessionClock(): SessionClockState {
  const [state, setState] = useState<SessionClockState>(() =>
    computeSessionState(new Date()),
  )

  useEffect(() => {
    // Update immediately, then every 30 seconds
    setState(computeSessionState(new Date()))

    const interval = setInterval(() => {
      setState(computeSessionState(new Date()))
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  return state
}
