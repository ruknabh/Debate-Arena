import { useEffect, useRef } from "react";

export default function CrowdMeter({ crowdValue = 50, p1Name = "P1", p2Name = "P2" }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.transition = "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)";
      barRef.current.style.width = `${crowdValue}%`;
    }
  }, [crowdValue]);

  const p1Pct = crowdValue;
  const p2Pct = 100 - crowdValue;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-xs text-white/50 uppercase tracking-widest">Crowd</span>
        <span className="font-mono text-xs text-white/30">LIVE SUPPORT</span>
      </div>

      {/* Labels */}
      <div className="flex justify-between mb-1.5">
        <span className="font-display text-lg tracking-widest" style={{ color: "#ff2d55" }}>
          {p1Name} <span className="text-sm">{p1Pct}%</span>
        </span>
        <span className="font-display text-lg tracking-widest" style={{ color: "#00aaff" }}>
          <span className="text-sm">{p2Pct}%</span> {p2Name}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "#1a1a26", border: "1px solid #2a2a3d" }}>
        {/* P1 (red) fills from left */}
        <div
          ref={barRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${crowdValue}%`,
            background: "linear-gradient(90deg, #ff2d55, #ff6b8a)",
            borderRadius: "6px",
          }}
        />
        {/* P2 (blue) fills from right */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: `${100 - crowdValue}%`,
            background: "linear-gradient(270deg, #00aaff, #66ccff)",
            borderRadius: "6px",
          }}
        />
        {/* Center divider */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "#0a0a0f",
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </div>
  );
}