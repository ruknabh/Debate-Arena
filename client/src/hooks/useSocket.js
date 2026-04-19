import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../store/gameStore";

let socketInstance = null;

export function useSocket() {
  const socketRef = useRef(null);

  const {
    roomCode,
    setConnectionStatus,
    appendStream,
    resetStream,
    setIsStreaming,
    setRoom,
    setGame,
    setPhase,
    setError,
    setOpponentReady,
    setOpponentArgSubmitted,
  } = useGameStore();

  // INIT SOCKET (ONLY ONCE)
  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io("http://localhost:3001", {
        transports: ["websocket"],
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onError = () => setConnectionStatus("error");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    socket.on("match:found", ({ roomCode, role, room }) => {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode);
      store.setMyRole(role);
      store.setRoom(room);
      store.setIsMatchmaking(false);
      socket.emit("room:join", { roomCode });
      store.setPhase("lobby");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("match:found");
    };
  }, []);

  // ROOM-SCOPED EVENTS
  useEffect(() => {
    if (!roomCode || !socketRef.current) return;

    const socket = socketRef.current;

    const onJoined = ({ room }) => {
      if (room) {
        setRoom(room);
        setGame(room);
      }
      if (room?.players?.p1 && room?.players?.p2) {
        setOpponentReady(true);
      }
    };

    const onOpponentJoined = ({ room }) => {
      if (room) {
        setRoom(room);
        setGame(room);
      }
      setOpponentReady(true);
    };

    const onStream = ({ chunk }) => {
      appendStream(chunk);
      setIsStreaming(true);
    };

    // KEY FIX: Do NOT call resetRound() here.
    // resetRound() clears lastScores which the results screen needs to display.
    // Instead only update room + lastScores + phase.
    // The user will trigger resetRound() themselves when clicking "Next Round".
    const onScores = ({ scores, room }) => {
      const store = useGameStore.getState();

      // Update room state (has new scores, currentRound already advanced by server)
      store.setRoom(room);
      store.setGame(room);
      store.setIsStreaming(false);

      // Store scores for display — DO NOT clear them here
      store.setLastScores(scores);

      // Transition to results or final
      if (room.status === "finished") {
        store.setPhase("final");
      } else {
        store.setPhase("results");
      }
    };

    const onStatus = ({ status }) => {
      const store = useGameStore.getState();
      if (status === "judging") {
        store.resetStream();
        store.setPhase("judging");
      }
      if (status === "debating") {
        store.setPhase("debate");
      }
    };

    const onArgSubmitted = ({ role }) => {
      const store = useGameStore.getState();
      if (role === store.myRole) {
        store.setMyArgSubmitted(true);
      } else {
        store.setOpponentArgSubmitted(true);
      }
    };

    const onError = ({ message }) => {
      setError(message);
      setIsStreaming(false);
      setPhase("debate");
    };

    const onOpponentLeft = ({ room }) => {
      setError("Opponent disconnected. You win by default!");
      if (room) {
        setRoom(room);
        setGame(room);
      }
      setPhase("final");
    };

    const onRematchStart = ({ room }) => {
      const store = useGameStore.getState();
      store.setRoom(room);
      store.setGame(room);
      store.resetRound();
      store.setPhase("debate");
    };

    socket.on("room:joined", onJoined);
    socket.on("room:opponent-joined", onOpponentJoined);
    socket.on("game:stream", onStream);
    socket.on("game:scores", onScores);
    socket.on("game:status", onStatus);
    socket.on("game:arg-submitted", onArgSubmitted);
    socket.on("game:error", onError);
    socket.on("room:opponent-left", onOpponentLeft);
    socket.on("room:rematch-start", onRematchStart);

    return () => {
      socket.off("room:joined", onJoined);
      socket.off("room:opponent-joined", onOpponentJoined);
      socket.off("game:stream", onStream);
      socket.off("game:scores", onScores);
      socket.off("game:status", onStatus);
      socket.off("game:arg-submitted", onArgSubmitted);
      socket.off("game:error", onError);
      socket.off("room:opponent-left", onOpponentLeft);
      socket.off("room:rematch-start", onRematchStart);
    };
  }, [roomCode]);

  return socketRef.current;
}

export function getSocket() {
  return socketInstance;
}