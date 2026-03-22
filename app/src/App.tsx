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
      <div className="connect-screen">
        <div className="connect-screen__inner">
          <h1 className="connect-screen__title">Arctis</h1>
          <p className="connect-screen__text">Verbinde mit Engine...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
