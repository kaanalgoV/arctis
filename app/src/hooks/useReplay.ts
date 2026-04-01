import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '../store/settings'

interface SimStatus {
  active: boolean
  paused: boolean
  speed: number
  visible_bars: number
  total_bars: number
  progress_pct: number
  current_date?: string | null
  market?: string | null
  timeframe?: string | null
}

export function useReplay(market: string, timeframe: string) {
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeedLocal] = useState(5)
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
  }, [market, engineUrl])

  const start = async (date?: string) => {
    const targetDate = date ?? replayDate
    const params = new URLSearchParams({
      market,
      timeframe,
      speed: String(speed),
    })
    if (targetDate) params.set('date', targetDate)
    try {
      const r = await fetch(`${engineUrl}/api/sim/start?${params.toString()}`, { method: 'POST' })
      if (r.ok) {
        setIsPlaying(true)
        setIsPaused(false)
      }
    } catch {
      // Silently fail
    }
  }

  const pollStatus = useCallback(async () => {
    try {
      const r = await fetch(`${engineUrl}/api/sim/status`)
      if (!r.ok) return
      const data = (await r.json()) as SimStatus | null | undefined
      if (!data) return
      setSimStatus(data)
      setProgress(data.progress_pct ?? 0)
      if (!data.active) {
        setIsPlaying(false)
        setIsPaused(false)
        setProgress(100)
      } else if (data.paused) {
        setIsPaused(true)
      }
    } catch {
      // Silently fail
    }
  }, [engineUrl])

  const stop = async () => {
    try {
      await fetch(`${engineUrl}/api/sim/stop`, { method: 'POST' })
    } catch {
      // Silently fail
    }
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setSimStatus(null)
  }

  const pause = async () => {
    try {
      await fetch(`${engineUrl}/api/sim/pause`, { method: 'POST' })
    } catch {
      // Silently fail
    }
    setIsPaused(true)
    // Keep isPlaying true so the chart still shows replay bars
    // But stop the poll interval from running fast
  }

  const resume = async () => {
    try {
      await fetch(`${engineUrl}/api/sim/resume`, { method: 'POST' })
    } catch {
      // Silently fail
    }
    setIsPaused(false)
    setIsPlaying(true)
  }

  const seek = useCallback(async (position: number) => {
    // position is 0–100 (from ProgressTrack) — convert to 0.0–1.0 for backend
    const pct = position / 100
    try {
      await fetch(`${engineUrl}/api/sim/seek?position=${pct.toFixed(6)}`, { method: 'POST' })
      await pollStatus()
    } catch {
      // Silently fail — update local progress optimistically so UI stays responsive
      setProgress(position)
    }
  }, [engineUrl, pollStatus])

  const setSpeed = useCallback(async (newSpeed: number) => {
    setSpeedLocal(newSpeed)
    // If sim is active, update backend speed without restarting
    try {
      await fetch(`${engineUrl}/api/sim/speed?speed=${newSpeed}`, { method: 'POST' })
    } catch {
      // Silently fail — speed is already set locally for next start
    }
  }, [engineUrl])

  const changeDate = (direction: 'prev' | 'next') => {
    if (availableDates.length === 0 || !replayDate) return
    const idx = availableDates.indexOf(replayDate)
    if (direction === 'prev' && idx > 0) {
      setReplayDate(availableDates[idx - 1] ?? null)
    } else if (direction === 'next' && idx < availableDates.length - 1) {
      setReplayDate(availableDates[idx + 1] ?? null)
    }
  }

  // Poll status while playing (and not paused).
  // When paused, poll slowly just to keep UI in sync.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    // Paused: slow poll (1s) to keep status in sync
    // Playing: fast poll adapted to speed
    const intervalMs = isPaused
      ? 1000
      : Math.max(100, Math.round(1000 / speed))

    pollRef.current = setInterval(() => void pollStatus(), intervalMs)

    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isPlaying, isPaused, speed, pollStatus])

  return {
    isPlaying,
    isPaused,
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
