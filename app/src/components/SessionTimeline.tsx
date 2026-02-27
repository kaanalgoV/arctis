import { useEffect, useState } from "react";
import { fetchSessions } from "../api";

interface SessionData {
  current_session: string;
  session_stats: Record<string, { bar_count: number; avg_volume: number; avg_range: number }>;
}

const SESSION_COLORS: Record<string, string> = {
  premarket: "#78909c",
  ny_open: "#66bb6a",
  midday: "#42a5f5",
  power_hour: "#ffa726",
  after_hours: "#78909c",
  closed: "#616161",
};

const SESSION_LABELS: Record<string, string> = {
  premarket: "Pre-Market",
  ny_open: "NY Open",
  midday: "Midday",
  power_hour: "Power Hour",
  after_hours: "After Hours",
  closed: "Geschlossen",
};

export function SessionTimeline({ market, timeframe }: { market: string; timeframe: string }) {
  const [data, setData] = useState<SessionData | null>(null);

  useEffect(() => {
    fetchSessions(market, timeframe).then(setData).catch(() => setData(null));
  }, [market, timeframe]);

  if (!data) return null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Sessions</h4>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {Object.entries(data.session_stats).map(([session, stats]) => (
          <div
            key={session}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              background: session === data.current_session ? (SESSION_COLORS[session] || "#2a2a3e") + "40" : "#2a2a3e",
              border: session === data.current_session ? `1px solid ${SESSION_COLORS[session] || "#3a3a4e"}` : "1px solid transparent",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ fontWeight: session === data.current_session ? "bold" : "normal" }}>
              {SESSION_LABELS[session] || session}
            </div>
            <div style={{ color: "#aaa" }}>
              {stats.bar_count} bars | Vol: {Math.round(stats.avg_volume)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
