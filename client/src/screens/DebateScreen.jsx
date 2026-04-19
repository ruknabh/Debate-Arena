import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { useRoom } from "../hooks/useRoom";
import CrowdMeter from "../components/CrowdMeter";
import { Send, RotateCcw, CheckCircle, Clock, Zap, Trophy, Swords } from "lucide-react";

function JudgingOverlay() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute rounded-full border border-purple-500/20"
            style={{ width: `${80 + i * 50}px`, height: `${80 + i * 50}px`, animation: `ping 2s ease-out ${i * 0.6}s infinite` }} />
        ))}
        <div className="relative w-16 h-16 rounded-full bg-purple-900/80 border border-purple-500/60 flex items-center justify-center">
          <Zap size={28} className="text-purple-300 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function RoundResultCard({ round, myRole }) {
  const result = round?.result;
  if (!result) return null;
  const isP1 = myRole === "p1";
  const myScores = isP1 ? result.p1 : result.p2;
  const oppScores = isP1 ? result.p2 : result.p1;
  const myColor = "#00aaff";
  const oppColor = "#ff2d55";
  const iWon = result.roundWinner === myRole;
  const isDraw = result.roundWinner === "draw";
  const stats = ["logic","evidence","rebuttal","clarity","persuasion","creativity"];

  return (
    <div className="arena-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Round {round.round}</span>
        <span className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            color: isDraw ? "#ffd700" : iWon ? "#4ade80" : "#f87171",
            background: isDraw ? "rgba(255,215,0,0.1)" : iWon ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${isDraw ? "#ffd70033" : iWon ? "#4ade8033" : "#f8717133"}`,
          }}>
          {isDraw ? "DRAW" : iWon ? "YOU WON" : "YOU LOST"}
        </span>
      </div>
      {result.verdict && (
        <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 mb-3">
          <p className="text-xs text-purple-300 font-mono uppercase tracking-widest mb-1">Judge's Verdict</p>
          <p className="text-white/70 text-sm italic leading-relaxed">"{result.verdict}"</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "You", scores: myScores, color: myColor },
          { label: "Opponent", scores: oppScores, color: oppColor },
        ].map(({ label, scores, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color }}>{label}</p>
              <p className="text-sm font-bold font-mono" style={{ color }}>{scores?.total ?? 0} pts</p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {stats.map((s) => (
                <div key={s} className="bg-white/5 rounded p-1 text-center">
                  <div className="text-xs font-mono font-bold" style={{ color }}>{scores?.[s] ?? 0}</div>
                  <div className="font-mono text-white/20 uppercase" style={{ fontSize: "0.5rem" }}>{s.slice(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Auto-advance countdown shown during results phase
function NextRoundCountdown({ nextRoundNum, onAdvance }) {
  const [sec, setSec] = useState(5);

  useEffect(() => {
    if (sec <= 0) {
      onAdvance();
      return;
    }
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  return (
    <div className="flex items-center justify-center gap-3 py-3 rounded-lg"
      style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-purple-500/60 flex items-center justify-center font-display text-lg text-purple-300">
        {sec}
      </div>
      <span className="font-mono text-sm text-white/50 uppercase tracking-widest">
        Round {nextRoundNum} starting...
      </span>
    </div>
  );
}

export default function DebateScreen() {
  const {
    room, myRole, phase, lastScores, error,
    resetGame, myArgSubmitted, opponentArgSubmitted,
    resetRound, setPhase,
  } = useGameStore();

  const { submitArgument } = useRoom();
  const [myArg, setMyArg] = useState("");
  const textareaRef = useRef(null);

  if (!room) return null;

  const { players = {}, topic = "No topic", currentRound = 1, maxRounds = 3, crowdMeter = 50, rounds = [] } = room;
  const p1 = players?.p1 || {};
  const p2 = players?.p2 || {};
  const isP1 = myRole === "p1";
  const myColor = "#00aaff";
  const oppColor = "#ff2d55";
  const myPlayer = isP1 ? p1 : p2;
  const oppPlayer = isP1 ? p2 : p1;
  const myTotalScore = isP1 ? (p1.score ?? 0) : (p2.score ?? 0);
  const oppTotalScore = isP1 ? (p2.score ?? 0) : (p1.score ?? 0);

  const isJudging = phase === "judging";
  const isResults = phase === "results";
  const isDebating = phase === "debate";

  const completedRounds = rounds.filter((r) => r?.result);

  // The round that just finished — this is what the results card shows
  // currentRound on the server has already been incremented by clearArguments()
  // so the last completed round is currentRound - 1 (capped at maxRounds)
  const justFinishedRound = Math.min(currentRound - 1, maxRounds);
  // The next round to play
  const nextRound = Math.min(currentRound, maxRounds);
  // For the top bar status pill during debate/judging
  const activeRound = isResults ? nextRound : Math.min(currentRound, maxRounds);

  const canSubmit = myArg.trim().length > 10 && isDebating && !myArgSubmitted;

  useEffect(() => {
    if (isDebating && !myArgSubmitted) {
      setMyArg("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [currentRound, isDebating]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitArgument(myArg.trim());
  };

  const handleAdvanceRound = () => {
    resetRound();
    setPhase("debate");
  };

  return (
    <div className="min-h-screen arena-bg text-white">
      {isJudging && <JudgingOverlay />}
      <div className="max-w-5xl mx-auto p-4 md:p-6">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={resetGame} className="flex items-center gap-1 text-xs text-white/30 hover:text-red-400 transition-colors">
            <RotateCcw size={12} /> Leave
          </button>

          {/* Round pips */}
          <div className="flex items-center gap-3">
            {Array.from({ length: maxRounds }).map((_, i) => {
              const rNum = i + 1;
              const done = completedRounds.find((r) => r.round === rNum);
              const active = rNum === activeRound && !done;
              const won = done?.result?.roundWinner === myRole;
              const lost = done && done.result?.roundWinner !== myRole && done.result?.roundWinner !== "draw";
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all"
                    style={{
                      background: active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                      borderColor: active ? "#7c3aed" : done ? (won ? "#4ade80" : lost ? "#f87171" : "#ffd700") : "rgba(255,255,255,0.1)",
                      color: active ? "#c4b5fd" : done ? (won ? "#4ade80" : lost ? "#f87171" : "#ffd700") : "rgba(255,255,255,0.2)",
                    }}>
                    {done ? (won ? "W" : lost ? "L" : "D") : rNum}
                  </div>
                  <span className="text-white/20 text-xs font-mono">R{rNum}</span>
                </div>
              );
            })}
          </div>

          <div className="text-xs font-mono px-3 py-1 rounded-full border"
            style={{
              color: isJudging ? "#a78bfa" : isResults ? "#ffd700" : "#4ade80",
              borderColor: isJudging ? "#7c3aed55" : isResults ? "#ffd70055" : "#4ade8055",
              background: isJudging ? "rgba(124,58,237,0.1)" : isResults ? "rgba(255,215,0,0.08)" : "rgba(74,222,128,0.08)",
            }}>
            {isJudging ? "JUDGING" : isResults ? `ROUND ${justFinishedRound} RESULTS` : `ROUND ${activeRound}`}
          </div>
        </div>

        {/* TOPIC */}
        <div className="text-center mb-5">
          <p className="text-white/20 text-xs font-mono uppercase tracking-widest mb-1">Debate Topic</p>
          <h2 className="text-lg md:text-2xl font-semibold text-white/90 max-w-3xl mx-auto leading-snug">{topic}</h2>
        </div>

        {/* SCORE CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="arena-card p-4 transition-all"
            style={{ borderColor: myTotalScore > oppTotalScore ? myColor + "55" : "var(--border)", boxShadow: myTotalScore > oppTotalScore ? "0 0 20px " + myColor + "15" : "none" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: myColor }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: myColor }}>{myPlayer.name || "You"}</span>
              <span className="text-xs text-white/20">(you)</span>
            </div>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded mb-2 inline-block"
              style={{ color: isP1 ? "#4ade80" : "#fb923c", background: isP1 ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)", border: "1px solid " + (isP1 ? "#4ade8033" : "#fb923c33") }}>
              {isP1 ? "FOR" : "AGAINST"}
            </span>
            <div className="font-display text-4xl leading-none mt-1" style={{ color: myColor }}>{myTotalScore}</div>
            {lastScores && (
              <div className="text-xs font-mono mt-1" style={{ color: myColor + "88" }}>
                +{(isP1 ? lastScores.p1?.total : lastScores.p2?.total) ?? 0} this round
              </div>
            )}
          </div>

          <div className="arena-card p-4 transition-all"
            style={{ borderColor: oppTotalScore > myTotalScore ? oppColor + "55" : "var(--border)", boxShadow: oppTotalScore > myTotalScore ? "0 0 20px " + oppColor + "15" : "none" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: oppColor }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: oppColor }}>{oppPlayer.name || "Opponent"}</span>
            </div>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded mb-2 inline-block"
              style={{ color: isP1 ? "#fb923c" : "#4ade80", background: isP1 ? "rgba(251,146,60,0.1)" : "rgba(74,222,128,0.1)", border: "1px solid " + (isP1 ? "#fb923c33" : "#4ade8033") }}>
              {isP1 ? "AGAINST" : "FOR"}
            </span>
            <div className="font-display text-4xl leading-none mt-1" style={{ color: oppColor }}>{oppTotalScore}</div>
            {lastScores && (
              <div className="text-xs font-mono mt-1" style={{ color: oppColor + "88" }}>
                +{(isP1 ? lastScores.p2?.total : lastScores.p1?.total) ?? 0} this round
              </div>
            )}
          </div>
        </div>

        {/* CROWD METER */}
        <div className="mb-5">
          <CrowdMeter crowdValue={crowdMeter} p1Name={p1.name} p2Name={p2.name} />
        </div>

        {/* JUDGING */}
        {isJudging && (
          <div className="arena-card p-6 mb-5 text-center" style={{ borderColor: "#7c3aed55" }}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-mono text-purple-300 text-sm uppercase tracking-widest">AI Judge deliberating...</span>
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            </div>
            <p className="text-white/30 text-xs mb-4">Both arguments received. Verdict incoming...</p>
            <div className="flex justify-center gap-1.5">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="w-1 rounded-full bg-purple-400/60"
                  style={{ height: "16px", animation: "pulse 0.8s ease-in-out " + (i * 0.12) + "s infinite alternate" }} />
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {isResults && lastScores && (
          <div className="arena-card p-5 mb-5" style={{ borderColor: "#ffd70033" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-yellow-400" />
              <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest">
                Round {justFinishedRound} — Judge Decision
              </span>
            </div>

            {/* Winner banner */}
            <div className="text-center py-3 mb-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              {lastScores.roundWinner === "draw"
                ? <p className="font-display text-2xl text-yellow-400 tracking-widest">DRAW</p>
                : lastScores.roundWinner === myRole
                ? <p className="font-display text-2xl text-green-400 tracking-widest">YOU WIN THIS ROUND!</p>
                : <p className="font-display text-2xl text-red-400 tracking-widest">OPPONENT WINS ROUND</p>
              }
            </div>

            {/* Verdict */}
            {lastScores.verdict && (
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-purple-300 font-mono uppercase tracking-widest mb-1">Verdict</p>
                <p className="text-white/70 text-sm italic leading-relaxed">"{lastScores.verdict}"</p>
              </div>
            )}

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "You", scores: isP1 ? lastScores.p1 : lastScores.p2, color: myColor },
                { label: oppPlayer.name || "Opponent", scores: isP1 ? lastScores.p2 : lastScores.p1, color: oppColor },
              ].map(({ label, scores, color }) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-mono uppercase tracking-widest" style={{ color }}>{label}</p>
                    <p className="text-lg font-display" style={{ color }}>{scores?.total ?? 0} pts</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {["logic","evidence","rebuttal","clarity","persuasion","creativity"].map((k) => (
                      <div key={k} className="bg-white/5 rounded p-1.5 text-center">
                        <div className="text-sm font-mono font-bold" style={{ color }}>{scores?.[k] ?? 0}</div>
                        <div className="font-mono text-white/20 uppercase mt-0.5" style={{ fontSize: "0.5rem" }}>{k.slice(0, 4)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-advance or game over */}
            {room.status !== "finished" ? (
              <NextRoundCountdown
                nextRoundNum={nextRound}
                onAdvance={handleAdvanceRound}
              />
            ) : (
              <p className="text-center text-white/30 text-xs font-mono py-2">
                Game complete — loading final results...
              </p>
            )}
          </div>
        )}

        {/* ARGUMENT INPUT */}
        {isDebating && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
            <div className="arena-card p-4 transition-all" style={{ borderColor: myArgSubmitted ? myColor + "44" : "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: myColor }} />
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: myColor }}>Your Argument</span>
                </div>
                {myArgSubmitted && (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-mono">
                    <CheckCircle size={11} /> Locked in
                  </div>
                )}
              </div>
              {!myArgSubmitted ? (
                <>
                  <textarea ref={textareaRef}
                    className="arena-input p-3 text-sm leading-relaxed"
                    style={{ height: "130px", resize: "none" }}
                    value={myArg}
                    onChange={(e) => setMyArg(e.target.value)}
                    placeholder={"Round " + activeRound + ": Make your case..."}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/20 font-mono">{myArg.trim().length} chars</span>
                    <button onClick={handleSubmit} disabled={!canSubmit}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold font-mono uppercase tracking-wide transition-all"
                      style={{
                        background: canSubmit ? "linear-gradient(135deg, " + myColor + "cc, #0066cccc)" : "rgba(255,255,255,0.05)",
                        color: canSubmit ? "white" : "rgba(255,255,255,0.2)",
                        cursor: canSubmit ? "pointer" : "not-allowed",
                      }}>
                      <Send size={11} /> Submit
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg p-3 text-sm text-white/60 leading-relaxed overflow-y-auto"
                  style={{ height: "130px", background: "rgba(0,170,255,0.05)", border: "1px solid rgba(0,170,255,0.15)" }}>
                  {myArg}
                </div>
              )}
            </div>

            <div className="arena-card p-4 transition-all" style={{ borderColor: opponentArgSubmitted ? oppColor + "44" : "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: oppColor }} />
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: oppColor }}>{oppPlayer.name || "Opponent"}</span>
                </div>
                {opponentArgSubmitted && (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-mono">
                    <CheckCircle size={11} /> Locked in
                  </div>
                )}
              </div>
              <div className="rounded-lg flex flex-col items-center justify-center gap-2"
                style={{ height: "130px", background: opponentArgSubmitted ? "rgba(255,45,85,0.05)" : "rgba(255,255,255,0.02)", border: "1px solid " + (opponentArgSubmitted ? "rgba(255,45,85,0.2)" : "rgba(255,255,255,0.05)") }}>
                {opponentArgSubmitted ? (
                  <>
                    <CheckCircle size={26} style={{ color: oppColor }} />
                    <p className="text-sm font-semibold" style={{ color: oppColor }}>Argument submitted</p>
                    {!myArgSubmitted && <p className="text-xs text-white/30 font-mono">Waiting for you...</p>}
                  </>
                ) : myArgSubmitted ? (
                  <>
                    <Clock size={26} className="text-white/20 animate-pulse" />
                    <p className="text-sm text-white/30">Opponent is writing...</p>
                  </>
                ) : (
                  <>
                    <Swords size={26} className="text-white/10" />
                    <p className="text-sm text-white/20 font-mono">Waiting...</p>
                  </>
                )}
              </div>
              <div className="mt-3 flex gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: myArgSubmitted ? "100%" : "0%", background: myColor }} />
                </div>
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: opponentArgSubmitted ? "100%" : "0%", background: oppColor }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROUND HISTORY */}
        {completedRounds.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-mono text-white/20 uppercase tracking-widest mb-3">
              Round History ({completedRounds.length}/{maxRounds})
            </p>
            <div className="space-y-3">
              {completedRounds.map((r) => (
                <RoundResultCard key={r.round} round={r} myRole={myRole} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="arena-card p-3 mb-4" style={{ borderColor: "#f8717133" }}>
            <p className="text-red-400 text-sm text-center font-mono">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}