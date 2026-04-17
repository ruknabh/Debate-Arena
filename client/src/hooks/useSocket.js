import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../store/gameStore";

let socketInstance = null;

export function useSocket() {
  const socketRef = useRef(null);
  const {
    gameId,
    setConnectionStatus,
    appendStream,
    resetStream,
    setIsStreaming,
    setLastScores,
    setGame,
    setPhase,
    setError,
  } = useGameStore();

  useEffect(() => {
    // Create single socket connection
    if (!socketInstance) {
      socketInstance = io("http://localhost:3001", {
        transports: ["websocket"],
      });
    }
    socketRef.current = socketInstance;

    const socket = socketRef.current;

    socket.on("connect", () => {
      setConnectionStatus("connected");
    });
    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });
    socket.on("connect_error", () => {
      setConnectionStatus("error");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // Subscribe to game-specific events when gameId changes
  useEffect(() => {
    if (!gameId || !socketRef.current) return;
    const socket = socketRef.current;

    const onStream = ({ chunk }) => {
      setIsStreaming(true);
      appendStream(chunk);
    };

    const onScores = ({ scores, game, roundNumber }) => {
      setLastScores({ scores, roundNumber });
      setGame(game);
      setIsStreaming(false);
      if (game.status === "finished") {
        setPhase("final");
      } else {
        setPhase("results");
      }
    };

    const onStatus = ({ status }) => {
      if (status === "judging") {
        resetStream();
        setPhase("judging");
      }
    };

    const onError = ({ message }) => {
      setError(message);
      setIsStreaming(false);
      setPhase("debate");
    };

    socket.on(`game:${gameId}:stream`, onStream);
    socket.on(`game:${gameId}:scores`, onScores);
    socket.on(`game:${gameId}:status`, onStatus);
    socket.on(`game:${gameId}:error`, onError);

    return () => {
      socket.off(`game:${gameId}:stream`, onStream);
      socket.off(`game:${gameId}:scores`, onScores);
      socket.off(`game:${gameId}:status`, onStatus);
      socket.off(`game:${gameId}:error`, onError);
    };
  }, [gameId]);

  return socketRef.current;
}