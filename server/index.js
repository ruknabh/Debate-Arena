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
} = require("./roommanager");

const {
  addToQueue,
  removeFromQueue,
  tryMatch,
  getQueueLength,
} = require("./matchmaking");

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// CORS — allow local dev + production frontend
// ─────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.FRONTEND_URL,          // e.g. https://debate-arena.vercel.app
].filter(Boolean);                   // removes undefined if not set

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ─────────────────────────────────────────────
// HEALTH CHECK — Render uses this to confirm
// the service is alive
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

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

  const prompt = `You are a strict, impartial debate judge. You must carefully read BOTH arguments below and score them honestly based on their actual content.

TOPIC: "${room.topic}"

PLAYER 1 ARGUMENT:
"${p1Arg}"

PLAYER 2 ARGUMENT:
"${p2Arg}"

Score each player 1-10 on each of these 6 criteria based ONLY on what they actually wrote above:
- logic: how rational and well-reasoned is the argument
- evidence: does it cite facts, examples, or data
- rebuttal: does it address the opposing side
- clarity: is it clear and well-structured
- persuasion: how convincing is it overall
- creativity: originality and freshness of the argument

IMPORTANT RULES:
- Scores MUST reflect the actual quality of each argument
- If one argument is weak, its scores should be low (1-4)
- If one argument is strong, its scores should be high (7-10)
- Do NOT give the same scores to both players unless they are truly equal
- The roundWinner must be whoever scored higher total points
- If totals are equal it must be "draw"

Respond with ONLY valid JSON, no markdown fences, no explanation text:
{"p1":{"logic":X,"evidence":X,"rebuttal":X,"clarity":X,"persuasion":X,"creativity":X,"total":X},"p2":{"logic":X,"evidence":X,"rebuttal":X,"clarity":X,"persuasion":X,"creativity":X,"total":X},"roundWinner":"p1or p2 or draw","verdict":"One sentence explaining who won and why based on the actual arguments."}`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a debate judge. You MUST score arguments based on their actual content. Never return placeholder or example values. Always read both arguments carefully before scoring.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices?.[0]?.message?.content || "";
    console.log("🤖 AI raw response:", text);

    let scores;
    try {
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in response");
      scores = JSON.parse(match[0]);
    } catch (parseErr) {
      console.error("❌ JSON parse failed:", parseErr.message);
      io.to(room.code).emit("game:error", { message: "Judge failed to parse response. Try again." });
      room.status = "debating";
      io.to(room.code).emit("game:status", { status: "debating", room });
      return;
    }

    if (!scores.p1 || !scores.p2) {
      console.error("❌ Invalid scores structure:", scores);
      io.to(room.code).emit("game:error", { message: "Invalid judge response structure." });
      room.status = "debating";
      io.to(room.code).emit("game:status", { status: "debating", room });
      return;
    }

    const calc = (p) =>
      (p.logic || 0) + (p.evidence || 0) + (p.rebuttal || 0) +
      (p.clarity || 0) + (p.persuasion || 0) + (p.creativity || 0);

    scores.p1.total = calc(scores.p1);
    scores.p2.total = calc(scores.p2);

    if (scores.p1.total > scores.p2.total) {
      scores.roundWinner = "p1";
    } else if (scores.p2.total > scores.p1.total) {
      scores.roundWinner = "p2";
    } else {
      scores.roundWinner = "draw";
    }

    console.log(`📊 Calculated scores: p1=${scores.p1.total} p2=${scores.p2.total} winner=${scores.roundWinner}`);

    room.players.p1.score += scores.p1.total;
    room.players.p2.score += scores.p2.total;

    room.players.p1.totalLogic = (room.players.p1.totalLogic || 0) + (scores.p1.logic || 0);
    room.players.p1.totalCreativity = (room.players.p1.totalCreativity || 0) + (scores.p1.creativity || 0);
    room.players.p1.totalPersuasion = (room.players.p1.totalPersuasion || 0) + (scores.p1.persuasion || 0);
    room.players.p2.totalLogic = (room.players.p2.totalLogic || 0) + (scores.p2.logic || 0);
    room.players.p2.totalCreativity = (room.players.p2.totalCreativity || 0) + (scores.p2.creativity || 0);
    room.players.p2.totalPersuasion = (room.players.p2.totalPersuasion || 0) + (scores.p2.persuasion || 0);

    if (scores.roundWinner === "p1") {
      room.crowdMeter = Math.max(0, room.crowdMeter - 15);
    } else if (scores.roundWinner === "p2") {
      room.crowdMeter = Math.min(100, room.crowdMeter + 15);
    }

    currentRound.result = scores;
    clearArguments(room);

    if (room.status === "finished") {
      room.winner =
        room.players.p1.score > room.players.p2.score ? "p1"
        : room.players.p2.score > room.players.p1.score ? "p2"
        : "draw";
      console.log(`🏆 Game finished! Winner: ${room.winner}`);
    } else {
      room.status = "debating";
    }

    io.to(room.code).emit("game:scores", { scores, room });

  } catch (err) {
    console.error("❌ judgeRound error:", err.message);
    io.to(room.code).emit("game:error", { message: "Judging failed. Please try again." });
    room.status = "debating";
    io.to(room.code).emit("game:status", { status: "debating", room });
  }
}

