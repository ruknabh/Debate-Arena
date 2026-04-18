import { useState, useEffect, useRef } from "react";
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
  const startedRef = useRef(false);

  const isP1 = myRole === "p1";

  const opponentName = isP1
    ? room?.players?.p2?.name
    : room?.players?.p1?.name;

  const bothPresent = !!(room?.players?.p1 && room?.players?.p2);

  // ✅ START GAME EFFECT (CLEAN)
  useEffect(() => {
    if (!bothPresent) return;
    if (startedRef.current) return;

    startedRef.current = true;

    const timer = setTimeout(() => {
      setPhase("debate");
    }, 1200);

    return () => clearTimeout(timer);
  }, [bothPresent, setPhase]);

  // ✅ GUARD (CORRECT POSITION)
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Joining room...</p>
      </div>
    );
  }

  // COPY CODE
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Copy failed");
    }
  };

  // LEAVE ROOM
  const handleLeave = () => {
    const socket = getSocket();

    if (socket?.connected && roomCode) {
      socket.emit("room:leave", { roomCode });
    }

    startedRef.current = false;
    resetGame();
  };

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6">
      <div className="arena-card w-full max-w-md p-8 glow-purple text-center">

        {/* TITLE */}
        <h2 className="font-display text-4xl text-white mb-2">LOBBY</h2>
        <p className="text-white/30 text-xs mb-8">
          {room.topic || "Waiting for topic..."}
        </p>

        {/* PLAYERS */}
        <div className="flex justify-center gap-8 mb-8">

          {/* ME */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2">
              {(myName || "?")[0].toUpperCase()}
            </div>
            <div className="text-white">{myName || "You"}</div>
            <div className="text-xs text-white/40">
              {isP1 ? "FOR" : "AGAINST"}
            </div>
            <div className="text-green-400 text-xs">● READY</div>
          </div>

          <div className="text-white/30 text-2xl">VS</div>

          {/* OPPONENT */}
          <div className="text-center">
            {bothPresent ? (
              <>
                <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2">
                  {(opponentName || "?")[0].toUpperCase()}
                </div>
                <div className="text-white">{opponentName}</div>
                <div className="text-xs text-white/40">
                  {isP1 ? "AGAINST" : "FOR"}
                </div>
                <div className="text-green-400 text-xs">● READY</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-dashed border-2 flex items-center justify-center mb-2">
                  <Users size={18} />
                </div>
                <div className="text-white/30 text-sm">Waiting...</div>
              </>
            )}
          </div>
        </div>

        {/* ROOM CODE */}
        {isP1 && !bothPresent && (
          <div className="mb-6">
            <p className="text-white/30 text-xs mb-2">Share Code</p>

            <div className="flex justify-center items-center gap-2">
              <div className="text-3xl text-purple-400 tracking-widest">
                {roomCode}
              </div>

              <button onClick={copyCode}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* STATUS */}
        {bothPresent ? (
          <div className="text-green-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Starting debate...
          </div>
        ) : (
          <div className="text-white/40 text-sm">
            Waiting for opponent...
          </div>
        )}

        {/* LEAVE */}
        <button
          onClick={handleLeave}
          className="mt-6 text-sm text-white/40 hover:text-red-400"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}