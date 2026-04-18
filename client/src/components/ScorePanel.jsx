export default function ScorePanel({
  player,
  name,
  score,
  roundScores,
  isWinning,
  isMe,
}) {
  const isP1 = player === "p1";
  const color = isP1 ? "#ff2d55" : "#00aaff";
  const glowClass = isP1 ? "glow-red" : "glow-blue";

  // ─────────────────────────────
  // SAFE VALUES
  // ─────────────────────────────
  const safeName = name || "Player";
  const safeScore = score ?? 0;

  // Normalize roundScores (handles both shapes)
  const scores = roundScores || {};

  const stats = [
    { label: "Logic", val: scores.logic },
    { label: "Evid.", val: scores.evidence },
    { label: "Rebut.", val: scores.rebuttal },
    { label: "Clarity", val: scores.clarity },
    { label: "Persua.", val: scores.persuasion },
    { label: "Creat.", val: scores.creativity },
  ];

  // Find max stat for highlight
  const maxVal = Math.max(...stats.map((s) => s.val ?? 0));

  const hasAnyScore = stats.some((s) => s.val !== undefined);

  return (
    <div
      className={`arena-card p-4 transition-all ${
        isWinning ? glowClass : ""
      }`}
      style={isWinning ? { borderColor: `${color}66` } : {}}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span
            className="font-display text-lg tracking-widest"
            style={{ color }}
          >
            {safeName}
          </span>

          {isMe && (
            <span className="ml-2 font-mono text-xs text-purple-400">
              (you)
            </span>
          )}
        </div>

        {isWinning && (
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color }}
          >
            LEADING
          </span>
        )}
      </div>

      {/* TOTAL SCORE */}
      <div className="score-badge" style={{ color }}>
        {safeScore}
      </div>

      {/* ROUND STATS */}
      {hasAnyScore && (
        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          {stats.map(({ label, val }) => {
            const safeVal = val ?? 0;
            const isTop = safeVal === maxVal && safeVal > 0;

            return (
              <div
                key={label}
                className={`rounded p-1 ${
                  isTop ? "bg-yellow-500/10" : "bg-white/5"
                }`}
              >
                <div
                  className="font-mono text-xs"
                  style={{
                    color: isTop ? "#ffd700" : color,
                  }}
                >
                  {safeVal}
                </div>

                <div
                  className="font-mono text-white/20"
                  style={{ fontSize: "0.6rem" }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}