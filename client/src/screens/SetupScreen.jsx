import { useState } from "react";
import axios from "axios";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import { getSocket } from "../hooks/useSocket";
import { Swords, Zap, Trophy } from "lucide-react";

const API = "http://localhost:3001";

const SUGGESTED_TOPICS = [
  "AI will replace human creativity",
  "Social media does more harm than good",
  "Remote work is better than office work",
  "Cryptocurrency is the future of finance",
  "Humans should colonize Mars",
  "Video games are a legitimate sport",
  "Universal Basic Income should be implemented",
  "Nuclear energy is essential for climate goals",
];

export default function SetupScreen() {
  const {
    setRoomCode,
    setMyRole,
    setRoom,
    setPhase,
    setMyName,
  } = useGameStore();

  const { joinSocketRoom } = useRoom();

  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ SAFE SOCKET
  const getSocketId = () => {
    const socket = getSocket();
    return socket?.id;
  };

  // ─────────────────────────────
  // CREATE ROOM (FIXED)
  // ─────────────────────────────
  const handleStart = async () => {
    if (!topic.trim()) {
      return setError("Enter a debate topic");
    }

    if (!name.trim()) {
      return setError("Enter your name");
    }

    const socketId = getSocketId();
    if (!socketId) {
      return setError("Not connected to server");
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/room/create`, {
        topic: topic.trim(),
        player1Name: name.trim(),
        socketId,
      });

      setMyName(name.trim());
      setRoomCode(res.data.roomCode);
      setMyRole("p1");
      setRoom(res.data.room);

      joinSocketRoom(res.data.roomCode);

      setPhase("lobby"); // 🔥 correct flow
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6 text-white">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold">DEBATE ARENA</h1>

        <div className="flex justify-center gap-6 mt-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Zap size={12} /> AI Judge
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={12} /> 3 Rounds
          </span>
        </div>
      </div>

      {/* CARD */}
      <div className="arena-card w-full max-w-xl p-6">

        {/* NAME */}
        <input
          className="arena-input w-full mb-4 px-4 py-3"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* TOPIC */}
        <textarea
          className="arena-input w-full p-4 h-24"
          placeholder="Enter debate topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        {/* SUGGESTED */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTED_TOPICS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTopic(t)}
              className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"
            >
              {t}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-400 mt-3 text-sm">{error}</p>
        )}

        {/* BUTTON */}
        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-6 w-full bg-purple-500 py-3 rounded hover:bg-purple-600"
        >
          {loading ? "Creating Room..." : "Create Room"}
        </button>
      </div>
    </div>
  );
}