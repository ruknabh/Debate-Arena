require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const {
  createRoom,
  joinRoom,
  getRoomByCode,
  getRoleInRoom,
  submitArgument,
  clearArguments,
  handleDisconnect,
} = require("./roomManager");

const {
  addToQueue,
  removeFromQueue,
  tryMatch,
  getQueueLength,
} = require("./matchmaking");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

/* =========================
   REST ROUTES
========================= */

app.post("/api/room/create", (req, res) => {
  const { topic, player1Name, socketId } = req.body;
  if (!topic || !socketId)
    return res.status(400).json({ error: "Missing fields" });

  const room = createRoom(topic, socketId, player1Name);
  res.json({ roomCode: room.code, room, role: "p1" });
});

app.post("/api/room/join", (req, res) => {
  const { code, playerName, socketId } = req.body;
  if (!code || !socketId)
    return res.status(400).json({ error: "Missing fields" });

  const { room, error } = joinRoom(code, socketId, playerName);
  if (error) return res.status(400).json({ error });

  res.json({ roomCode: code, room, role: "p2" });
});

app.post("/api/room/queue", (req, res) => {
  const { playerName, socketId } = req.body;
  if (!socketId) return res.status(400).json({ error: "socketId required" });

  addToQueue(socketId, playerName);
  const matched = tryMatch(io);

  res.json(
    matched
      ? { status: "matched", room: matched }
      : { status: "queued", position: getQueueLength() }
  );
});

app.post("/api/room/queue/leave", (req, res) => {
  const { socketId } = req.body;
  if (socketId) removeFromQueue(socketId);
  res.json({ status: "left" });
});

app.get("/api/room/:code", (req, res) => {
  const room = getRoomByCode(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

/* =========================
   JUDGE ROUND
========================= */

async function judgeRound(room) {
  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound || !currentRound.p1Arg || !currentRound.p2Arg) return;

  const { p1Arg, p2Arg } = currentRound;

  room.status = "judging";
  io.to(room.code).emit("game:status", { status: "judging", room });

  const prompt = `Evaluate debate strictly and return JSON only...`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    const text = response.data.choices?.[0]?.message?.content || "";

    let scores;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      scores = JSON.parse(clean.match(/\{[\s\S]*\}/)[0]);
    } catch {
      io.to(room.code).emit("game:error", {
        message: "AI parse failed",
      });
      room.status = "debating";
      return;
    }

    const calc = (p) =>
      (p.logic || 0) +
      (p.evidence || 0) +
      (p.rebuttal || 0) +
      (p.clarity || 0) +
      (p.persuasion || 0) +
      (p.creativity || 0);

    scores.p1.total ??= calc(scores.p1);
    scores.p2.total ??= calc(scores.p2);

    room.players.p1.score += scores.p1.total;
    room.players.p2.score += scores.p2.total;

    currentRound.result = scores;

    clearArguments(room);

    if (room.status === "finished") {
      room.winner =
        room.players.p1.score > room.players.p2.score
          ? "p1"
          : room.players.p2.score > room.players.p1.score
          ? "p2"
          : "draw";
    } else {
      room.status = "debating";
    }

    io.to(room.code).emit("game:scores", { scores, room });
  } catch (err) {
    console.error(err.message);
    room.status = "debating";
  }
}

/* =========================
   SOCKETS (FIXED)
========================= */

io.on("connection", (socket) => {
  console.log("🔌", socket.id);

  socket.on("room:join", ({ roomCode }) => {
    const room = getRoomByCode(roomCode);
    if (!room) return;

    socket.join(roomCode);

    const role = getRoleInRoom(room, socket.id);

    // ✅ Send full state to joining player
    socket.emit("room:joined", { room, role });

    // ✅ FIX: Send room to opponent
    socket.to(roomCode).emit("room:opponent-joined", { room });
  });

  socket.on("room:submit-arg", ({ roomCode, argument }) => {
    const room = getRoomByCode(roomCode);
    if (!room || room.status === "judging") return;

    const role = getRoleInRoom(room, socket.id);
    if (!role) return;

    const result = submitArgument(room, role, argument);
    if (result.error) return;

    io.to(roomCode).emit("game:arg-submitted", {
      role,
      bothReady: result.bothReady,
      room, // ✅ keep UI synced
    });

    if (result.bothReady && room.status !== "judging") {
      judgeRound(room);
    }
  });

  socket.on("disconnect", () => {
    const res = handleDisconnect(socket.id);
    if (!res) return;

    if (!res.deleted) {
      // ✅ FIX: send updated room state
      io.to(res.room.code).emit("room:opponent-left", {
        room: res.room,
      });
    }

    removeFromQueue(socket.id);
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});