const ENGINE_URL = "http://127.0.0.1:8001";

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const res = await fetch(`${ENGINE_URL}/health`);
  if (!res.ok) throw new Error(`Engine health check failed: ${res.status}`);
  return res.json();
}

export async function importCSV(
  file: File,
  market: "ES" | "NQ",
  timeframe: "1min" | "5min"
): Promise<{ market: string; timeframe: string; bars_imported: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("market", market);
  form.append("timeframe", timeframe);
  const res = await fetch(`${ENGINE_URL}/api/import`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return res.json();
}

export async function fetchBars(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/bars?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch bars: ${res.status}`);
  return res.json();
}

export async function fetchStructure(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/structure?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch structure: ${res.status}`);
  return res.json();
}

export async function fetchVolume(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/volume?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch volume: ${res.status}`);
  return res.json();
}

export async function fetchSessions(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/sessions?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
  return res.json();
}

export async function fetchWarnings(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/warnings?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch warnings: ${res.status}`);
  return res.json();
}

export async function fetchProbability(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/probability?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch probability: ${res.status}`);
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${ENGINE_URL}/api/config`);
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
  return res.json();
}

export async function saveConfig(config: Record<string, unknown>) {
  const res = await fetch(`${ENGINE_URL}/api/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Failed to save config: ${res.status}`);
  return res.json();
}

export async function fetchIndicators(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/indicators?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch indicators: ${res.status}`);
  return res.json();
}

export async function fetchConfluence(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/confluence?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch confluence: ${res.status}`);
  return res.json();
}

export async function fetchPatterns(market: string, timeframe: string) {
  const res = await fetch(`${ENGINE_URL}/api/analysis/patterns?market=${market}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch patterns: ${res.status}`);
  return res.json();
}

export async function simStart(market: string, timeframe: string, speed: number = 10) {
  const res = await fetch(`${ENGINE_URL}/api/sim/start?market=${market}&timeframe=${timeframe}&speed=${speed}`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to start sim: ${res.status}`);
  return res.json();
}

export async function simStop() {
  const res = await fetch(`${ENGINE_URL}/api/sim/stop`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to stop sim: ${res.status}`);
  return res.json();
}

export async function simStatus() {
  const res = await fetch(`${ENGINE_URL}/api/sim/status`);
  if (!res.ok) throw new Error(`Failed to get sim status: ${res.status}`);
  return res.json();
}

export async function calculatePositionSize(stopDistance: number, market: string) {
  const res = await fetch(`${ENGINE_URL}/api/risk/position-size`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stop_distance: stopDistance, market }),
  });
  if (!res.ok) throw new Error(`Failed to calculate position size: ${res.status}`);
  return res.json();
}
