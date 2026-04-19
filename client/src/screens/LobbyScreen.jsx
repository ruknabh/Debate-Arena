import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { Copy, Check, Users, Loader2 } from "lucide-react";
import { getSocket } from "../hooks/useSocket";

export default function LobbyScreen() {
  const {
    roomCode,
    myRole,
    myName,
    room,
    resetGame,
    setPhase,
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const hasStartedRef = useRef(false);

  const isP1 = myRole === "p1";
  const p1 = room?.players?.p1;
  const p2 = room?.players?.p2;
  const bothPresent = !!(p1 && p2);

  const opponentName = isP1 ? p2?.name : p1?.name;

  // ─────────────────────────────
  // TRANSITION TO DEBATE
  // When bothPresent becomes true, show countdown then transition
  // Uses countdown state (not refs) so StrictMode can't break it
  // ─────────────────────────────
  useEffect(() => {
    if (!bothPresent) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Start countdown: 3 → 2 → 1 → debate
    setCountdown(3);
  }, [bothPresent]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setPhase("debate");
      return;
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, setPhase]);

  // Reset ref on unmount (so rematch works)
  useEffect(() => {
    return () => {
      hasStartedRef.current = false;
    };
  }, []);

  // ─────────────────────────────
  // SAFE GUARD
  // ─────────────────────────────
  if (!room) {
    return (
      <div className="min-h-screen arena-bg flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-3" size={32} />
          <p className="text-white/60">Joining room...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────
  // COPY CODE
  // ─────────────────────────────
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Copy failed");
    }
  };

  // ─────────────────────────────
  // LEAVE
  // ─────────────────────────────
  const handleLeave = () => {
    const socket = getSocket();
    if (socket?.connected && roomCode) {
      socket.emit("room:leave", { roomCode });
    }
    hasStartedRef.current = false;
    resetGame();
  };

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6">
      <div className="arena-card w-full max-w-md p-8 glow-purple text-center">

        {/* TITLE */}
        <h2 className="font-display text-4xl text-white mb-2">LOBBY</h2>
        <p className="text-white/30 text-xs mb-8 font-mono uppercase tracking-widest">
          {room.topic || "Waiting for topic..."}
        </p>

        {/* PLAYERS */}
        <div className="flex justify-center gap-8 mb-8">

          {/* ME */}
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold"
              style={{ borderColor: isP1 ? "#ff2d55" : "#00aaff" }}
            >
              {(myName || "?")[0].toUpperCase()}
            </div>
            <div className="text-white text-sm font-semibold">{myName || "You"}</div>
            <div className="text-xs text-white/40 mb-1">
              {isP1 ? "FOR" : "AGAINST"}
            </div>
            <div className="text-green-400 text-xs">● READY</div>
          </div>

          {/* VS */}
          <div className="flex items-center text-white/20 text-2xl font-display">VS</div>

          {/* OPPONENT */}
          <div className="text-center">
            {bothPresent ? (
              <>
                <div
                  className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold"
                  style={{ borderColor: isP1 ? "#00aaff" : "#ff2d55" }}
                >
                  {(opponentName || "?")[0].toUpperCase()}
                </div>
                <div className="text-white text-sm font-semibold">{opponentName}</div>
                <div className="text-xs text-white/40 mb-1">
                  {isP1 ? "AGAINST" : "FOR"}
                </div>
                <div className="text-green-400 text-xs">● READY</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-dashed border-2 border-white/20 rounded-full flex items-center justify-center mb-2">
                  <Users size={20} className="text-white/20" />
                </div>
                <div className="text-white/30 text-sm">Waiting...</div>
                <div className="text-xs text-white/20 mt-1">Share the code</div>
              </>
            )}
          </div>
        </div>

        {/* ROOM CODE — only show to P1 while waiting */}
        {isP1 && !bothPresent && (
          <div className="mb-6 bg-white/5 rounded-xl p-4">
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">
              Room Code
            </p>
            <div className="flex justify-center items-center gap-3">
              <div className="text-3xl font-display text-purple-400 tracking-widest">
                {roomCode}
              </div>
              <button
                onClick={copyCode}
                className="text-white/40 hover:text-white transition-colors"
              >
                {copied
                  ? <Check size={18} className="text-green-400" />
                  : <Copy size={18} />
                }
              </button>
            </div>
            <p className="text-white/20 text-xs mt-2">Share this with your opponent</p>
          </div>
        )}

        {/* STATUS */}
        {bothPresent ? (
          <div className="space-y-2">
            <div className="text-green-400 flex items-center justify-center gap-2 text-sm">
              <Loader2 className="animate-spin" size={16} />
              Both players ready!
            </div>
            {countdown !== null && countdown > 0 && (
              <div className="text-4xl font-display text-purple-400 animate-pulse">
                {countdown}
              </div>
            )}
            {countdown === 0 && (
              <div className="text-white font-display text-lg tracking-widest">
                FIGHT!
              </div>
            )}
          </div>
        ) : (
          <div className="text-white/30 text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} />
            Waiting for opponent to join...
          </div>
        )}

        {/* LEAVE */}
        <button
          onClick={handleLeave}
          className="mt-8 text-xs text-white/20 hover:text-red-400 transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}