/* =========================
   SOCKETS
========================= */

io.on("connection", (socket) => {
  console.log("🔌", socket.id);

  socket.on("room:join", ({ roomCode }) => {
    if (!roomCode) return;
    const room = getRoomByCode(roomCode);
    if (!room) return;
    socket.join(roomCode);
    const role = getRoleInRoom(room, socket.id);
    socket.emit("room:joined", { room, role });
    socket.to(roomCode).emit("room:opponent-joined", { room });
  });

  socket.on("room:submit-arg", ({ roomCode, argument }) => {
    const room = getRoomByCode(roomCode);
    if (!room || room.status === "judging") return;
    const role = getRoleInRoom(room, socket.id);
    if (!role) return;
    const result = submitArgument(room, role, argument);
    if (result.error) return;
    io.to(roomCode).emit("game:arg-submitted", { role, bothReady: result.bothReady, room });
    if (result.bothReady && room.status !== "judging") {
      judgeRound(room);
    }
  });

  // ── REMATCH FLOW ─────────────────────────────────────────────────

  socket.on("room:rematch-request", ({ roomCode }) => {
    if (!roomCode) return;
    const room = getRoomByCode(roomCode);
    if (!room) return;
    socket.to(roomCode).emit("room:rematch-request");
    console.log(`🔄 Rematch requested in room ${roomCode}`);
  });

  socket.on("room:rematch-accept", ({ roomCode }) => {
    if (!roomCode) return;
    const room = getRoomByCode(roomCode);
    if (!room) return;

    room.rounds = [{ round: 1 }];
    room.currentRound = 1;
    room.status = "debating";
    room.winner = null;
    room.crowdMeter = 50;
    room.players.p1.score = 0;
    room.players.p2.score = 0;
    room.players.p1.totalLogic = 0;
    room.players.p1.totalCreativity = 0;
    room.players.p1.totalPersuasion = 0;
    room.players.p2.totalLogic = 0;
    room.players.p2.totalCreativity = 0;
    room.players.p2.totalPersuasion = 0;

    console.log(`✅ Rematch accepted in room ${roomCode} — resetting game`);
    io.to(roomCode).emit("room:rematch-start", { room });
  });

  socket.on("room:rematch-decline", ({ roomCode }) => {
    if (!roomCode) return;
    socket.to(roomCode).emit("room:rematch-declined");
    console.log(`❌ Rematch declined in room ${roomCode}`);
  });

  socket.on("disconnect", () => {
    const res = handleDisconnect(socket.id);
    if (!res) return;
    if (!res.deleted && res.room) {
      io.to(res.room.code).emit("room:opponent-left", { room: res.room });
    }
    removeFromQueue(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});