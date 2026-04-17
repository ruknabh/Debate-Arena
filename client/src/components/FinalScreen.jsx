import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import CrowdMeter from "./CrowdMeter";
import { Trophy, RotateCcw, Star } from "lucide-react";

function Fireworks({ color }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            borderRadius: "50%",
            background: color,
            animation: `ping ${Math.random() * 1 + 0.5}s ease-out ${Math.random() * 2}s infinite`,
            opacity: Math.random() * 0.8 + 0.2,
          }}
        />
      ))}
    </div>
  );
}

export default function FinalScreen() {
  const { game, resetGame } = useGameStore();
  if (!game) return null;

  const { players, topic, rounds, winner, crowdMeter } = game;

  const winnerPlayer = winner === "p1" ? players.p1 : winner === "p2" ? players.p2 : null;
  const loserPlayer = winner === "p1" ? players.p2 : winner === "p2" ? players.p1 : null;
  const winnerColor = winner === "p1" ? "#ff2d55" : winner === "p2" ? "#00aaff" : "#ffd700";

  const totalRounds = rounds.length;

  // Stat totals
  const p1RoundsWon = rounds.filter((r) => r.scores?.roundWinner === "p1").length;
  const p2RoundsWon = rounds.filter((r) => r.scores?.roundWinner === "p2").length;

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6 relative">
      {winner !== "draw" && <Fireworks color={winnerColor} />}

      {/* Winner announcement */}
      <div className="text-center mb-10 relative z-10 animate-slide-up">
        <div className="mb-4">
          <Trophy size={48} color="#ffd700" className="mx-auto mb-3" />
          <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-2">
            {winner === "draw" ? "The Battle Ends In A" : "And The Winner Is..."}
          </p>
          {winner === "draw" ? (
            <h1 className="font-display text-6xl text-glow-gold" style={{ color: "#ffd700" }}>
              A DRAW!
            </h1>
          ) : (
            <>
              <h1
                className="font-display text-7xl tracking-widest"
                style={{ color: winnerColor, textShadow: `0 0 40px ${winnerColor}` }}
              >
                {winnerPlayer?.name}
              </h1>
              <p className="font-mono text-sm text-white/40 mt-2">
                {winner === "p1" ? "Argued FOR" : "Argued AGAINST"} · {topic}
              </p>
            </>
          )}
        </div>

        {/* Score comparison */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="font-display text-6xl" style={{ color: "#ff2d55" }}>
              {players.p1.score}
            </div>
            <div className="font-display text-xl text-white/60 tracking-widest mt-1">{players.p1.name}</div>
          </div>
          <div className="font-display text-3xl text-white/20">VS</div>
          <div className="text-center">
            <div className="font-display text-6xl" style={{ color: "#00aaff" }}>
              {players.p2.score}
            </div>
            <div className="font-display text-xl text-white/60 tracking-widest mt-1">{players.p2.name}</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10">
        {/* Crowd meter */}
        <div className="arena-card p-5 md:col-span-2">
          <CrowdMeter crowdValue={crowdMeter} p1Name={players.p1.name} p2Name={players.p2.name} />
        </div>

        {/* Category breakdown */}
        {[
          { label: "Logic", p1: players.p1.totalLogic, p2: players.p2.totalLogic },
          { label: "Creativity", p1: players.p1.totalCreativity, p2: players.p2.totalCreativity },
          { label: "Persuasion", p1: players.p1.totalPersuasion, p2: players.p2.totalPersuasion },
          { label: "Rounds Won", p1: p1RoundsWon, p2: p2RoundsWon },
        ].map(({ label, p1, p2 }) => (
          <div key={label} className="arena-card p-4">
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-3">{label}</p>
            <div className="flex justify-between items-end">
              <div>
                <span className="font-display text-3xl" style={{ color: "#ff2d55" }}>{p1}</span>
                <span className="font-mono text-xs text-white/30 ml-1">{players.p1.name}</span>
              </div>
              {p1 > p2 ? (
                <Star size={14} color="#ffd700" />
              ) : p2 > p1 ? (
                <Star size={14} color="#ffd700" />
              ) : null}
              <div className="text-right">
                <span className="font-mono text-xs text-white/30 mr-1">{players.p2.name}</span>
                <span className="font-display text-3xl" style={{ color: "#00aaff" }}>{p2}</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(p1 / (p1 + p2 || 1)) * 100}%`,
                  background: "linear-gradient(90deg, #ff2d55, #ff6b8a)",
                  float: "left",
                }}
              />
              <div
                className="h-full rounded-full float-right"
                style={{
                  width: `${(p2 / (p1 + p2 || 1)) * 100}%`,
                  background: "linear-gradient(270deg, #00aaff, #66ccff)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Round summaries */}
      <div className="w-full max-w-4xl mb-8 relative z-10">
        <h3 className="font-mono text-xs text-white/30 uppercase tracking-widest mb-3">Round Verdicts</h3>
        <div className="space-y-3">
          {rounds.map((r, i) => (
            <div key={i} className="arena-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div
                  className="font-display text-xl tracking-widest shrink-0"
                  style={{
                    color: r.scores?.roundWinner === "p1" ? "#ff2d55"
                      : r.scores?.roundWinner === "p2" ? "#00aaff" : "#ffd700",
                  }}
                >
                  R{r.round}
                </div>
                <p className="text-white/60 text-sm italic leading-relaxed">
                  "{r.scores?.verdict}"
                </p>
                <div className="shrink-0 font-mono text-xs text-right" style={{ minWidth: 60 }}>
                  <div style={{ color: "#ff2d55" }}>{r.scores?.p1?.total}</div>
                  <div style={{ color: "#00aaff" }}>{r.scores?.p2?.total}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Play again */}
      <button className="btn btn-primary py-4 px-12 font-display text-xl tracking-widest relative z-10" onClick={resetGame}>
        <RotateCcw size={18} />
        FIGHT AGAIN
      </button>
    </div>
  );
}