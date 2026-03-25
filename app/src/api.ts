import type { Bar, MarketsResponse, HealthResponse } from './types/contracts'
import type { ChartDrawing } from './types/drawing'
import { config } from './lib/config'

/**
 * Returns the current API base URL.
 * Reads from settings store at call-time so runtime changes to engineUrl take effect.
 * Lazy import avoids circular dependencies.
 */
function getBaseUrl(): string {
  try {
    // Dynamic import from settings store — only available in browser context
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSettingsStore } = require('./store/settings') as { useSettingsStore: { getState: () => { engineUrl: string } } }
    return useSettingsStore.getState().engineUrl
  } catch {
    return config.apiBase
  }
}

async function fetchJSON<T>(path: string, params?: Record<string, string>): Promise<T> {
  const BASE_URL = getBaseUrl()
  const url = new URL(path, BASE_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchMarkets(): Promise<MarketsResponse> {
  return fetchJSON<MarketsResponse>('/api/markets')
}

export async function fetchBars(symbol: string, days: number, timeframe: string): Promise<{ bars: Bar[], count: number }> {
  return fetchJSON('/api/db/bars', { symbol, days: String(days), timeframe })
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJSON<HealthResponse>('/health')
}

// Legacy health check alias for backward compatibility
export async function checkHealth(): Promise<HealthResponse> {
  return fetchHealth()
}

// Analysis endpoints
export async function fetchSessions(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/sessions', { market, timeframe })
}

export async function fetchConfluence(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/confluence', { market, timeframe })
}

export async function fetchPatterns(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/patterns', { market, timeframe })
}

export async function fetchIndicators(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/indicators', { market, timeframe })
}

export async function fetchVolume(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/volume', { market, timeframe })
}

export async function fetchStructure(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/structure', { market, timeframe })
}

export async function fetchConfig() {
  return fetchJSON('/api/config')
}

export async function fetchRiskCheck() {
  return fetchJSON('/api/risk/daily-check')
}

export async function fetchBias(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/bias', { market, timeframe })
}

export async function fetchZones(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/zones', { market, timeframe })
}

export async function fetchSignals(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/signals', { market, timeframe })
}

/**
 * Fetch all analysis data in a single request.
 *
 * Returns sessions, indicators, confluence, patterns, volume, structure,
 * bias, zones, and signals atomically so all panels share the same data.
 *
 * Failed sub-analyses are returned as null with the error message recorded
 * under the top-level `errors` key — the whole request never fails because
 * of one failing sub-analysis.
 *
 * @param market    - Market symbol, e.g. "NQ" or "ES"
 * @param timeframe - Bar timeframe, e.g. "15min" (default) or "1min", "5min"
 * @param days      - Number of calendar days to include (default 5)
 */
export async function fetchSnapshot(
  market: string,
  timeframe = '15min',
  days = 5,
) {
  return fetchJSON('/api/snapshot', {
    market,
    timeframe,
    days: String(days),
  })
}

// Config management
export async function saveConfig(cfg: Record<string, unknown>) {
  const url = new URL('/api/config', getBaseUrl())
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// CSV import
export async function importCSV(
  file: File,
  market: 'ES' | 'NQ',
  timeframe: '1min' | '5min',
): Promise<{ market: string; timeframe: string; bars_imported: number }> {
  const form = new FormData()
  form.append('file', file)
  form.append('market', market)
  form.append('timeframe', timeframe)
  const url = new URL('/api/import', getBaseUrl())
  const res = await fetch(url.toString(), { method: 'POST', body: form })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Sim controls
export async function simStart(market: string, timeframe: string, speed = 10) {
  const url = new URL('/api/sim/start', getBaseUrl())
  url.searchParams.set('market', market)
  url.searchParams.set('timeframe', timeframe)
  url.searchParams.set('speed', String(speed))
  const res = await fetch(url.toString(), { method: 'POST' })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function simStop() {
  const url = new URL('/api/sim/stop', getBaseUrl())
  const res = await fetch(url.toString(), { method: 'POST' })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function simStatus() {
  return fetchJSON('/api/sim/status')
}

// Risk
export async function calculatePositionSize(stopDistance: number, market: string) {
  const url = new URL('/api/risk/position-size', getBaseUrl())
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stop_distance: stopDistance, market }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

// Warnings and probability (legacy endpoints)
export async function fetchWarnings(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/warnings', { market, timeframe })
}

export async function fetchProbability(market: string, timeframe: string) {
  return fetchJSON('/api/analysis/probability', { market, timeframe })
}

// ============ Drawing API ============

export interface DrawingsResponse {
  symbol: string
  timeframe: string
  drawings: ChartDrawing[]
}

/**
 * Fetch all persisted drawings for a symbol:timeframe combination.
 * Returns an empty drawings array if none have been saved yet.
 */
export async function fetchDrawings(symbol: string, timeframe: string): Promise<DrawingsResponse> {
  return fetchJSON<DrawingsResponse>('/api/drawings', { symbol, timeframe })
}

/**
 * Persist a new drawing to the server.
 * Uses an upsert strategy on the server — safe to call on retry.
 */
export async function saveDrawing(
  symbol: string,
  timeframe: string,
  drawing: ChartDrawing,
): Promise<{ status: string; id: string }> {
  const url = new URL('/api/drawings', getBaseUrl())
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, timeframe, drawing }),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Apply a partial update to an existing drawing.
 * Only the fields in `updates` are merged — all other fields remain unchanged.
 */
export async function updateDrawingApi(
  id: string,
  symbol: string,
  timeframe: string,
  updates: Partial<ChartDrawing>,
): Promise<{ status: string; id: string }> {
  const url = new URL(`/api/drawings/${encodeURIComponent(id)}`, getBaseUrl())
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, timeframe, updates }),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Delete a drawing by id.
 */
export async function deleteDrawingApi(
  id: string,
  symbol: string,
  timeframe: string,
): Promise<{ status: string; id: string }> {
  const url = new URL(`/api/drawings/${encodeURIComponent(id)}`, getBaseUrl())
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('timeframe', timeframe)
  const res = await fetch(url.toString(), { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
