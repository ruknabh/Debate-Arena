const { v4: uuidv4 } = require("uuid");

const rooms = new Map();

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─────────────────────────────────────────────
// CREATE ROOM
// ─────────────────────────────────────────────
function createRoom(topic, creatorSocketId, player1Name) {
  let code;
  do {
    code = generateCode();
  } while (rooms.has(code));

  const room = {
    code,
    id: uuidv4(),
    topic,

    players: {
      p1: {
        socketId: creatorSocketId,
        name: player1Name || "Player 1",
        score: 0,
        totalLogic: 0,
        totalCreativity: 0,
        totalPersuasion: 0,
      },
      p2: null,
    },

    // ✅ ROUND-BASED STRUCTURE (FIXED)
    rounds: [
      {
        round: 1,
        p1Arg: null,
        p2Arg: null,
        result: null,
      },
    ],

    currentRound: 1,
    maxRounds: 3,

    status: "waiting", // waiting | ready | debating | judging | finished
    crowdMeter: 50,
    winner: null,
  };

  rooms.set(code, room);
  return room;
}

// ─────────────────────────────────────────────
// JOIN ROOM
// ─────────────────────────────────────────────
function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code?.toUpperCase());

  if (!room) return { error: "Room not found" };
  if (room.players.p2) return { error: "Room is full" };
  if (room.players.p1.socketId === socketId)
    return { error: "Already in this room" };

  room.players.p2 = {
    socketId,
    name: playerName || "Player 2",
    score: 0,
    totalLogic: 0,
    totalCreativity: 0,
    totalPersuasion: 0,
  };

  room.status = "ready";

  return { room };
}

// ─────────────────────────────────────────────
// GET ROOM
// ─────────────────────────────────────────────
function getRoomByCode(code) {
  return rooms.get(code?.toUpperCase()) || null;
}

function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (
      room.players.p1?.socketId === socketId ||
      room.players.p2?.socketId === socketId
    ) {
      return room;
    }
  }
  return null;
}

function getRoleInRoom(room, socketId) {
  if (room.players.p1?.socketId === socketId) return "p1";
  if (room.players.p2?.socketId === socketId) return "p2";
  return null;
}

// ─────────────────────────────────────────────
// SUBMIT ARGUMENT (ROUND SAFE)
// ─────────────────────────────────────────────
function submitArgument(room, role, argument) {
  const currentRound = room.rounds[room.currentRound - 1];

  if (!currentRound) return { error: "Invalid round" };

  if (role === "p1") {
    if (currentRound.p1Arg) return { error: "Already submitted" };
    currentRound.p1Arg = argument;
  } else if (role === "p2") {
    if (currentRound.p2Arg) return { error: "Already submitted" };
    currentRound.p2Arg = argument;
  }

  const bothReady = currentRound.p1Arg && currentRound.p2Arg;

  return { bothReady, round: currentRound };
}

// ─────────────────────────────────────────────
// MOVE TO NEXT ROUND
// ─────────────────────────────────────────────
function clearArguments(room) {
  const nextRound = room.currentRound + 1;

  if (nextRound > room.maxRounds) {
    room.status = "finished";
    return;
  }

  room.currentRound = nextRound;

  room.rounds.push({
    round: nextRound,
    p1Arg: null,
    p2Arg: null,
    result: null,
  });
}

// ─────────────────────────────────────────────
// DELETE ROOM
// ─────────────────────────────────────────────
function deleteRoom(code) {
  rooms.delete(code);
}

// ─────────────────────────────────────────────
// HANDLE DISCONNECT (SAFE VERSION)
// ─────────────────────────────────────────────
function handleDisconnect(socketId) {
  const room = getRoomBySocket(socketId);
  if (!room) return null;

  const role = getRoleInRoom(room, socketId);

  if (room.status === "waiting" || room.status === "ready") {
    if (role === "p1") {
  
      if (room.players.p2) {
        room.players.p2 = null;
        room.status = "waiting";
      } else {
        rooms.delete(room.code);
        return { deleted: true, code: room.code };
      }
    } else if (role === "p2") {
      room.players.p2 = null;
      room.status = "waiting";
    }
  }

  return { room, role, deleted: false };
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomByCode,
  getRoomBySocket,
  getRoleInRoom,
  submitArgument,
  clearArguments,
  deleteRoom,
  handleDisconnect,
  rooms,
};