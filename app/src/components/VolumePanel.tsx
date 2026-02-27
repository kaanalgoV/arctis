import { useEffect, useState } from "react";
import { fetchVolume } from "../api";

interface VolumeData {
  relative_volume: { index: number; timestamp: number; rvol: number }[];
  spikes: { index: number; timestamp: number; volume: number; ratio: number }[];
  bar_count: number;
}

export function VolumePanel({ market, timeframe }: { market: string; timeframe: string }) {
  const [data, setData] = useState<VolumeData | null>(null);

  useEffect(() => {
    fetchVolume(market, timeframe).then(setData).catch(() => setData(null));
  }, [market, timeframe]);

  if (!data) return <div style={{ padding: "0.5rem", color: "#888" }}>Lade Volumen...</div>;

  const latestRvol = data.relative_volume.length > 0
    ? data.relative_volume[data.relative_volume.length - 1].rvol
    : null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Volumen</h4>
      <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
        <span>
          Rel. Vol: <strong style={{ color: latestRvol && latestRvol > 1.5 ? "#26a69a" : "#e0e0e0" }}>
            {latestRvol ? `${latestRvol.toFixed(2)}x` : "\u2014"}
          </strong>
        </span>
        <span>Spikes: <strong>{data.spikes.length}</strong></span>
        <span>Bars: {data.bar_count}</span>
      </div>
      {data.spikes.length > 0 && (
        <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#ffa726" }}>
          Letzter Spike: {data.spikes[data.spikes.length - 1].ratio.toFixed(1)}x Durchschnitt
        </div>
      )}
    </div>
  );
}
