import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { config } from '../lib/config'

interface SettingsState {
  engineUrl: string
  autoReconnect: boolean
  pollInterval: number
  maxTrades: number
  riskAmount: number
  overlays: { vwap: boolean; ema: boolean; volume: boolean; vp: boolean; levels: boolean; zones: boolean }
  soundAlerts: boolean
  setEngineUrl: (url: string) => void
  setAutoReconnect: (v: boolean) => void
  setPollInterval: (ms: number) => void
  setMaxTrades: (n: number) => void
  setRiskAmount: (n: number) => void
  toggleOverlay: (key: string) => void
  setSoundAlerts: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      engineUrl: config.apiBase,
      autoReconnect: true,
      pollInterval: 5000,
      maxTrades: 10,
      riskAmount: 500,
      overlays: { vwap: true, ema: true, volume: true, vp: true, levels: true, zones: false },
      soundAlerts: false,
      setEngineUrl: (url) => set({ engineUrl: url }),
      setAutoReconnect: (v) => set({ autoReconnect: v }),
      setPollInterval: (ms) => set({ pollInterval: ms }),
      setMaxTrades: (n) => set({ maxTrades: n }),
      setRiskAmount: (n) => set({ riskAmount: n }),
      toggleOverlay: (key) =>
        set((s) => ({
          overlays: {
            ...s.overlays,
            [key]: !s.overlays[key as keyof typeof s.overlays],
          },
        })),
      setSoundAlerts: (v) => set({ soundAlerts: v }),
    }),
    { name: 'arctis-settings' }
  )
)
