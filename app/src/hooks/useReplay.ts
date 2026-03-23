import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settings'

interface SimStatus {
  active: boolean
  speed: number
  visible_bars: number
  total_bars: number
  progress_pct: number
}

export function useReplay(market: string, timeframe: string) {
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [replayDate, setReplayDate] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [simStatus, setSimStatus] = useState<SimStatus | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // Fetch available dates when market changes
  useEffect(() => {
    fetch(`${engineUrl}/api/replay/dates?market=${market}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.dates && Array.isArray(d.dates)) {
          setAvailableDates(d.dates as string[])
          // Default to last available date if none selected
          if (!replayDate && d.dates.length > 0) {
            setReplayDate(d.dates[d.dates.length - 1] as string)
          }
        }
      })
      .catch(() => {
        // Silently fail — engine may be unreachable
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market])

  const start = async (date?: string) => {
    const targetDate = date ?? replayDate
    const params = new URLSearchParams({
      market,
      timeframe,
      speed: String(speed),
    })
    if (targetDate) params.set('date', targetDate)
    try {
      await fetch(`${engineUrl}/api/sim/start?${params.toString()}`, { method: 'POST' })
      setIsPlaying(true)
    } catch {
      // Silently fail
    }
  }

  const stop = async () => {
    try {
      await fetch(`${engineUrl}/api/sim/stop`, { method: 'POST' })
    } catch {
      // Silently fail
    }
    setIsPlaying(false)
    setProgress(0)
    setSimStatus(null)
  }

  // Pause: stop polling without resetting state or calling backend stop.
  // The sim keeps running server-side; resume() re-enables polling.
  const pause = () => {
    setIsPlaying(false)
    // simStatus and progress are intentionally preserved for resume
  }

  const resume = () => {
    setIsPlaying(true)
  }

  const seek = async (progressPct: number) => {
    // Stop current sim and restart at approximate bar index
    // For now: restart from beginning (full seek not yet supported by backend)
    setProgress(progressPct)
  }

  const changeDate = (direction: 'prev' | 'next') => {
    if (availableDates.length === 0 || !replayDate) return
    const idx = availableDates.indexOf(replayDate)
    if (direction === 'prev' && idx > 0) {
      setReplayDate(availableDates[idx - 1] ?? null)
    } else if (direction === 'next' && idx < availableDates.length - 1) {
      setReplayDate(availableDates[idx + 1] ?? null)
    }
  }

  // Poll status while playing — interval adapts to speed so bars stream smoothly.
  // At speed N bars/s we want at most ~2 bars per poll cycle, so interval = max(100, 1000/speed) ms.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const intervalMs = Math.max(100, Math.round(1000 / speed))

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${engineUrl}/api/sim/status`)
        if (!r.ok) return
        const data = (await r.json()) as SimStatus | null | undefined
        if (!data) return
        setSimStatus(data)
        setProgress(data.progress_pct ?? 0)
        if (!data.active) {
          setIsPlaying(false)
          setProgress(100)
        }
      } catch {
        // Silently fail
      }
    }, intervalMs)

    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isPlaying, speed])

  return {
    isPlaying,
    speed,
    progress,
    simStatus,
    replayDate,
    availableDates,
    start,
    stop,
    pause,
    resume,
    seek,
    changeDate,
    setSpeed,
    setReplayDate,
  }
}
