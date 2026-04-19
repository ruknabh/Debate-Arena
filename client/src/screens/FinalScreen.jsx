import { useMemo, useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import CrowdMeter from "../components/CrowdMeter";
import { Trophy, RotateCcw, RefreshCw, Crown, Swords, Star, ThumbsUp, ThumbsDown } from "lucide-react";

// ── Particle burst ────────────────────────────────────────────────
function Particles({ color }) {
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 70,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 1.5 + 0.8,
      delay: Math.random() * 3,
      shape: Math.random() > 0.5 ? "50%" : "0%",
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.left}%`,
          top: `${p.top}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: p.shape,
          background: color,
          opacity: 0.7,
          animation: `ping ${p.duration}s ease-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Animated stat bar ─────────────────────────────────────────────
function StatBar({ label, myVal, oppVal, myColor, oppColor, delay = 0 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const total = (myVal || 0) + (oppVal || 0);
  const myPct = total ? ((myVal || 0) / total) * 100 : 50;
  const oppPct = 100 - myPct;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: myColor }}>
          {myVal ?? 0}
        </span>
        <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{label}</span>
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: oppColor }}>
          {oppVal ?? 0}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all duration-1000"
          style={{
            width: animated ? `${myPct}%` : "50%",
            background: `linear-gradient(90deg, ${myColor}99, ${myColor})`,
            transitionDelay: `${delay}ms`,
          }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-1000"
          style={{
            width: animated ? `${oppPct}%` : "50%",
            background: `linear-gradient(270deg, ${oppColor}99, ${oppColor})`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

// ── Debate side badge ─────────────────────────────────────────────
// p1 is always FOR the topic, p2 is always AGAINST
function DebateSideBadge({ playerKey }) {
  const isFor = playerKey === "p1";

  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 mb-2"
      style={{
        background: isFor ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        border: `1px solid ${isFor ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
      }}
    >
      {isFor
        ? <ThumbsUp size={10} style={{ color: "#4ade80" }} />
        : <ThumbsDown size={10} style={{ color: "#f87171" }} />
      }
      <span
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: isFor ? "#4ade80" : "#f87171" }}
      >
        {isFor ? "FOR" : "AGAINST"}
      </span>
    </div>
  );
}

