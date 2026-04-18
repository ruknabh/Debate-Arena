import { useState } from "react";
import axios from "axios";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import { getSocket } from "../hooks/useSocket";

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

export default function HomeScreen() {
  const {
    setRoomCode,
    setMyRole,
    setRoom,
    setPhase,
    setMyName,
    setIsMatchmaking,
    connectionStatus,
  } = useGameStore();

  const { joinSocketRoom } = useRoom();

  const [mode, setMode] = useState(null);
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queueStatus, setQueueStatus] = useState(null);

  // ✅ SAFE SOCKET
  const getSocketId = () => {
    const socket = getSocket();
    return socket?.id;
  };

  // ───────────── CREATE ROOM ─────────────
  const handleCreateRoom = async () => {
    if (!topic.trim()) return setError("Enter a debate topic");
    if (!name.trim()) return setError("Enter your name");

    const socketId = getSocketId();
    if (!socketId) return setError("Not connected to server");

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
      setPhase("lobby");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── JOIN ROOM ─────────────
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return setError("Enter a room code");
    if (!name.trim()) return setError("Enter your name");

    const socketId = getSocketId();
    if (!socketId) return setError("Not connected to server");

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/room/join`, {
        code: joinCode.trim().toUpperCase(),
        playerName: name.trim(),
        socketId,
      });

      setMyName(name.trim());
      setRoomCode(res.data.roomCode);
      setMyRole("p2");
      setRoom(res.data.room);

      joinSocketRoom(res.data.roomCode);
      setPhase("lobby");
    } catch (err) {
      setError(err.response?.data?.error || "Room not found or full");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MATCHMAKING ─────────────
  const handleMatchmaking = async () => {
    if (!name.trim()) return setError("Enter your name");

    const socketId = getSocketId();
    if (!socketId) return setError("Not connected");

    setLoading(true);
    setError("");
    setIsMatchmaking(true);

    try {
      const res = await axios.post(`${API}/api/room/queue`, {
        playerName: name.trim(),
        socketId,
      });

      setMyName(name.trim());

      if (res.data.status !== "matched") {
        setQueueStatus("Waiting for opponent...");
      }
    } catch {
      setError("Matchmaking failed");
      setIsMatchmaking(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelMatchmaking = async () => {
    try {
      await axios.post(`${API}/api/room/queue/leave`, {
        socketId: getSocketId(),
      });
    } catch {}

    setIsMatchmaking(false);
    setQueueStatus(null);
    setMode(null);
  };

  // ───────────── UI ─────────────
  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6 text-white">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold">DEBATE ARENA</h1>
        <p className="text-white/40 text-sm">
          {connectionStatus === "connected"
            ? "SERVER ONLINE"
            : "CONNECTING..."}
        </p>
      </div>

      {/* NAME INPUT */}
      {!mode && (
        <input
          className="mb-4 px-4 py-2 bg-black/30 border border-white/20 rounded"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      {/* MAIN MENU */}
      {!mode && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setMode("friend")} className="btn">
            Create Room
          </button>
          <button onClick={() => setMode("join")} className="btn">
            Join Room
          </button>
          <button onClick={() => setMode("stranger")} className="btn">
            Matchmaking
          </button>
        </div>
      )}

      {/* CREATE ROOM */}
      {mode === "friend" && (
        <div className="flex flex-col gap-3 mt-6 w-80">
          <input
            className="input"
            placeholder="Enter topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map((t, i) => (
              <button
                key={i}
                className="text-xs bg-white/10 px-2 py-1 rounded"
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button onClick={handleCreateRoom} className="btn">
            Create
          </button>

          <button onClick={() => setMode(null)} className="btn-secondary">
            Back
          </button>
        </div>
      )}

      {/* JOIN ROOM */}
      {mode === "join" && (
        <div className="flex flex-col gap-3 mt-6">
          <input
            className="input"
            placeholder="Room Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />

          <button onClick={handleJoinRoom} className="btn">
            Join
          </button>

          <button onClick={() => setMode(null)} className="btn-secondary">
            Back
          </button>
        </div>
      )}

      {/* MATCHMAKING */}
      {mode === "stranger" && (
        <div className="flex flex-col gap-3 mt-6">
          {!queueStatus ? (
            <button onClick={handleMatchmaking} className="btn">
              Find Match
            </button>
          ) : (
            <>
              <p>{queueStatus}</p>
              <button onClick={cancelMatchmaking} className="btn-secondary">
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* ERROR */}
      {error && <p className="text-red-400 mt-4">{error}</p>}

      {/* LOADING */}
      {loading && <p className="text-yellow-400 mt-2">Processing...</p>}
    </div>
  );
}