import { useState } from "react";
import axios from "axios";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import { getSocket } from "../hooks/useSocket";
import { ArrowLeft, Loader2, Swords, Zap, Trophy, Users } from "lucide-react";

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

  const [mode, setMode] = useState(null);    // null | "friend" | "join" | "stranger"
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inQueue, setInQueue] = useState(false);  // true once Find Match is pressed

  const getSocketId = () => getSocket()?.id;

  const clearError = () => setError("");

  const goBack = async () => {
    // If we're in the queue, leave it first
    if (inQueue) {
      try {
        await axios.post(`${API}/api/room/queue/leave`, { socketId: getSocketId() });
      } catch {}
      setInQueue(false);
      setIsMatchmaking(false);
    }
    setMode(null);
    setError("");
  };

  // Disable main-menu buttons until name is typed
  const nameEntered = name.trim().length > 0;

  // ───────────── CREATE ROOM ─────────────
  const handleCreateRoom = async () => {
    if (!topic.trim()) return setError("Enter a debate topic");

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
  const handleFindMatch = async () => {
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
      setInQueue(true);

      // If already matched instantly, the socket "match:found" event handles the rest
    } catch {
      setError("Matchmaking failed. Try again.");
      setIsMatchmaking(false);
    } finally {
      setLoading(false);
    }
  };

  // ───────────── SHARED BACK HEADER ─────────────
  const BackHeader = ({ title }) => (
    <div className="flex items-center gap-3 mb-8">
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
      >
        <ArrowLeft size={14} />
        Back
      </button>
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-white/30 text-xs font-mono uppercase tracking-widest">{title}</span>
    </div>
  );

  // ───────────── UI ─────────────
  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6 text-white">

      {/* HEADER — only on main menu */}
      {!mode && (
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-widest">DEBATE ARENA</h1>
          <div className="flex justify-center gap-6 mt-3 text-xs text-white/30">
            <span className="flex items-center gap-1"><Zap size={11} /> AI Judge</span>
            <span className="flex items-center gap-1"><Trophy size={11} /> 3 Rounds</span>
            <span className="flex items-center gap-1"><Swords size={11} /> Live PvP</span>
          </div>
          <p className="text-white/20 text-xs mt-2 font-mono">
            {connectionStatus === "connected" ? "● SERVER ONLINE" : "○ CONNECTING..."}
          </p>
        </div>
      )}

      {/* ── MAIN MENU ── */}
      {!mode && (
        <div className="arena-card w-full max-w-sm p-6">
          {/* NAME — required before anything else */}
          <input
            className="arena-input w-full mb-5 px-4 py-3 text-sm"
            placeholder="Enter your name to begin"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError(); }}
            maxLength={24}
          />

          {/* Name hint */}
          {!nameEntered && (
            <p className="text-white/25 text-xs font-mono text-center mb-4 -mt-2">
              ↑ Enter your name first
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { clearError(); setMode("friend"); }}
              disabled={!nameEntered}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: nameEntered ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "rgba(255,255,255,0.05)", color: "white" }}
            >
              <Swords size={15} />
              Create Room
            </button>

            <button
              onClick={() => { clearError(); setMode("join"); }}
              disabled={!nameEntered}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              style={{ background: "rgba(255,255,255,0.04)", color: nameEntered ? "white" : "rgba(255,255,255,0.3)" }}
            >
              <Users size={15} />
              Join Room
            </button>

            <button
              onClick={() => { clearError(); setMode("stranger"); }}
              disabled={!nameEntered}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              style={{ background: "rgba(255,255,255,0.04)", color: nameEntered ? "white" : "rgba(255,255,255,0.3)" }}
            >
              <Zap size={15} />
              Quick Match
            </button>
          </div>

          {error && <p className="text-red-400 mt-4 text-xs text-center font-mono">{error}</p>}
        </div>
      )}

      {/* ── CREATE ROOM ── */}
      {mode === "friend" && (
        <div className="arena-card w-full max-w-md p-6">
          <BackHeader title="Create Room" />

          <p className="text-white/40 text-xs font-mono mb-1">Playing as</p>
          <p className="text-white font-semibold mb-4">{name}</p>

          <textarea
            className="arena-input w-full p-4 mb-3 text-sm"
            style={{ height: "96px", resize: "none" }}
            placeholder="Enter debate topic..."
            value={topic}
            onChange={(e) => { setTopic(e.target.value); clearError(); }}
          />

          <div className="flex flex-wrap gap-2 mb-5">
            {SUGGESTED_TOPICS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTopic(t)}
                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 mb-3 text-xs font-mono">{error}</p>}

          <button
            onClick={handleCreateRoom}
            disabled={loading || !topic.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white" }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : <><Swords size={15} /> Create Room</>}
          </button>
        </div>
      )}

      {/* ── JOIN ROOM ── */}
      {mode === "join" && (
        <div className="arena-card w-full max-w-sm p-6">
          <BackHeader title="Join Room" />

          <p className="text-white/40 text-xs font-mono mb-1">Playing as</p>
          <p className="text-white font-semibold mb-5">{name}</p>

          <input
            className="arena-input w-full px-4 py-3 mb-5 text-sm tracking-widest uppercase text-center"
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); clearError(); }}
            maxLength={6}
          />

          {error && <p className="text-red-400 mb-3 text-xs font-mono">{error}</p>}

          <button
            onClick={handleJoinRoom}
            disabled={loading || !joinCode.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white" }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Joining...</> : <><Users size={15} /> Join Room</>}
          </button>
        </div>
      )}

      {/* ── QUICK MATCH / MATCHMAKING ── */}
      {mode === "stranger" && (
        <div className="arena-card w-full max-w-sm p-6">
          <BackHeader title="Quick Match" />

          <p className="text-white/40 text-xs font-mono mb-1">Playing as</p>
          <p className="text-white font-semibold mb-6">{name}</p>

          {!inQueue ? (
            <>
              <div className="text-center mb-6 py-4 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Zap size={28} className="text-purple-400 mx-auto mb-2" />
                <p className="text-white/60 text-sm">Get matched with a random opponent</p>
                <p className="text-white/30 text-xs mt-1 font-mono">Topic is assigned automatically</p>
              </div>

              {error && <p className="text-red-400 mb-3 text-xs font-mono text-center">{error}</p>}

              <button
                onClick={handleFindMatch}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white" }}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Searching...</>
                  : <><Zap size={15} /> Find Match</>
                }
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute inset-0 rounded-full border border-purple-500/30"
                      style={{ animation: `ping 2s ease-out ${i * 0.5}s infinite` }} />
                  ))}
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.2)", border: "2px solid rgba(124,58,237,0.5)" }}>
                    <Loader2 size={24} className="text-purple-400 animate-spin" />
                  </div>
                </div>
                <p className="text-white/60 text-sm font-mono">Searching for opponent...</p>
                <p className="text-white/30 text-xs mt-1">This might take a moment</p>
              </div>

              <button
                onClick={goBack}
                className="w-full py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 transition-colors border border-white/10 font-mono"
              >
                Cancel Search
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}