// ── Player score card ─────────────────────────────────────────────
function PlayerCard({ playerKey, player, score, roundsWon, isWinner, isDraw, color, isMe, side }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), side === "left" ? 200 : 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="arena-card p-5 flex flex-col items-center text-center transition-all duration-700"
      style={{
        borderColor: isWinner ? color + "88" : "var(--border)",
        boxShadow: isWinner ? `0 0 40px ${color}22` : "none",
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${side === "left" ? "-20px" : "20px"})`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display mb-3 border-2"
        style={{
          background: color + "22",
          borderColor: color + "66",
          color,
        }}
      >
        {(player?.name || "?")[0].toUpperCase()}
      </div>

      <p className="font-mono text-xs uppercase tracking-widest mb-0.5" style={{ color }}>
        {player?.name || "Player"}
        {isMe && <span className="text-white/30 ml-1">(you)</span>}
      </p>

      {/* ── FOR / AGAINST badge ── */}
      <DebateSideBadge playerKey={playerKey} />

      {isWinner && !isDraw && (
        <div className="flex items-center gap-1 mb-2">
          <Crown size={12} style={{ color: "#ffd700" }} />
          <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest">Winner</span>
        </div>
      )}

      {/* Score */}
      <div className="font-display leading-none my-2" style={{ fontSize: "3.5rem", color }}>
        {score ?? 0}
      </div>
      <p className="font-mono text-xs text-white/30 uppercase tracking-widest">total pts</p>

      {/* Rounds won */}
      <div className="flex gap-1 mt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < roundsWon ? color : "none"}
            style={{ color: i < roundsWon ? color : "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>
      <p className="font-mono text-xs text-white/20 mt-1">{roundsWon} round{roundsWon !== 1 ? "s" : ""} won</p>
    </div>
  );
}

// ── Round history card ────────────────────────────────────────────
function RoundCard({ round, myRole, index }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 600 + index * 150);
    return () => clearTimeout(t);
  }, []);

  const result = round?.result;
  if (!result) return null;

  const isP1 = myRole === "p1";
  const myScores = isP1 ? result.p1 : result.p2;
  const oppScores = isP1 ? result.p2 : result.p1;
  const iWon = result.roundWinner === myRole;
  const isDraw = result.roundWinner === "draw";

  return (
    <div
      className="arena-card p-4 transition-all duration-500"
      style={{
        borderColor: isDraw ? "#ffd70033" : iWon ? "#4ade8033" : "#f8717133",
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold"
            style={{
              background: isDraw ? "rgba(255,215,0,0.15)" : iWon ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
              color: isDraw ? "#ffd700" : iWon ? "#4ade80" : "#f87171",
            }}
          >
            {round.round}
          </div>
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Round {round.round}</span>
        </div>
        <span
          className="font-mono text-xs uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            color: isDraw ? "#ffd700" : iWon ? "#4ade80" : "#f87171",
            background: isDraw ? "rgba(255,215,0,0.1)" : iWon ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
          }}
        >
          {isDraw ? "Draw" : iWon ? "You Won" : "You Lost"}
        </span>
      </div>

      {result.verdict && (
        <p className="text-white/50 text-xs italic leading-relaxed mb-2 pl-2 border-l border-purple-500/30">
          "{result.verdict}"
        </p>
      )}

      <div className="flex justify-between font-mono text-xs">
        <span style={{ color: "#00aaff" }}>{myScores?.total ?? 0} pts</span>
        <span className="text-white/20">vs</span>
        <span style={{ color: "#ff2d55" }}>{oppScores?.total ?? 0} pts</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function FinalScreen() {
  const { room, myRole, resetGame } = useGameStore();
  const { requestRematch } = useRoom();
  const [titleShown, setTitleShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleShown(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!room) return null;

  const { players = {}, topic = "No topic", rounds = [], winner, crowdMeter = 50 } = room;
  const p1 = players?.p1 || {};
  const p2 = players?.p2 || {};
  const isP1 = myRole === "p1";

  // From viewer's perspective: you=blue, opp=red
  const myColor = "#00aaff";
  const oppColor = "#ff2d55";
  const myPlayer = isP1 ? p1 : p2;
  const oppPlayer = isP1 ? p2 : p1;
  const myPlayerKey = myRole;           // "p1" or "p2"
  const oppPlayerKey = isP1 ? "p2" : "p1";
  const myScore = isP1 ? (p1.score ?? 0) : (p2.score ?? 0);
  const oppScore = isP1 ? (p2.score ?? 0) : (p1.score ?? 0);

  const iWon = winner === myRole;
  const isDraw = winner === "draw";

  const winnerPlayer = winner === "p1" ? p1 : winner === "p2" ? p2 : null;
  const winnerColor = winner === "p1" ? "#ff2d55" : winner === "p2" ? "#00aaff" : "#ffd700";

  const myRoundsWon = rounds.filter((r) => r?.result?.roundWinner === myRole).length;
  const oppRoundsWon = rounds.filter((r) => {
    const w = r?.result?.roundWinner;
    return w && w !== myRole && w !== "draw";
  }).length;

  const p1RoundsWon = rounds.filter((r) => r?.result?.roundWinner === "p1").length;
  const p2RoundsWon = rounds.filter((r) => r?.result?.roundWinner === "p2").length;

  // Headline message
  const headline = isDraw ? "IT'S A DRAW" : iWon ? "VICTORY!" : "DEFEAT";
  const headlineColor = isDraw ? "#ffd700" : iWon ? "#4ade80" : "#f87171";
  const subline = isDraw
    ? "An equal battle — both debaters stood their ground."
    : iWon
    ? "Your arguments carried the day."
    : `${winnerPlayer?.name || "Opponent"} won the debate.`;

  return (
    <div className="min-h-screen arena-bg text-white relative overflow-x-hidden">

      {/* Particle burst for winner */}
      {!isDraw && <Particles color={winnerColor} />}

      {/* Glowing top beam */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 blur-xl rounded-full"
        style={{ background: headlineColor + "88" }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── HEADLINE ── */}
        <div
          className="text-center mb-10 transition-all duration-700"
          style={{ opacity: titleShown ? 1 : 0, transform: titleShown ? "translateY(0)" : "translateY(-30px)" }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy size={20} style={{ color: "#ffd700" }} />
            <span className="font-mono text-xs text-white/30 uppercase tracking-widest">Debate Complete</span>
            <Trophy size={20} style={{ color: "#ffd700" }} />
          </div>

          <h1
            className="font-display tracking-widest mb-2"
            style={{ fontSize: "clamp(3rem, 10vw, 5rem)", color: headlineColor, lineHeight: 1 }}
          >
            {headline}
          </h1>

          <p className="text-white/40 text-sm font-mono">{subline}</p>

          <div
            className="mt-3 mx-auto max-w-sm text-xs font-mono text-white/20 uppercase tracking-widest px-4 py-2 rounded-full border border-white/10"
          >
            {topic}
          </div>
        </div>

        {/* ── PLAYER CARDS ── */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <PlayerCard
            playerKey={myPlayerKey}
            player={myPlayer}
            score={myScore}
            roundsWon={myRoundsWon}
            isWinner={iWon}
            isDraw={isDraw}
            color={myColor}
            isMe={true}
            side="left"
          />
          <PlayerCard
            playerKey={oppPlayerKey}
            player={oppPlayer}
            score={oppScore}
            roundsWon={oppRoundsWon}
            isWinner={!iWon && !isDraw}
            isDraw={isDraw}
            color={oppColor}
            isMe={false}
            side="right"
          />
        </div>

        {/* VS divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-white/5" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10">
            <Swords size={12} className="text-white/20" />
            <span className="font-mono text-xs text-white/20 uppercase tracking-widest">Stats</span>
          </div>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* ── STAT BARS ── */}
        <div className="arena-card p-5 mb-6">
          {/* Header labels */}
          <div className="flex justify-between mb-4">
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: myColor }}>
              {myPlayer.name || "You"} (you)
            </span>
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: oppColor }}>
              {oppPlayer.name || "Opponent"}
            </span>
          </div>

          <div className="space-y-4">
            {[
              { label: "Logic", myVal: isP1 ? p1.totalLogic : p2.totalLogic, oppVal: isP1 ? p2.totalLogic : p1.totalLogic, delay: 0 },
              { label: "Creativity", myVal: isP1 ? p1.totalCreativity : p2.totalCreativity, oppVal: isP1 ? p2.totalCreativity : p1.totalCreativity, delay: 100 },
              { label: "Persuasion", myVal: isP1 ? p1.totalPersuasion : p2.totalPersuasion, oppVal: isP1 ? p2.totalPersuasion : p1.totalPersuasion, delay: 200 },
              { label: "Rounds Won", myVal: myRoundsWon, oppVal: oppRoundsWon, delay: 300 },
            ].map(({ label, myVal, oppVal, delay }) => (
              <StatBar
                key={label}
                label={label}
                myVal={myVal}
                oppVal={oppVal}
                myColor={myColor}
                oppColor={oppColor}
                delay={delay}
              />
            ))}
          </div>
        </div>

        {/* ── CROWD METER ── */}
        <div className="arena-card p-4 mb-6">
          <p className="font-mono text-xs text-white/20 uppercase tracking-widest mb-3 text-center">Final Crowd Sentiment</p>
          <CrowdMeter crowdValue={crowdMeter} p1Name={p1.name} p2Name={p2.name} />
        </div>

        {/* ── ROUND HISTORY ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="font-mono text-xs text-white/20 uppercase tracking-widest">Round Breakdown</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="space-y-3">
            {rounds.map((r, i) => (
              <RoundCard key={r.round} round={r} myRole={myRole} index={i} />
            ))}
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div
          className="flex gap-3 justify-center transition-all duration-700"
          style={{ opacity: titleShown ? 1 : 0, transitionDelay: "800ms" }}
        >
          <button
            onClick={requestRematch}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "white" }}
          >
            <RefreshCw size={15} />
            Rematch
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 border border-white/10 text-white/60 hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <RotateCcw size={15} />
            New Game
          </button>
        </div>

      </div>
    </div>
  );
}