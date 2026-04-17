import { useGameStore } from "./store/gameStore";
import { useSocket } from "./hooks/useSocket";

import SetupScreen from "./components/SetupScreen";
import DebateScreen from "./components/DebateScreen";
import FinalScreen from "./components/FinalScreen";

// 🔌 Connection Status Badge
function ConnectionBadge() {
  const { connectionStatus } = useGameStore();

  const color =
    connectionStatus === "connected"
      ? "#22c55e"
      : connectionStatus === "disconnected"
      ? "#ef4444"
      : "#f59e0b";

  const label =
    connectionStatus === "connected"
      ? "LIVE"
      : connectionStatus === "disconnected"
      ? "OFFLINE"
      : "ERROR";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(10,10,15,0.9)",
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: "4px 12px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: color,
          letterSpacing: "2px",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// 🎮 MAIN APP
export default function App() {
  useSocket(); // 🔥 initialize socket globally

  const { phase } = useGameStore();

  return (
    <div className="arena-bg min-h-screen">
      {phase === "setup" && <SetupScreen />}

      {(phase === "debate" ||
        phase === "judging" ||
        phase === "results") && <DebateScreen />}

      {phase === "final" && <FinalScreen />}

      <ConnectionBadge />
    </div>
  );
}