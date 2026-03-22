import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, ColorType, CrosshairMode } from 'lightweight-charts'
import type { OHLCVBar } from '@/types/market'

interface SimpleChartProps {
  bars: OHLCVBar[]
  className?: string
}

export function SimpleChart({ bars, className }: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0A0D12' },
        textColor: '#6E7681',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(53,61,72,0.3)' },
        horzLines: { color: 'rgba(53,61,72,0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(92,184,240,0.3)', width: 1, labelBackgroundColor: '#222830' },
        horzLine: { color: 'rgba(92,184,240,0.3)', width: 1, labelBackgroundColor: '#222830' },
      },
      rightPriceScale: { borderColor: '#272F3A' },
      timeScale: { borderColor: '#272F3A', timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart

    // Candlesticks (v5 API: chart.addSeries)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#008757',
      downColor: '#EF4136',
      borderUpColor: '#008757',
      borderDownColor: '#EF4136',
      wickUpColor: '#008757',
      wickDownColor: '#EF4136',
    })
    candleSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    )

    // Volume (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
      }))
    )

    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [bars])

  return <div ref={containerRef} className={className} />
}
