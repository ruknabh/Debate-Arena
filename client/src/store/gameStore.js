import { create } from "zustand";

export const useGameStore = create((set, get) => ({
  phase: "home",
  roomCode: null,
  myRole: null,
  myName: "",
  room: null,
  gameId: null,
  game: null,
  connectionStatus: "disconnected",
  streamText: "",
  isStreaming: false,
  lastScores: null,
  error: null,
  opponentReady: false,
  myArgSubmitted: false,
  opponentArgSubmitted: false,
  isMatchmaking: false,

  setPhase: (phase) => set({ phase }),

  setRoomCode: (roomCode) => set({ roomCode, gameId: roomCode }),

  setMyRole: (myRole) => set({ myRole }),
  setMyName: (myName) => set({ myName }),

  setRoom: (room) =>
    set({
      room,
      game: room,
      roomCode: room?.code || null,
      gameId: room?.code || null,
    }),

  setGameId: (gameId) => set({ gameId, roomCode: gameId }),
  setGame: (game) => set({ game, room: game }),

  setStreamText: (streamText) => set({ streamText }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setLastScores: (lastScores) => set({ lastScores }),
  setError: (error) => set({ error }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setOpponentReady: (opponentReady) => set({ opponentReady }),
  setMyArgSubmitted: (myArgSubmitted) => set({ myArgSubmitted }),
  setOpponentArgSubmitted: (opponentArgSubmitted) => set({ opponentArgSubmitted }),
  setIsMatchmaking: (isMatchmaking) => set({ isMatchmaking }),

  appendStream: (chunk) =>
    set((state) => ({
      streamText: state.streamText + chunk,
      isStreaming: true,
    })),

  resetStream: () => set({ streamText: "", isStreaming: false }),

  // KEY FIX: resetRound only resets submission state and stream.
  // It does NOT clear lastScores — that stays until the next round starts
  // so the results screen can display scores after judging.
  resetRound: () =>
    set({
      myArgSubmitted: false,
      opponentArgSubmitted: false,
      lastScores: null,   // clear here — called by "Next Round" button click
      streamText: "",
      isStreaming: false,
      error: null,
    }),

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

  getOpponent: () => {
    const { room, myRole } = get();
    if (!room) return null;
    return myRole === "p1" ? room.players?.p2 : room.players?.p1;
  },

  isRoomReady: () => {
    const { room } = get();
    return !!(room?.players?.p1 && room?.players?.p2);
  },
}));