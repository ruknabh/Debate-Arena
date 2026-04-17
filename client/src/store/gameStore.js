import { create } from "zustand";

export const useGameStore = create((set, get) => ({
  // State
  phase: "setup", // setup | debate | judging | results | final
  gameId: null,
  game: null,
  streamText: "",
  isStreaming: false,
  lastScores: null,
  error: null,
  connectionStatus: "disconnected",

  // Actions
  setPhase: (phase) => set({ phase }),
  setGameId: (gameId) => set({ gameId }),
  setGame: (game) => set({ game }),
  setStreamText: (streamText) => set({ streamText }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setLastScores: (lastScores) => set({ lastScores }),
  setError: (error) => set({ error }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  appendStream: (chunk) =>
    set((state) => ({ streamText: state.streamText + chunk })),

  resetStream: () => set({ streamText: "", isStreaming: false }),

  resetGame: () =>
    set({
      phase: "setup",
      gameId: null,
      game: null,
      streamText: "",
      isStreaming: false,
      lastScores: null,
      error: null,
    }),
}));