const { createRoom, joinRoom } = require("./roommanager");

// Queue: [{ socketId, playerName }]
const queue = [];

// ─────────────────────────────────────────────
// ADD TO QUEUE
// ─────────────────────────────────────────────
function addToQueue(socketId, playerName) {
  if (!socketId) return null;

  // Prevent duplicates
  if (queue.find((p) => p.socketId === socketId)) return null;

  queue.push({
    socketId,
    playerName: playerName || "Anonymous",
  });

  return queue.length;
}

// ─────────────────────────────────────────────
// REMOVE FROM QUEUE
// ─────────────────────────────────────────────
function removeFromQueue(socketId) {
  const idx = queue.findIndex((p) => p.socketId === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

// ─────────────────────────────────────────────
// MATCHMAKING ENGINE
// ─────────────────────────────────────────────
function tryMatch(io) {
  // Need at least 2 players
  if (queue.length < 2) return null;

  const p1 = queue.shift();
  const p2 = queue.shift();

  // Safety check
  if (!p1 || !p2) return null;

  // Topic pool
  const TOPICS = [
    "AI will replace human creativity",
    "Social media does more harm than good",
    "Remote work is better than office work",
    "Cryptocurrency is the future of finance",
    "Humans should colonize Mars",
    "Video games are a legitimate sport",
    "Universal Basic Income should be implemented",
    "Nuclear energy is essential for climate goals",
    "Cats are better pets than dogs",
    "The internet has made us less intelligent",
    "Space exploration funding should be increased",
    "Standardized testing should be abolished",
  ];

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  try {
    // Create room
    const room = createRoom(topic, p1.socketId, p1.playerName);

    // Join second player
    const { room: updatedRoom, error } = joinRoom(
      room.code,
      p2.socketId,
      p2.playerName
    );

    if (error || !updatedRoom) {
      // Restore queue if something failed
      queue.unshift(p2);
      queue.unshift(p1);
      return null;
    }

    // Notify both players
    io.to(p1.socketId).emit("match:found", {
      roomCode: room.code,
      role: "p1",
      room: updatedRoom,
    });

    io.to(p2.socketId).emit("match:found", {
      roomCode: room.code,
      role: "p2",
      room: updatedRoom,
    });

    return updatedRoom;
  } catch (err) {
    console.error("❌ Matchmaking error:", err);

    // Restore queue on failure
    queue.unshift(p2);
    queue.unshift(p1);

    return null;
  }
}

// ─────────────────────────────────────────────
// GET QUEUE LENGTH
// ─────────────────────────────────────────────
function getQueueLength() {
  return queue.length;
}

module.exports = {
  addToQueue,
  removeFromQueue,
  tryMatch,
  getQueueLength,
};