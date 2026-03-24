/**
 * ArctisLiveClient — read-only live market data client.
 *
 * Connects to the AlgoView Live Trading Service at ws://localhost:28081/ws
 * using binary Protobuf over WebSocket. Arctis is data-only: no order
 * placement, no position management, no account updates.
 *
 * Price scaling convention (from AlgoView protocol):
 *   Prices are scaled by 10^9 — e.g. 21450.25 → 21_450_250_000_000
 *   Timestamps are in milliseconds.
 *
 * Features:
 * - Automatic reconnect with exponential backoff (1s → 30s)
 * - Heartbeat: 1-byte ping every 15s, reconnect after 30s silence
 * - Binary Protobuf decode via copied AlgoView proto bundle
 */

import { alg } from './proto/live'
import type Long from 'long'

// ============ Scaling ============

const PRICE_SCALE = 1_000_000_000

function toLong(value: number | Long | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  return value.toNumber()
}

function scaledToPrice(v: number | Long | null | undefined): number {
  return toLong(v) / PRICE_SCALE
}

// ============ Public Types ============

export interface LiveCandle {
  /** Unix timestamp in seconds (matches lightweight-charts format) */
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  /** True while the bar is still forming */
  isLive: boolean
}

export interface LiveTrade {
  price: number
  size: number
  /** 1 = buy aggressor, 2 = sell aggressor */
  side: number
  exchangeTs: number
}

export interface LiveMarketStats {
  symbol: string
  high: number
  low: number
  open: number
  close: number
  volume: number
  bid?: number
  ask?: number
  lastPrice?: number
}

// ============ Configuration ============

const RECONNECT_INITIAL_MS = 1_000
const RECONNECT_MAX_MS = 30_000
const RECONNECT_MULTIPLIER = 2
const HEARTBEAT_INTERVAL_MS = 15_000
const HEARTBEAT_TIMEOUT_MS = 30_000

// ============ Client ============

export class ArctisLiveClient {
  private ws: WebSocket | null = null
  private url: string
  private shouldReconnect = false
  private reconnectDelay = RECONNECT_INITIAL_MS
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private lastMessageTime = Date.now()

  // ============ Callbacks ============

  onCandle?: (candle: LiveCandle) => void
  onHistorical?: (candles: LiveCandle[]) => void
  onTrade?: (trade: LiveTrade) => void
  onMarketStats?: (stats: LiveMarketStats) => void
  onConnect?: () => void
  onDisconnect?: () => void

  constructor(url: string) {
    this.url = url
  }

