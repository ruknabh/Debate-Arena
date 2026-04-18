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

    // Optimistic update (UI responsiveness)
    setMyArgSubmitted(true);
  };

  // ─────────────────────────────
  // REMATCH
  // ─────────────────────────────
  const requestRematch = () => {
    const socket = getSocket();

    if (!socket || !roomCode) {
      console.warn("❌ Cannot request rematch");
      return;
    }

    socket.emit("room:rematch", { roomCode });
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
    joinSocketRoom,
  };
}