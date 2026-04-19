import { useGameStore } from "../store/gameStore";
import { getSocket } from "./useSocket";

export function useRoom() {
  const {
    roomCode,
    setMyArgSubmitted,
    setError,
  } = useGameStore();

  // ─────────────────────────────
  // SUBMIT ARGUMENT
  // ─────────────────────────────
  const submitArgument = (argument) => {
    const socket = getSocket();

    if (!socket) {
      console.warn("❌ Socket not initialized");
      return;
    }

    if (!roomCode) {
      console.warn("❌ No roomCode");
      return;
    }

    if (!argument || !argument.trim()) {
      setError("Argument cannot be empty");
      return;
    }

    socket.emit("room:submit-arg", { roomCode, argument });
    setMyArgSubmitted(true);
  };

  // ─────────────────────────────
  // REMATCH — REQUEST
  // ─────────────────────────────
  const requestRematch = () => {
    const socket = getSocket();

    if (!socket || !roomCode) {
      console.warn("❌ Cannot request rematch");
      return;
    }

    const store = useGameStore.getState();
    store.setRematchRequested(true);
    socket.emit("room:rematch-request", { roomCode });
  };

  // ─────────────────────────────
  // REMATCH — ACCEPT
  // ─────────────────────────────
  const acceptRematch = () => {
    const socket = getSocket();

    if (!socket || !roomCode) return;

    socket.emit("room:rematch-accept", { roomCode });
  };

  // ─────────────────────────────
  // REMATCH — DECLINE
  // ─────────────────────────────
  const declineRematch = () => {
    const socket = getSocket();

    if (!socket || !roomCode) return;

    socket.emit("room:rematch-decline", { roomCode });

    // My side: close the modal and go home
    const store = useGameStore.getState();
    store.setRematchIncoming(false);
    store.resetGame();
  };

  // ─────────────────────────────
  // JOIN SOCKET ROOM (SAFE)
  // ─────────────────────────────
  const joinSocketRoom = (code) => {
    const socket = getSocket();

    if (!socket) {
      console.warn("❌ Socket not ready");
      return;
    }

    if (!code) {
      console.warn("❌ No room code provided");
      return;
    }

    socket.emit("room:join", { roomCode: code });
  };

  return {
    submitArgument,
    requestRematch,
    acceptRematch,
    declineRematch,
    joinSocketRoom,
  };
}