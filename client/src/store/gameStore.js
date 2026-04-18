import { create } from "zustand";

export const useGameStore = create((set, get) => ({
  // ─────────────────────────────
  // PHASE CONTROL
  // ─────────────────────────────
  // home | lobby | debate | judging | results | final
  phase: "home",

  // ─────────────────────────────
  // ROOM / PLAYER INFO
  // ─────────────────────────────
  roomCode: null,
  myRole: null, // "p1" | "p2"
  myName: "",
  room: null,

  // Derived (compat)
  gameId: null,
  game: null,

  // ─────────────────────────────
  // CONNECTION / SOCKET STATE
  // ─────────────────────────────
  connectionStatus: "disconnected",

  // ─────────────────────────────
  // STREAM / AI STATE
  // ─────────────────────────────
  streamText: "",
  isStreaming: false,
  lastScores: null,
  error: null,

  // ─────────────────────────────
  // MULTIPLAYER STATE
  // ─────────────────────────────
  opponentReady: false,
  myArgSubmitted: false,
  opponentArgSubmitted: false,
  isMatchmaking: false,

  // ─────────────────────────────
  // SETTERS
  // ─────────────────────────────
  setPhase: (phase) => set({ phase }),

  setRoomCode: (roomCode) =>
    set({
      roomCode,
      gameId: roomCode,
    }),

  setMyRole: (myRole) => set({ myRole }),
  setMyName: (myName) => set({ myName }),

  // 🔥 IMPORTANT: Always sync room + derived fields
  setRoom: (room) =>
    set({
      room,
      game: room,
      roomCode: room?.code || null,
      gameId: room?.code || null,
    }),

  setGameId: (gameId) =>
    set({
      gameId,
      roomCode: gameId,
    }),

  setGame: (game) =>
    set({
      game,
      room: game,
    }),

  setStreamText: (streamText) => set({ streamText }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setLastScores: (lastScores) => set({ lastScores }),
  setError: (error) => set({ error }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setOpponentReady: (opponentReady) => set({ opponentReady }),
  setMyArgSubmitted: (myArgSubmitted) => set({ myArgSubmitted }),
  setOpponentArgSubmitted: (opponentArgSubmitted) =>
    set({ opponentArgSubmitted }),

  setIsMatchmaking: (isMatchmaking) => set({ isMatchmaking }),

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────

  appendStream: (chunk) =>
    set((state) => ({
      streamText: state.streamText + chunk,
      isStreaming: true,
    })),

  resetStream: () =>
    set({
      streamText: "",
      isStreaming: false,
    }),

  // 🔥 ROUND RESET (very important for multiplayer)
  resetRound: () =>
    set({
      myArgSubmitted: false,
      opponentArgSubmitted: false,
      lastScores: null,
      streamText: "",
      isStreaming: false,
      error: null,
    }),

  // 🔥 FULL GAME RESET
  resetGame: () =>
    set({
      phase: "home",
      roomCode: null,
      myRole: null,
      myName: "",
      room: null,
      gameId: null,
      game: null,

      streamText: "",
      isStreaming: false,
      lastScores: null,
      error: null,

      opponentReady: false,
      myArgSubmitted: false,
      opponentArgSubmitted: false,
      isMatchmaking: false,

      connectionStatus: "disconnected",
    }),

  // ─────────────────────────────
  // DERIVED HELPERS (NEW 🔥)
  // ─────────────────────────────

  // Get opponent info safely
  getOpponent: () => {
    const { room, myRole } = get();
    if (!room) return null;

    return myRole === "p1"
      ? room.players?.p2
      : room.players?.p1;
  },

  // Check if both players are present
  isRoomReady: () => {
    const { room } = get();
    return !!(room?.players?.p1 && room?.players?.p2);
  },
}));