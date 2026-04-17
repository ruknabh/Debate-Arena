export default function ScorePanel({ player = "p1", name, score = 0, roundScores = null, isWinning = false }) {
  const isP1 = player === "p1";
  const accent = isP1 ? "#ff2d55" : "#00aaff";
  const glowClass = isP1 ? "glow-red" : "glow-blue";

  return (
    <div
      className={`arena-card p-6 flex flex-col items-center ${isWinning ? glowClass : ""}`}
      style={isWinning ? { borderColor: accent + "66" } : {}}
    >
      {/* Player tag */}
      <div
        className="font-mono text-xs uppercase tracking-widest mb-1 px-3 py-1 rounded-full"
        style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}
      >
        {isP1 ? "FOR ⚔" : "⚔ AGAINST"}
      </div>

      {/* Name */}
      <h2 className="font-display text-2xl tracking-widest text-white mt-2 mb-3">
        {name}
      </h2>

      {/* Big score */}
      <div className="score-badge" style={{ color: accent }}>
        {score}
      </div>
      <div className="font-mono text-xs text-white/30 uppercase tracking-widest mt-1">
        TOTAL POINTS
      </div>

      {/* Round breakdown */}
      {roundScores && (
        <div className="mt-4 w-full grid grid-cols-3 gap-2 text-center">
          {[
            { key: "logic", label: "Logic" },
            { key: "creativity", label: "Crtvy" },
            { key: "persuasion", label: "Persn" },
          ].map(({ key, label }) => (
            <div key={key} className="rounded-lg p-2" style={{ background: accent + "11", border: `1px solid ${accent}22` }}>
              <div className="font-display text-xl" style={{ color: accent }}>
                {roundScores[key] ?? "—"}
              </div>
              <div className="font-mono text-xs text-white/30 uppercase">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}