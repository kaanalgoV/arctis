import { useEffect, useState } from "react";
import { fetchConfig, saveConfig } from "../api";

interface Config {
  account_size: number;
  risk_percent: number;
  daily_loss_limit: number;
  max_daily_trades: number;
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    await saveConfig(config as unknown as Record<string, unknown>);
    onClose();
  };

  if (!config) return null;

  const inputStyle = { width: "100%", padding: "0.25rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
      <div style={{ background: "#1a1a2e", padding: "1.5rem", borderRadius: "8px", width: "400px", border: "1px solid #3a3a4e" }}>
        <h3 style={{ margin: "0 0 1rem" }}>Einstellungen</h3>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Kontogr\u00f6\u00dfe ($)
          <input type="number" value={config.account_size} onChange={e => setConfig({...config, account_size: +e.target.value})} style={inputStyle} />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Risiko pro Trade (%)
          <input type="number" step="0.1" value={config.risk_percent} onChange={e => setConfig({...config, risk_percent: +e.target.value})} style={inputStyle} />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Tages-Verlustlimit ($)
          <input type="number" value={config.daily_loss_limit} onChange={e => setConfig({...config, daily_loss_limit: +e.target.value})} style={inputStyle} />
        </label>
        <label style={{ display: "block", marginBottom: "1rem", fontSize: "0.85rem" }}>
          Max Trades/Tag
          <input type="number" value={config.max_daily_trades} onChange={e => setConfig({...config, max_daily_trades: +e.target.value})} style={inputStyle} />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", cursor: "pointer" }}>Abbrechen</button>
          <button onClick={save} style={{ padding: "0.5rem 1rem", background: "#26a69a", color: "white", border: "none", cursor: "pointer" }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
