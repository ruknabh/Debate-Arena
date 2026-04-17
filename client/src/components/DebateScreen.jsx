import { useState } from "react";
import axios from "axios";
import { useGameStore } from "../store/gameStore";
import ScorePanel from "./ScorePanel";
import CrowdMeter from "./CrowdMeter";
import JudgeStream from "./JudgeStream";
import { Send, RotateCcw, ChevronRight } from "lucide-react";

export default function DebateScreen() {
  const {
    gameId, game, phase, lastScores, error,
    setPhase, setGame, setError, resetGame,
  } = useGameStore();

  const [p1Arg, setP1Arg] = useState("");
  const [p2Arg, setP2Arg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isJudging = phase === "judging";
  const isResults = phase === "results";
  const canSubmit = p1Arg.trim().length > 10 && p2Arg.trim().length > 10 && !isJudging && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`/api/game/${gameId}/judge`, {
        p1Argument: p1Arg.trim(),
        p2Argument: p2Arg.trim(),
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit. Check server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = () => {
    setP1Arg("");
    setP2Arg("");
    setPhase("debate");
  };

  if (!game) return null;

  const { players, topic, currentRound, maxRounds, crowdMeter, rounds } = game;
  const p1Winning = players.p1.score > players.p2.score;
  const p2Winning = players.p2.score > players.p1.score;

  return (
    <div className="min-h-screen arena-bg p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <button onClick={resetGame} className="btn btn-outline text-sm py-2 px-4">
          <RotateCcw size={14} /> New Game
        </button>

        {/* Round indicator */}
        <div className="flex items-center gap-3">
          {Array.from({ length: maxRounds }).map((_, i) => {
            const roundNum = i + 1;
            const done = roundNum < currentRound || phase === "final";
            const active = roundNum === currentRound && phase !== "final";
            const roundResult = rounds[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg transition-all ${
                    active
                      ? "border-2 border-purple-500 text-purple-400 bg-purple-500/10"
                      : done
                      ? "border-2 border-white/20 text-white/40 bg-white/5"
                      : "border border-white/10 text-white/20"
                  }`}
                >
                  {roundNum}
                </div>
                {roundResult && (
                  <div
                    className="text-xs font-mono"
                    style={{
                      color:
                        roundResult.scores?.roundWinner === "p1"
                          ? "#ff2d55"
                          : roundResult.scores?.roundWinner === "p2"
                          ? "#00aaff"
                          : "#ffd700",
                    }}
                  >
                    {roundResult.scores?.roundWinner === "p1"
                      ? players.p1.name.slice(0, 3).toUpperCase()
                      : roundResult.scores?.roundWinner === "p2"
                      ? players.p2.name.slice(0, 3).toUpperCase()
                      : "TIE"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="round-badge">
          ROUND {Math.min(currentRound, maxRounds)} / {maxRounds}
        </div>
      </div>

      {/* Topic banner */}
      <div className="text-center mb-6 max-w-6xl mx-auto">
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">Today's Topic</p>
        <h2 className="font-display text-3xl md:text-4xl text-white tracking-wider leading-tight">
          {topic}
        </h2>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* P1 Column */}
        <div className="flex flex-col gap-4">
          <ScorePanel
            player="p1"
            name={players.p1.name}
            score={players.p1.score}
            roundScores={lastScores?.scores?.p1}
            isWinning={p1Winning}
          />

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#ff2d55" }}>
              {players.p1.name}'s Argument (FOR)
            </label>
            <textarea
              className="arena-input p-4 h-44 text-sm"
              placeholder={`Argue FOR: "${topic}"\n\nMake it logical, creative, and persuasive...`}
              value={p1Arg}
              onChange={(e) => setP1Arg(e.target.value)}
              disabled={isJudging || isResults}
            />
            <div className="text-right mt-1 font-mono text-xs text-white/20">
              {p1Arg.length} chars
            </div>
          </div>
        </div>

        {/* Center column */}
        <div className="flex flex-col gap-4">
          {/* VS badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-px w-16 bg-white/10" />
              <span className="font-display text-4xl text-white/20 tracking-widest">VS</span>
              <div className="h-px w-16 bg-white/10" />
            </div>
          </div>

          {/* Crowd Meter */}
          <div className="arena-card p-4">
            <CrowdMeter
              crowdValue={crowdMeter}
              p1Name={players.p1.name}
              p2Name={players.p2.name}
            />
          </div>

          {/* Judge stream */}
          <JudgeStream />

          {/* Round verdict (after judging) */}
          {isResults && lastScores && (
            <div className="arena-card p-5 animate-slide-up" style={{ borderColor: "rgba(255,215,0,0.3)" }}>
              <div className="text-center mb-3">
                <span className="font-mono text-xs text-yellow-400/70 uppercase tracking-widest">Round Verdict</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed text-center italic">
                "{lastScores.scores.verdict}"
              </p>
              <div className="mt-4 text-center">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-display text-lg tracking-widest"
                  style={{
                    background: lastScores.scores.roundWinner === "p1"
                      ? "rgba(255,45,85,0.15)"
                      : lastScores.scores.roundWinner === "p2"
                      ? "rgba(0,170,255,0.15)"
                      : "rgba(255,215,0,0.15)",
                    color: lastScores.scores.roundWinner === "p1" ? "#ff2d55"
                      : lastScores.scores.roundWinner === "p2" ? "#00aaff" : "#ffd700",
                    border: `1px solid ${lastScores.scores.roundWinner === "p1" ? "#ff2d5544"
                      : lastScores.scores.roundWinner === "p2" ? "#00aaff44" : "#ffd70044"}`,
                  }}
                >
                  {lastScores.scores.roundWinner === "p1"
                    ? `${players.p1.name} wins round!`
                    : lastScores.scores.roundWinner === "p2"
                    ? `${players.p2.name} wins round!`
                    : "Round Tied!"}
                </div>
              </div>

              <button
                className="btn btn-primary w-full mt-4"
                onClick={handleNextRound}
              >
                <ChevronRight size={16} />
                Next Round
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="arena-card p-4 border-red-500/30" style={{ borderColor: "rgba(255,45,85,0.3)" }}>
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit button */}
          {!isResults && (
            <button
              className="btn btn-primary py-4 font-display text-xl tracking-widest"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isJudging || submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  CLAUDE IS JUDGING...
                </span>
              ) : (
                <>
                  <Send size={18} />
                  SUBMIT FOR JUDGMENT
                </>
              )}
            </button>
          )}

          {/* Round history mini */}
          {rounds.length > 0 && (
            <div className="arena-card p-4">
              <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-3">Round History</p>
              <div className="space-y-2">
                {rounds.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-white/40 text-xs">Round {r.round}</span>
                    <div className="flex gap-3">
                      <span style={{ color: "#ff2d55" }} className="font-display">
                        {r.scores?.p1?.total ?? 0}
                      </span>
                      <span className="text-white/20">—</span>
                      <span style={{ color: "#00aaff" }} className="font-display">
                        {r.scores?.p2?.total ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* P2 Column */}
        <div className="flex flex-col gap-4">
          <ScorePanel
            player="p2"
            name={players.p2.name}
            score={players.p2.score}
            roundScores={lastScores?.scores?.p2}
            isWinning={p2Winning}
          />

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#00aaff" }}>
              {players.p2.name}'s Argument (AGAINST)
            </label>
            <textarea
              className="arena-input p-4 h-44 text-sm"
              placeholder={`Argue AGAINST: "${topic}"\n\nMake it logical, creative, and persuasive...`}
              value={p2Arg}
              onChange={(e) => setP2Arg(e.target.value)}
              disabled={isJudging || isResults}
            />
            <div className="text-right mt-1 font-mono text-xs text-white/20">
              {p2Arg.length} chars
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}