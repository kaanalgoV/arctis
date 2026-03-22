import type { HudData, ConfluenceData } from "./Dashboard";

const SESSION_LABELS: Record<string, string> = {
  premarket: "PRE-MARKET",
  ny_open: "NY OPEN",
  midday: "MIDDAY",
  power_hour: "POWER HOUR",
  after_hours: "AFTER HOURS",
  closed: "CLOSED",
};

export function HudBar({ data, confluence }: { data: HudData; confluence: ConfluenceData | null }) {
  const rvolClass = data.rvol && data.rvol > 2 ? "hud-bar__value--red"
    : data.rvol && data.rvol > 1.5 ? "hud-bar__value--green"
    : "hud-bar__value--highlight";

  const rsiClass = data.rsi !== null
    ? data.rsi > 70 ? "hud-bar__value--red"
      : data.rsi < 30 ? "hud-bar__value--green"
      : ""
    : "";

  const emaClass = data.emaAlignment === "bullish" ? "hud-bar__value--green"
    : data.emaAlignment === "bearish" ? "hud-bar__value--red"
    : "";

  return (
    <div className="hud-bar">
      <div className="hud-bar__item">
        <span className="hud-bar__label">RVOL</span>
        <span className={`hud-bar__value ${rvolClass}`}>
          {data.rvol ? `${data.rvol.toFixed(2)}x` : "\u2014"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">RSI</span>
        <span className={`hud-bar__value ${rsiClass}`}>
          {data.rsi !== null ? data.rsi.toFixed(0) : "\u2014"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">EMA</span>
        <span className={`hud-bar__value ${emaClass}`}>
          {data.emaAlignment ? data.emaAlignment.toUpperCase() : "\u2014"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Session</span>
        <span className="hud-bar__value hud-bar__value--highlight">
          {SESSION_LABELS[data.currentSession] || data.currentSession}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">VWAP</span>
        <span className="hud-bar__value" style={{ color: "var(--accent-orange)" }}>
          {confluence?.vwap ? confluence.vwap.toFixed(2) : "\u2014"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">POC</span>
        <span className="hud-bar__value" style={{ color: "var(--accent-orange)" }}>
          {confluence?.poc ? confluence.poc.toFixed(2) : "\u2014"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Spikes</span>
        <span className={`hud-bar__value ${data.spikeCount > 0 ? "hud-bar__value--orange" : ""}`}>
          {data.spikeCount}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Bars</span>
        <span className="hud-bar__value">{data.barCount}</span>
      </div>
    </div>
  );
}
