import { describe, it, expect, beforeEach } from 'vitest'
import { useMarketStore } from '../market'

describe('useMarketStore', () => {
  beforeEach(() => {
    useMarketStore.setState({
      market: 'NQ', symbol: 'NQH6', timeframe: '1min',
      days: 30, wsStatus: 'disconnected', lastBarTs: null,
    })
  })

  it('setMarket updates market and derives symbol', () => {
    useMarketStore.getState().setMarket('ES')
    const state = useMarketStore.getState()
    expect(state.market).toBe('ES')
    expect(state.symbol).toBe('ESZ5')
  })

  it('setTimeframe updates timeframe', () => {
    useMarketStore.getState().setTimeframe('5min')
    expect(useMarketStore.getState().timeframe).toBe('5min')
  })

  it('setWsStatus updates connection state', () => {
    useMarketStore.getState().setWsStatus('connected')
    expect(useMarketStore.getState().wsStatus).toBe('connected')
  })

  it('setLastBarTs updates timestamp', () => {
    useMarketStore.getState().setLastBarTs(1735827000)
    expect(useMarketStore.getState().lastBarTs).toBe(1735827000)
  })
})
