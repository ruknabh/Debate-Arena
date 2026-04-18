export default function CrowdMeter({
  crowdValue = 50,
  p1Name,
  p2Name,
}) {
  // ─────────────────────────────
  // SAFE VALUE (CLAMP 0–100)
  // ─────────────────────────────
  const safeCrowd = Math.max(0, Math.min(100, crowdValue));

  const p2Pct = safeCrowd;
  const p1Pct = 100 - safeCrowd;

  // FIX rounding consistency
  const p2Rounded = Math.round(p2Pct);
  const p1Rounded = 100 - p2Rounded;

  const safeP1Name = p1Name || "Player 1";
  const safeP2Name = p2Name || "Player 2";

  // Prevent needle overflow
  const needlePos = Math.max(2, Math.min(98, p1Pct));

  return (
    <div>
      {/* LABELS */}
      <div className="flex justify-between items-center mb-2">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: "#ff2d55" }}
        >
          {safeP1Name} {p1Rounded}%
        </span>

        <span className="font-mono text-xs text-white/30 uppercase tracking-widest">
          CROWD
        </span>

        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: "#00aaff" }}
        >
          {p2Rounded}% {safeP2Name}
        </span>
      </div>

      {/* BAR */}
      <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
        {/* P1 */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${p1Pct}%`,
            background: "linear-gradient(90deg, #ff2d55, #ff6b8a)",
          }}
        />

        {/* P2 */}
        <div
          className="absolute inset-y-0 right-0 transition-all duration-700"
          style={{
            width: `${p2Pct}%`,
            background: "linear-gradient(270deg, #00aaff, #66ccff)",
          }}
        />
      </div>

      {/* NEEDLE */}
      <div className="relative h-2">
        <div
          className="absolute top-0 w-0.5 h-2 bg-white/60 transition-all duration-700"
          style={{
            left: `${needlePos}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </div>
  );
}