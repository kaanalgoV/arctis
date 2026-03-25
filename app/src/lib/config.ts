// Canonical API configuration
// Environment variable takes priority, then Vite env, then default
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:28080'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

export const config = {
  apiBase: API_BASE,
  wsBase: WS_BASE,
} as const
