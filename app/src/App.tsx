import { useEffect, useState } from "react";
import { checkHealth } from "./api";

function App() {
  const [engineStatus, setEngineStatus] = useState<string>("connecting...");

  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setEngineStatus(`online (v${health.version})`);
      } catch {
        setEngineStatus("offline");
      }
    };
    const interval = setInterval(check, 2000);
    check();
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Arctis</h1>
      <p>Trading Decision Support</p>
      <p style={{ color: engineStatus === "offline" ? "#e74c3c" : "#27ae60" }}>
        Engine: {engineStatus}
      </p>
    </div>
  );
}

export default App;
