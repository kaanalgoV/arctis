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
  /** PUT current preferences to /api/workspace/preferences */
  saveToServer: () => Promise<void>
  /** GET preferences from server and merge into local state */
  loadFromServer: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
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

      saveToServer: async () => {
        const s = get()
        const body = {
          sound_alerts: s.soundAlerts,
          poll_interval: s.pollInterval,
          auto_reconnect: s.autoReconnect,
          risk_amount: s.riskAmount,
          max_trades: s.maxTrades,
        }
        try {
          await fetch(`${s.engineUrl}/api/workspace/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        } catch {
          // Engine offline — silently ignore, local state is source of truth
        }
      },

      loadFromServer: async () => {
        const s = get()
        try {
          const r = await fetch(`${s.engineUrl}/api/workspace/preferences`)
          if (!r.ok) return
          const data = (await r.json()) as {
            sound_alerts?: boolean
            poll_interval?: number
            auto_reconnect?: boolean
            risk_amount?: number
            max_trades?: number
          }
          // Merge server values into local state (server is authoritative for
          // preferences not yet persisted locally, local overlay state wins)
          set((prev) => ({
            soundAlerts: data.sound_alerts ?? prev.soundAlerts,
            pollInterval: data.poll_interval ?? prev.pollInterval,
            autoReconnect: data.auto_reconnect ?? prev.autoReconnect,
            riskAmount: data.risk_amount ?? prev.riskAmount,
            maxTrades: data.max_trades ?? prev.maxTrades,
          }))
        } catch {
          // Engine offline — keep local state as-is
        }
      },
    }),
    { name: 'arctis-settings' }
  )
)
