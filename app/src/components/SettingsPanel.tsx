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

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">Einstellungen</h3>
        <label className="modal__field">
          Kontogr\u00f6\u00dfe ($)
          <input className="modal__input" type="number" value={config.account_size}
            onChange={e => setConfig({...config, account_size: +e.target.value})} />
        </label>
        <label className="modal__field">
          Risiko pro Trade (%)
          <input className="modal__input" type="number" step="0.1" value={config.risk_percent}
            onChange={e => setConfig({...config, risk_percent: +e.target.value})} />
        </label>
        <label className="modal__field">
          Tages-Verlustlimit ($)
          <input className="modal__input" type="number" value={config.daily_loss_limit}
            onChange={e => setConfig({...config, daily_loss_limit: +e.target.value})} />
        </label>
        <label className="modal__field">
          Max Trades/Tag
          <input className="modal__input" type="number" value={config.max_daily_trades}
            onChange={e => setConfig({...config, max_daily_trades: +e.target.value})} />
        </label>
        <div className="modal__actions">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Abbrechen</button>
          <button className="modal__btn modal__btn--save" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
