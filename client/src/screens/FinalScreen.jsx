import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import CrowdMeter from "../components/CrowdMeter";
import { Trophy, RotateCcw, RefreshCw } from "lucide-react";

// 🔥 Stable fireworks (no re-random every render)
function Fireworks({ color }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 60,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 1 + 0.5,
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: color,
            animation: `ping ${p.duration}s ease-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function FinalScreen() {
  const { room, myRole, resetGame } = useGameStore();
  const { requestRematch } = useRoom();

  if (!room) return null;

  const {
    players = {},
    topic = "No topic",
    rounds = [],
    winner,
    crowdMeter = 50,
  } = room;

  const p1 = players?.p1 || {};
  const p2 = players?.p2 || {};

  const winnerColor =
    winner === "p1"
      ? "#ff2d55"
      : winner === "p2"
      ? "#00aaff"
      : "#ffd700";

  const winnerPlayer =
    winner === "p1"
      ? p1
      : winner === "p2"
      ? p2
      : null;

  const iWon = winner === myRole;

  // ✅ SAFE ROUND COUNT
  const p1RoundsWon = rounds.filter(
    (r) => r?.result?.roundWinner === "p1"
  ).length;

  const p2RoundsWon = rounds.filter(
    (r) => r?.result?.roundWinner === "p2"
  ).length;

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6 relative text-white">

      {winner !== "draw" && <Fireworks color={winnerColor} />}

      {/* HEADER */}
      <div className="text-center mb-10">
        <Trophy size={48} className="mx-auto text-yellow-400" />

        <p className="text-white/60 mt-2">
          {winner === "draw"
            ? "The battle ends in a"
            : iWon
            ? "🏆 You Won!"
            : "Winner"}
        </p>

        {winner === "draw" ? (
          <h1 className="text-4xl font-bold text-yellow-400">DRAW</h1>
        ) : (
          <h1 className="text-4xl font-bold" style={{ color: winnerColor }}>
            {winnerPlayer?.name || "Unknown"}
          </h1>
        )}

        <p className="text-white/40 text-sm mt-2">{topic}</p>

        {/* SCORE */}
        <div className="flex gap-6 justify-center mt-6 text-lg">
          <div>
            <div className="text-red-400 font-bold">
              {p1.score ?? 0}
            </div>
            <div>{p1.name || "P1"}</div>
          </div>

          <div className="text-white/40">VS</div>

          <div>
            <div className="text-blue-400 font-bold">
              {p2.score ?? 0}
            </div>
            <div>{p2.name || "P2"}</div>
          </div>
        </div>
      </div>

      {/* CROWD */}
      <CrowdMeter
        crowdValue={crowdMeter}
        p1Name={p1.name}
        p2Name={p2.name}
      />

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-xl">

        {[
          { label: "Logic", p1: p1.totalLogic, p2: p2.totalLogic },
          { label: "Creativity", p1: p1.totalCreativity, p2: p2.totalCreativity },
          { label: "Persuasion", p1: p1.totalPersuasion, p2: p2.totalPersuasion },
          { label: "Rounds Won", p1: p1RoundsWon, p2: p2RoundsWon },
        ].map(({ label, p1, p2 }) => {
          const total = (p1 || 0) + (p2 || 0);
          const percentage = total ? (p1 / total) * 100 : 50;

          return (
            <div key={label}>
              <p className="text-white/60 text-sm">{label}</p>

              <div className="text-sm mb-1">
                {p1 || 0} - {p2 || 0}
              </div>

              <div className="h-1 bg-gray-700 rounded">
                <div
                  style={{
                    width: `${percentage}%`,
                    background: "#ff2d55",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ROUND HISTORY */}
      <div className="mt-8 w-full max-w-xl space-y-3">
        {rounds.map((r, i) => (
          <div
            key={i}
            className="bg-black/20 border border-white/10 p-3 rounded"
          >
            <strong>Round {r?.round}</strong>

            <p className="text-white/60 text-sm">
              {r?.result?.verdict || "No verdict"}
            </p>

            <div className="text-sm">
              {(r?.result?.p1?.total ?? 0)} -{" "}
              {(r?.result?.p2?.total ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={requestRematch}
          className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600"
        >
          <RefreshCw size={16} className="inline mr-1" />
          Rematch
        </button>

        <button
          onClick={resetGame}
          className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-600"
        >
          <RotateCcw size={16} className="inline mr-1" />
          New Game
        </button>
      </div>
    </div>
  );
}