  // ============ Connection ============

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.shouldReconnect = true
    this._openSocket()
  }

  disconnect(): void {
    this.shouldReconnect = false
    this._clearReconnectTimer()
    this._stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // ============ Subscriptions ============

  /**
   * Subscribe to live candle and market data for a symbol.
   * @param symbol  Contract symbol, e.g. "NQH6"
   * @param exchange Exchange code, e.g. "CME"
   * @param timeframe Timeframe enum value (3 = M1, 4 = M5, 5 = M15, ...)
   * @param historicalCount Number of historical bars to request (default 300)
   */
  subscribe(
    symbol: string,
    exchange: string,
    timeframe: number,
    historicalCount = 300,
  ): void {
    if (!this.isConnected()) {
      console.warn('[ArctisLiveClient] subscribe() called while not connected — will re-subscribe on connect')
      return
    }
    this._send({
      subscribe: {
        symbol,
        exchange,
        timeframe,
        historicalSource: 0, // Auto
        historicalCount,
      },
    })
  }

  unsubscribe(symbol: string): void {
    if (!this.isConnected()) return
    this._send({ unsubscribe: { symbol } })
  }

  // ============ Internal — Socket ============

  private _openSocket(): void {
    try {
      const ws = new WebSocket(this.url)
      ws.binaryType = 'arraybuffer'
      this.ws = ws

      ws.onopen = () => {
        if (import.meta.env.DEV) {
          console.log('[ArctisLiveClient] Connected to', this.url)
        }
        this.reconnectDelay = RECONNECT_INITIAL_MS
        this._startHeartbeat()
        this.onConnect?.()
      }

      ws.onclose = (event) => {
        if (import.meta.env.DEV) {
          console.log('[ArctisLiveClient] Disconnected', event.code, event.reason)
        }
        this._stopHeartbeat()
        this.ws = null
        this.onDisconnect?.()

        if (this.shouldReconnect) {
          this._scheduleReconnect()
        }
      }

      ws.onerror = () => {
        // onclose fires after onerror — reconnect is handled there
        ws.close()
      }

      ws.onmessage = (event: MessageEvent) => {
        this.lastMessageTime = Date.now()
        this._handleMessage(event)
      }
    } catch (err) {
      console.warn('[ArctisLiveClient] Failed to open WebSocket:', err)
      if (this.shouldReconnect) {
        this._scheduleReconnect()
      }
    }
  }

  // ============ Internal — Message Handling ============

  private _handleMessage(event: MessageEvent): void {
    try {
      const buf = new Uint8Array(event.data as ArrayBuffer)
      const msg = alg.live.ServerMessage.decode(buf)
      this._dispatch(msg)
    } catch (err) {
      console.error('[ArctisLiveClient] Failed to parse message:', err)
    }
  }

  private _dispatch(msg: alg.live.IServerMessage): void {
    // --- Candle update (live, streaming) ---
    if (msg.candle) {
      const c = msg.candle
      this.onCandle?.({
        timestamp: Math.floor(toLong(c.ts) / 1000),
        open: scaledToPrice(c.open),
        high: scaledToPrice(c.high),
        low: scaledToPrice(c.low),
        close: scaledToPrice(c.close),
        volume: toLong(c.volume),
        isLive: !(c.isClosed ?? false),
      })
      return
    }

    // --- Historical batch ---
    if (msg.historical) {
      const candles: LiveCandle[] = (msg.historical.candles ?? []).map((c) => ({
        timestamp: Math.floor(toLong(c.ts) / 1000),
        open: scaledToPrice(c.open),
        high: scaledToPrice(c.high),
        low: scaledToPrice(c.low),
        close: scaledToPrice(c.close),
        volume: toLong(c.volume),
        isLive: false,
      }))
      this.onHistorical?.(candles)
      return
    }

    // --- Trade tick ---
    if (msg.trade) {
      const t = msg.trade
      this.onTrade?.({
        price: scaledToPrice(t.price),
        size: t.size ?? 0,
        side: t.aggressor ?? 0,
        exchangeTs: toLong(t.exchangeTs),
      })
      return
    }

    // --- Market stats (daily high/low/open/close/volume, bid/ask) ---
    if (msg.marketStats) {
      const s = msg.marketStats
      this.onMarketStats?.({
        symbol: s.symbol ?? '',
        high: scaledToPrice(s.high),
        low: scaledToPrice(s.low),
        open: scaledToPrice(s.open),
        close: scaledToPrice(s.lastPrice ?? s.close ?? null),
        volume: toLong(s.volume),
        bid: s.bid != null ? scaledToPrice(s.bid) : undefined,
        ask: s.ask != null ? scaledToPrice(s.ask) : undefined,
        lastPrice: s.lastPrice != null ? scaledToPrice(s.lastPrice) : undefined,
      })
      return
    }

    // Snapshot / subscribed / error / modeChanged / capabilities / connectionStatus
    // are ignored in Arctis (read-only, no trading context needed)
  }

  // ============ Internal — Send ============

  private _send(message: alg.live.IClientMessage): void {
    if (!this.isConnected()) return
    try {
      const bytes = alg.live.ClientMessage.encode(message).finish()
      this.ws!.send(bytes)
    } catch (err) {
      console.error('[ArctisLiveClient] Send failed:', err)
    }
  }

  // ============ Internal — Heartbeat ============

  private _startHeartbeat(): void {
    this._stopHeartbeat()
    this.lastMessageTime = Date.now()

    this.heartbeatInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastMessageTime

      if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        console.warn('[ArctisLiveClient] Heartbeat timeout — reconnecting')
        this._forceReconnect()
        return
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(new Uint8Array([0]))
        } catch {
          console.warn('[ArctisLiveClient] Heartbeat send failed — reconnecting')
          this._forceReconnect()
        }
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // ============ Internal — Reconnect ============

  private _forceReconnect(): void {
    this._stopHeartbeat()
    try {
      this.ws?.close(4000, 'Heartbeat timeout')
    } catch {
      // ignore
    }
    this.ws = null
    if (this.shouldReconnect) {
      this._scheduleReconnect()
    }
  }

  private _scheduleReconnect(): void {
    this._clearReconnectTimer()

    if (import.meta.env.DEV) {
      console.log(`[ArctisLiveClient] Reconnecting in ${this.reconnectDelay}ms`)
    }

    this.reconnectTimer = setTimeout(() => {
      this._openSocket()
    }, this.reconnectDelay)

    this.reconnectDelay = Math.min(
      this.reconnectDelay * RECONNECT_MULTIPLIER,
      RECONNECT_MAX_MS,
    )
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// ============ Singleton ============

let _client: ArctisLiveClient | null = null

export function getLiveClient(url: string): ArctisLiveClient {
  if (!_client) {
    _client = new ArctisLiveClient(url)
  }
  return _client
}

export function resetLiveClient(): void {
  _client?.disconnect()
  _client = null
}
