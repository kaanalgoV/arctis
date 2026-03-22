import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from "lightweight-charts";
import type { IChartApi, ISeriesApi, ISeriesMarkersPluginApi, CandlestickData, Time, LineData, SeriesType, SeriesMarker } from "lightweight-charts";

interface IndicatorLine {
  timestamp: number;
  value: number;
}

interface PriceLine {
  price: number;
  color: string;
  label: string;
  style?: number;
}

interface ChartInfo {
  direction: string;
  confidence: string;
  score: number;
  maxScore: number;
  vwap: number | null;
  poc: number | null;
  rsi: number | null;
  emaAlignment: string | null;
  dayHigh: number | null;
  dayLow: number | null;
}

export interface PatternMarker {
  timestamp: number;
  pattern: string;
  direction: string;
  text: string;
  detail: string;
  confidence: string;
  win_rate: number | null;
  category: string;
  price: number;
  target: number | null;
  marker_type: string;
  color: string;
}

interface ChartProps {
  data: CandlestickData<Time>[];
  vwap?: IndicatorLine[];
  vwapUpper1?: IndicatorLine[];
  vwapLower1?: IndicatorLine[];
  vwapUpper2?: IndicatorLine[];
  vwapLower2?: IndicatorLine[];
  ema9?: IndicatorLine[];
  ema21?: IndicatorLine[];
  ema50?: IndicatorLine[];
  priceLines?: PriceLine[];
  info?: ChartInfo;
  markers?: PatternMarker[];
  dayType?: string;
  dayBias?: string;
}

function toLineData(lines: IndicatorLine[]): LineData<Time>[] {
  return lines.map(l => ({ time: l.timestamp as Time, value: l.value }));
}

interface SeriesRefs {
  candle: ISeriesApi<SeriesType> | null;
  vwap: ISeriesApi<SeriesType> | null;
  vwapU1: ISeriesApi<SeriesType> | null;
  vwapL1: ISeriesApi<SeriesType> | null;
  vwapU2: ISeriesApi<SeriesType> | null;
  vwapL2: ISeriesApi<SeriesType> | null;
  ema9: ISeriesApi<SeriesType> | null;
  ema21: ISeriesApi<SeriesType> | null;
  ema50: ISeriesApi<SeriesType> | null;
}

