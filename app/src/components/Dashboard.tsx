import { useEffect, useState } from "react";
import { Chart } from "./Chart";
import type { CandlestickData, Time } from "lightweight-charts";
import { fetchBars, fetchStructure } from "../api";

export function Dashboard() {
  const [market, setMarket] = useState<"ES" | "NQ">("ES");
  const [timeframe, setTimeframe] = useState<"1min" | "5min">("1min");
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [trend, setTrend] = useState<string>("—");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const bars = await fetchBars(market, timeframe);
        setChartData(
          bars.map((b: { timestamp: number; open: number; high: number; low: number; close: number }) => ({
            time: b.timestamp as Time,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          }))
        );

        const structure = await fetchStructure(market, timeframe);
        setTrend(structure.trend);
        setError(null);
      } catch {
        setError("Engine nicht erreichbar");
      }
    };

    loadData();
  }, [market, timeframe]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a2e", color: "#e0e0e0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 1rem", gap: "1rem", borderBottom: "1px solid #2a2a3e" }}>
        <h2 style={{ margin: 0 }}>Arctis</h2>
        <select value={market} onChange={(e) => setMarket(e.target.value as "ES" | "NQ")}
          style={{ background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", padding: "0.25rem" }}>
          <option value="ES">ES</option>
          <option value="NQ">NQ</option>
        </select>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as "1min" | "5min")}
          style={{ background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", padding: "0.25rem" }}>
          <option value="1min">1 Min</option>
          <option value="5min">5 Min</option>
        </select>
        <span style={{ padding: "0.25rem 0.5rem", borderRadius: "4px",
          background: trend === "uptrend" ? "#1b5e20" : trend === "downtrend" ? "#b71c1c" : "#37474f" }}>
          Trend: {trend}
        </span>
        {error && <span style={{ color: "#ef5350" }}>{error}</span>}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, padding: "0.5rem" }}>
        <Chart data={chartData} />
      </div>
    </div>
  );
}
