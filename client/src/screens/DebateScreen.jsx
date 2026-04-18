import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import ScorePanel from "../components/ScorePanel";
import CrowdMeter from "../components/CrowdMeter";
import JudgeStream from "../components/JudgeStream";
import { Send, RotateCcw, ChevronRight } from "lucide-react";

export default function DebateScreen() {
  const {
    room,
    myRole,
    phase,
    lastScores,
    error,
    resetGame,
    myArgSubmitted,
    opponentArgSubmitted,
    resetRound,
  } = useGameStore();

  const { submitArgument } = useRoom();

  const [myArg, setMyArg] = useState("");

  if (!room) return null;

  // 🔥 SAFE FALLBACKS
  const {
    players = {},
    topic = "No topic",
    currentRound = 1,
    maxRounds = 1,
    crowdMeter = 50,
    rounds = [],
  } = room;

  const p1 = players?.p1 || {};
  const p2 = players?.p2 || {};

  const isP1 = myRole === "p1";
  const myPlayer = isP1 ? p1 : p2;
  const oppPlayer = isP1 ? p2 : p1;

  const isJudging = phase === "judging";
  const isResults = phase === "results";

  const iSubmitted = myArgSubmitted;
  const theySubmitted = opponentArgSubmitted;

  const canSubmit =
    myArg.trim().length > 10 &&
    !isJudging &&
    !iSubmitted;

  // ─────────────────────────────
  // SUBMIT
  // ─────────────────────────────
  const handleSubmit = () => {
    if (!canSubmit) return;
    submitArgument(myArg.trim());
  };

  // ─────────────────────────────
  // NEXT ROUND
  // ─────────────────────────────
  const handleNextRound = () => {
    setMyArg("");
    resetRound(); // server should push next phase
  };

  // 🔥 SCORE LOGIC SAFE
  const p1Winning = (p1.score ?? 0) > (p2.score ?? 0);
  const p2Winning = (p2.score ?? 0) > (p1.score ?? 0);

  return (
    <div className="min-h-screen arena-bg p-4 md:p-6 text-white">

      {/* TOP BAR */}
      <div className="flex justify-between mb-6 max-w-5xl mx-auto">
        <button
          onClick={resetGame}
          className="text-sm text-white/60 hover:text-red-400"
        >
          <RotateCcw size={14} className="inline mr-1" />
          Leave
        </button>

        <div className="text-sm text-white/60">
          ROUND {Math.min(currentRound, maxRounds)} / {maxRounds}
        </div>
      </div>

      {/* TOPIC */}
      <h2 className="text-center text-2xl mb-6">{topic}</h2>

      {/* SCORES */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4 mb-4">
        <ScorePanel
          player="p1"
          name={p1.name || "P1"}
          score={p1.score ?? 0}
          roundScores={lastScores?.p1}
          isWinning={p1Winning}
          isMe={isP1}
        />
        <ScorePanel
          player="p2"
          name={p2.name || "P2"}
          score={p2.score ?? 0}
          roundScores={lastScores?.p2}
          isWinning={p2Winning}
          isMe={!isP1}
        />
      </div>

      {/* CROWD */}
      <CrowdMeter
        crowdValue={crowdMeter}
        p1Name={p1.name}
        p2Name={p2.name}
      />

      {/* MAIN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 max-w-5xl mx-auto">

        {/* MY ARGUMENT */}
        <div className="bg-black/20 p-4 rounded border border-white/10">
          {!iSubmitted ? (
            <>
              <textarea
                className="w-full h-40 bg-black/30 border border-white/20 rounded p-2"
                value={myArg}
                onChange={(e) => setMyArg(e.target.value)}
                disabled={isJudging || isResults}
                placeholder="Write your argument..."
              />

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="mt-3 bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
              >
                <Send size={14} className="inline mr-1" />
                Submit
              </button>
            </>
          ) : (
            <div>
              <p className="text-sm text-white/70">{myArg}</p>
              <span className="text-green-400 text-xs">Submitted</span>
            </div>
          )}
        </div>

        {/* OPPONENT */}
        <div className="bg-black/20 p-4 rounded border border-white/10 flex items-center justify-center">
          {theySubmitted ? (
            <p className="text-green-400">Opponent submitted</p>
          ) : (
            <p className="text-white/40">Waiting for opponent...</p>
          )}
        </div>
      </div>

      {/* STREAM */}
      <div className="max-w-5xl mx-auto mt-6">
        <JudgeStream />
      </div>

      {/* RESULTS */}
      {isResults && lastScores && (
        <div className="max-w-5xl mx-auto mt-6 text-center">
          <p className="mb-3">{lastScores.verdict}</p>

          <button
            onClick={handleNextRound}
            className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600"
          >
            <ChevronRight size={14} className="inline mr-1" />
            Next Round
          </button>
        </div>
      )}

      {/* HISTORY */}
      <div className="max-w-5xl mx-auto mt-6 space-y-2">
        {rounds.map((r, i) => (
          <div
            key={i}
            className="text-sm text-white/50 border-b border-white/10 pb-1"
          >
            Round {r?.round}:{" "}
            {(r?.result?.p1?.total ?? 0)} -{" "}
            {(r?.result?.p2?.total ?? 0)}
          </div>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-400 text-center mt-4">{error}</p>
      )}
    </div>
  );
}