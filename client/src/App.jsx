import { useGameStore } from "./store/gameStore";
import { useSocket } from "./hooks/useSocket";

import HomeScreen from "./screens/HomeScreen";
import LobbyScreen from "./screens/LobbyScreen";
import DebateScreen from "./screens/DebateScreen";
import FinalScreen from "./screens/FinalScreen";

export default function App() {
  useSocket();

  const phase = useGameStore((state) => state.phase);

  console.log("Current phase:", phase);

  switch (phase) {
    case "home":
      return <HomeScreen />;

    case "lobby":
      return <LobbyScreen />;

    case "debate":
    case "judging":
    case "results":
      return <DebateScreen />;

    case "final":
      return <FinalScreen />;

    default:
      return <HomeScreen />;
  }
}