import { useState } from "react";
import axios from "axios";
import { useGameStore } from "../store/gameStore";
import { Swords, Zap, Trophy } from "lucide-react";

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

export default function SetupScreen() {
  const { setGameId, setGame, setPhase } = useGameStore();
  const [topic, setTopic] = useState("");
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!topic.trim()) {
      setError("Enter a debate topic to begin");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/game/create", {
        topic: topic.trim(),
        player1Name: p1Name.trim() || "Player 1",
        player2Name: p2Name.trim() || "Player 2",
      });
      setGameId(res.data.gameId);
      setGame(res.data.game);
      setPhase("debate");
    } catch (err) {
      setError("Failed to create game. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen arena-bg flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Swords size={32} color="#ff2d55" />
          <h1 className="font-display text-7xl tracking-widest text-white text-glow-gold">
            DEBATE ARENA
          </h1>
          <Swords size={32} color="#00aaff" style={{ transform: "scaleX(-1)" }} />
        </div>
        <p className="text-white/40 font-mono text-sm tracking-widest uppercase">
          AI-Powered Real-Time Battle Judging
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-white/30 text-xs font-mono">
            <Zap size={12} color="#ffd700" />
            <span>Claude Sonnet 4 Judge</span>
          </div>
          <div className="flex items-center gap-2 text-white/30 text-xs font-mono">
            <Trophy size={12} color="#ffd700" />
            <span>3 Rounds · Real-time Scoring</span>
          </div>
        </div>
      </div>

      {/* Setup Card */}
      <div className="arena-card w-full max-w-2xl p-8 glow-purple">
        {/* Topic */}
        <div className="mb-8">
          <label className="block text-white/60 text-sm font-mono uppercase tracking-widest mb-3">
            Debate Topic
          </label>
          <textarea
            className="arena-input text-lg p-4 h-24"
            placeholder="Enter any topic for the debate..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          {/* Suggested topics */}
          <div className="mt-3">
            <p className="text-white/30 text-xs font-mono mb-2">QUICK SELECT →</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.slice(0, 4).map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/40 hover:border-purple-500/50 hover:text-white/70 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Names */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-mono uppercase tracking-widest mb-2" style={{ color: "#ff2d55" }}>
              ⚔ Player 1 (FOR)
            </label>
            <input
              type="text"
              className="arena-input px-4 py-3"
              placeholder="Player 1"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-mono uppercase tracking-widest mb-2" style={{ color: "#00aaff" }}>
              ⚔ Player 2 (AGAINST)
            </label>
            <input
              type="text"
              className="arena-input px-4 py-3"
              placeholder="Player 2"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        <button
          className="btn btn-primary w-full text-lg py-4 font-display tracking-widest"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              INITIALIZING ARENA...
            </span>
          ) : (
            <>
              <Swords size={20} />
              ENTER THE ARENA
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-2xl text-center">
        {[
          { step: "01", title: "Choose Topic", desc: "Pick any debatable subject" },
          { step: "02", title: "Argue 3 Rounds", desc: "Make your best case each round" },
          { step: "03", title: "Claude Judges", desc: "AI scores logic, creativity & persuasion" },
        ].map(({ step, title, desc }) => (
          <div key={step} className="arena-card p-4">
            <div className="font-display text-3xl text-purple-500/60 mb-1">{step}</div>
            <div className="font-mono text-white/70 text-xs uppercase tracking-widest mb-1">{title}</div>
            <div className="text-white/30 text-xs">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}