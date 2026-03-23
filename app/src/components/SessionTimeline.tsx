// Dashboard.tsx was deprecated — type defined inline here.
interface SessionStats {
  current_session: string
  session_stats: Record<string, { bar_count: number } | undefined>
}

const SESSION_ORDER = ["premarket", "ny_open", "midday", "power_hour", "after_hours"];

const SESSION_LABELS: Record<string, string> = {
  premarket: "PRE",
  ny_open: "NY",
  midday: "MID",
  power_hour: "PWR",
  after_hours: "AH",
};

const SESSION_COLORS: Record<string, string> = {
  premarket: "#4a5568",
  ny_open: "#00ff88",
  midday: "#4488ff",
  power_hour: "#ffaa00",
  after_hours: "#4a5568",
};

export function SessionTimeline({ data }: { data: SessionStats | null }) {
  if (!data) return null;

  const totalBars = SESSION_ORDER.reduce((sum, s) => sum + (data.session_stats[s]?.bar_count || 0), 0);

  return (
    <div className="session-timeline">
      <div className="session-timeline__bar">
        {SESSION_ORDER.map((session) => {
          const stats = data.session_stats[session];
          const pct = totalBars > 0 ? ((stats?.bar_count || 0) / totalBars) * 100 : 20;
          const isActive = session === data.current_session;
          const color = SESSION_COLORS[session] || "#4a5568";

          return (
            <div
              key={session}
              className={`session-timeline__segment ${isActive ? "session-timeline__segment--active" : ""}`}
              style={{
                width: `${Math.max(pct, 8)}%`,
                background: isActive ? color : `${color}33`,
                color: isActive ? "#fff" : "var(--text-muted)",
                boxShadow: isActive ? `0 0 15px ${color}66` : "none",
              }}
            >
              {SESSION_LABELS[session] || session}
            </div>
          );
        })}
      </div>
    </div>
  );
}
