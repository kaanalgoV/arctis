import { useEffect, useState } from "react";
import { checkHealth } from "./api";
import { Dashboard } from "./components/Dashboard";

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    const interval = setInterval(check, 2000);
    check();
    return () => clearInterval(interval);
  }, []);

  if (!connected) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#1a1a2e", color: "#e0e0e0" }}>
        <div style={{ textAlign: "center" }}>
          <h1>Arctis</h1>
          <p>Verbinde mit Engine...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
