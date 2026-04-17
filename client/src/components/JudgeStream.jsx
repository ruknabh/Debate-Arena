import { useGameStore } from "../store/gameStore";

export default function JudgeStream() {
  const { streamText, isStreaming } = useGameStore();

  if (!streamText && !isStreaming) return null;

  // Try to extract verdict from partial JSON
  let verdict = "";
  const verdictMatch = streamText.match(/"verdict"\s*:\s*"([^"]+)/);
  if (verdictMatch) verdict = verdictMatch[1];

  return (
    <div className="arena-card p-6 mt-4 border-purple-500/30" style={{ borderColor: "rgba(124,58,237,0.3)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="font-mono text-xs text-purple-400 uppercase tracking-widest">
          Claude is judging...
        </span>
        {isStreaming && (
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-400"
                style={{ animation: `bounce 1s infinite ${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {verdict ? (
        <p className={`text-white/80 text-sm leading-relaxed ${isStreaming ? "typing-cursor" : ""}`}>
          "{verdict}{isStreaming && !streamText.includes('"verdict"') ? "" : ""}"
        </p>
      ) : (
        <div className="space-y-2">
          <div className="h-3 rounded shimmer w-full" />
          <div className="h-3 rounded shimmer w-4/5" />
          <div className="h-3 rounded shimmer w-2/3" />
        </div>
      )}
    </div>
  );
}