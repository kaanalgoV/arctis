import { useEffect, useState } from "react";
import { fetchWarnings } from "../api";

interface WarningData {
  message: string;
  severity: "info" | "caution" | "stop";
}

const SEVERITY_COLORS = {
  info: "#42a5f5",
  caution: "#ffa726",
  stop: "#ef5350",
};

export function WarningsPanel({ market, timeframe }: { market: string; timeframe: string }) {
  const [warnings, setWarnings] = useState<WarningData[]>([]);

  useEffect(() => {
    fetchWarnings(market, timeframe)
      .then((data) => setWarnings(data.warnings || []))
      .catch(() => setWarnings([]));
  }, [market, timeframe]);

  if (warnings.length === 0) return null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Hinweise</h4>
      {warnings.map((w, i) => (
        <div key={i} style={{
          padding: "0.25rem 0.5rem",
          marginBottom: "0.25rem",
          borderLeft: `3px solid ${SEVERITY_COLORS[w.severity]}`,
          fontSize: "0.85rem",
          background: "#2a2a3e",
        }}>
          {w.message}
        </div>
      ))}
    </div>
  );
}