export function Chart({ data, vwap, vwapUpper1, vwapLower1, vwapUpper2, vwapLower2, ema9, ema21, ema50, priceLines, info, markers, dayType, dayBias }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<SeriesRefs>({
    candle: null, vwap: null, vwapU1: null, vwapL1: null, vwapU2: null, vwapL2: null,
    ema9: null, ema21: null, ema50: null,
  });
  const initialFitDone = useRef(false);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0a0a1a" },
        textColor: "#7a8a9e",
      },
      grid: {
        vertLines: { color: "#1a2332" },
        horzLines: { color: "#1a2332" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#00f0ff", width: 1, style: 2, labelBackgroundColor: "#0d1117" },
        horzLine: { color: "#00f0ff", width: 1, style: 2, labelBackgroundColor: "#0d1117" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1a2332",
      },
      rightPriceScale: {
        borderColor: "#1a2332",
      },
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88", downColor: "#ff3366", borderVisible: false,
      wickUpColor: "#00ff88", wickDownColor: "#ff3366",
    });
    const vwapS = chart.addSeries(LineSeries, { color: "#ffdd00", lineWidth: 2, priceLineVisible: false, lastValueVisible: false, visible: false });
    const vwapU1S = chart.addSeries(LineSeries, { color: "rgba(255,221,0,0.3)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2, visible: false });
    const vwapL1S = chart.addSeries(LineSeries, { color: "rgba(255,221,0,0.3)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2, visible: false });
    const vwapU2S = chart.addSeries(LineSeries, { color: "rgba(255,221,0,0.15)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 3, visible: false });
    const vwapL2S = chart.addSeries(LineSeries, { color: "rgba(255,221,0,0.15)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 3, visible: false });
    const ema9S = chart.addSeries(LineSeries, { color: "#00f0ff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, visible: false });
    const ema21S = chart.addSeries(LineSeries, { color: "#4488ff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, visible: false });
    const ema50S = chart.addSeries(LineSeries, { color: "#aa44ff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, visible: false });

    seriesRef.current = {
      candle, vwap: vwapS, vwapU1: vwapU1S, vwapL1: vwapL1S, vwapU2: vwapU2S, vwapL2: vwapL2S,
      ema9: ema9S, ema21: ema21S, ema50: ema50S,
    };

    chartRef.current = chart;
    initialFitDone.current = false;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      initialFitDone.current = false;
    };
  }, []);

  // Update data without recreating chart (preserves zoom/pan)
  useEffect(() => {
    const refs = seriesRef.current;
    const chart = chartRef.current;
    if (!chart || !refs.candle) return;

    // Recreate candle series to clear old price lines
    const oldCandle = refs.candle;
    chart.removeSeries(oldCandle);
    const newCandle = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88", downColor: "#ff3366", borderVisible: false,
      wickUpColor: "#00ff88", wickDownColor: "#ff3366",
    });
    newCandle.setData(data);
    refs.candle = newCandle;

    // Day High / Day Low
    if (data.length > 0) {
      let dayHigh = -Infinity;
      let dayLow = Infinity;
      const lastTime = data[data.length - 1].time as number;
      for (let i = data.length - 1; i >= 0; i--) {
        const t = data[i].time as number;
        if (lastTime - t > 8 * 3600) break;
        if (data[i].high > dayHigh) dayHigh = data[i].high;
        if (data[i].low < dayLow) dayLow = data[i].low;
      }
      if (dayHigh !== -Infinity) {
        newCandle.createPriceLine({ price: dayHigh, color: "#00ff88", lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: "Day High" });
      }
      if (dayLow !== Infinity) {
        newCandle.createPriceLine({ price: dayLow, color: "#ff3366", lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: "Day Low" });
      }
    }

    // Custom price lines
    if (priceLines) {
      for (const pl of priceLines) {
        newCandle.createPriceLine({ price: pl.price, color: pl.color, lineWidth: 1, lineStyle: pl.style ?? 2, axisLabelVisible: true, title: pl.label });
      }
    }

    // Pattern markers on chart using createSeriesMarkers (LWC v5 API)
    if (markersPluginRef.current) {
      markersPluginRef.current.detach();
      markersPluginRef.current = null;
    }
    if (markers && markers.length > 0 && data.length > 0) {
      const dataTimestamps = new Set(data.map(d => d.time as number));
      const chartMarkers: SeriesMarker<Time>[] = markers
        .filter(m => m.marker_type !== "label")
        .filter(m => dataTimestamps.has(m.timestamp))
        .map(m => {
          const shape = m.marker_type === "arrow_up" ? "arrowUp" as const
            : m.marker_type === "arrow_down" ? "arrowDown" as const
            : "circle" as const;
          const position = m.direction === "long" || m.marker_type === "arrow_up" ? "belowBar" as const : "aboveBar" as const;
          const winStr = m.win_rate ? ` (${m.win_rate}%)` : "";
          return {
            time: m.timestamp as Time,
            position,
            color: m.color,
            shape,
            text: m.text + winStr,
          } as SeriesMarker<Time>;
        })
        .sort((a, b) => (a.time as number) - (b.time as number));

      if (chartMarkers.length > 0) {
        markersPluginRef.current = createSeriesMarkers(newCandle, chartMarkers);
      }
    }

    // Update line series
    const updateLine = (series: ISeriesApi<SeriesType> | null, lineData: IndicatorLine[] | undefined) => {
      if (!series) return;
      if (lineData && lineData.length > 0) {
        series.setData(toLineData(lineData));
        series.applyOptions({ visible: true });
      } else {
        series.setData([]);
        series.applyOptions({ visible: false });
      }
    };

    updateLine(refs.vwap, vwap);
    updateLine(refs.vwapU1, vwapUpper1);
    updateLine(refs.vwapL1, vwapLower1);
    updateLine(refs.vwapU2, vwapUpper2);
    updateLine(refs.vwapL2, vwapLower2);
    updateLine(refs.ema9, ema9);
    updateLine(refs.ema21, ema21);
    updateLine(refs.ema50, ema50);

    // Only fitContent on first load
    if (!initialFitDone.current && data.length > 0) {
      chart.timeScale().fitContent();
      initialFitDone.current = true;
    }
  }, [data, vwap, vwapUpper1, vwapLower1, vwapUpper2, vwapLower2, ema9, ema21, ema50, priceLines, markers]);

  // Info overlay
  const dirColor = info?.direction === "LONG" ? "#00ff88" : info?.direction === "SHORT" ? "#ff3366" : "#7a8a9e";
  const isStrong = info?.confidence === "STARK";
  const isMedium = info?.confidence === "MITTEL";
  const action = isStrong
    ? (info?.direction === "LONG" ? "EINSTIEG LONG" : "EINSTIEG SHORT")
    : isMedium
    ? (info?.direction === "LONG" ? "LONG MÖGLICH" : info?.direction === "SHORT" ? "SHORT MÖGLICH" : "ABWARTEN")
    : "KEIN EINSTIEG";

  // Filter label-type markers for sidebar overlay
  const labelMarkers = markers?.filter(m => m.marker_type === "label") || [];
  const actionMarkers = markers?.filter(m => m.marker_type !== "label" && m.direction !== "neutral") || [];

  // Day type colors
  const dayTypeColor = dayType === "trend" ? "#ff3366" : dayType === "normal_variation" ? "#00f0ff" : dayType === "neutral" ? "#ffdd00" : "#7a8a9e";
  const dayBiasColor = dayBias === "long" ? "#00ff88" : dayBias === "short" ? "#ff3366" : "#7a8a9e";

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Top-left: Confluence Info */}
      {info && (
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 10,
          background: "rgba(10,10,26,0.9)", padding: "6px 10px", borderRadius: "4px",
          border: `1px solid ${dirColor}40`, fontSize: "0.7rem", lineHeight: 1.5,
          pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: dirColor, marginBottom: 2 }}>
            {action}
          </div>
          <div style={{ color: "#7a8a9e" }}>
            Score: <span style={{ color: dirColor, fontWeight: 600 }}>{Math.abs(info.score)}/{info.maxScore}</span>
            {" | "}RSI: <span style={{ color: info.rsi && info.rsi > 70 ? "#ff3366" : info.rsi && info.rsi < 30 ? "#00ff88" : "#e0e8f0" }}>{info.rsi?.toFixed(0) ?? "\u2014"}</span>
            {" | "}EMA: <span style={{ color: info.emaAlignment === "bullish" ? "#00ff88" : info.emaAlignment === "bearish" ? "#ff3366" : "#7a8a9e" }}>{info.emaAlignment?.toUpperCase() ?? "\u2014"}</span>
          </div>
          <div style={{ color: "#7a8a9e" }}>
            VWAP: <span style={{ color: "#ffdd00" }}>{info.vwap?.toFixed(2) ?? "\u2014"}</span>
            {" | "}POC: <span style={{ color: "#ffdd00" }}>{info.poc?.toFixed(2) ?? "\u2014"}</span>
          </div>
          {dayType && (
            <div style={{ color: "#7a8a9e", marginTop: 2 }}>
              Typ: <span style={{ color: dayTypeColor, fontWeight: 600 }}>{dayType.toUpperCase()}</span>
              {" | "}Bias: <span style={{ color: dayBiasColor, fontWeight: 600 }}>{(dayBias || "neutral").toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* Top-right: Pattern Signals Panel */}
      {actionMarkers.length > 0 && (
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: "rgba(10,10,26,0.9)", padding: "6px 10px", borderRadius: "4px",
          border: "1px solid #1a233280", fontSize: "0.65rem", lineHeight: 1.6,
          pointerEvents: "none", maxWidth: "280px", maxHeight: "200px", overflowY: "auto",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.7rem", color: "#00f0ff", marginBottom: 3, letterSpacing: "0.5px" }}>
            PATTERN SIGNALS
          </div>
          {actionMarkers.slice(0, 8).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
              <span style={{ color: m.color, fontSize: "0.75rem" }}>
                {m.direction === "long" ? "\u25B2" : "\u25BC"}
              </span>
              <span style={{ color: m.color, fontWeight: 600 }}>{m.text}</span>
              {m.win_rate && (
                <span style={{ color: "#7a8a9e", fontSize: "0.6rem" }}>{m.win_rate}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom-left: Label markers (time-based warnings) */}
      {labelMarkers.length > 0 && (
        <div style={{
          position: "absolute", bottom: 8, left: 8, zIndex: 10,
          background: "rgba(10,10,26,0.9)", padding: "4px 8px", borderRadius: "4px",
          border: "1px solid #1a233280", fontSize: "0.6rem",
          pointerEvents: "none", display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {labelMarkers.slice(0, 4).map((m, i) => (
            <span key={i} style={{ color: m.color, fontWeight: 600 }}>{m.text}</span>
          ))}
        </div>
      )}
    </div>
  );
}
