require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

// ✅ FIXED CORS (added 5174)
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

// In-memory game state
const games = new Map();

function createGame(topic, player1Name, player2Name) {
  return {
    id: uuidv4(),
    topic,
    players: {
      p1: {
        name: player1Name || "Player 1",
        score: 0,
        totalLogic: 0,
        totalCreativity: 0,
        totalPersuasion: 0,
      },
      p2: {
        name: player2Name || "Player 2",
        score: 0,
        totalLogic: 0,
        totalCreativity: 0,
        totalPersuasion: 0,
      },
    },
    rounds: [],
    currentRound: 1,
    maxRounds: 3,
    status: "waiting",
    crowdMeter: 50,
    winner: null,
  };
}

// CREATE GAME
app.post("/api/game/create", (req, res) => {
  const { topic, player1Name, player2Name } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const game = createGame(topic, player1Name, player2Name);
  games.set(game.id, game);

  console.log(`🎮 Game created: ${game.id}`);
  res.json({ gameId: game.id, game });
});

// GET GAME
app.get("/api/game/:gameId", (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json(game);
});

// JUDGE ROUND
app.post("/api/game/:gameId/judge", async (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: "Game not found" });

  const { p1Argument, p2Argument } = req.body;
  if (!p1Argument || !p2Argument) {
    return res.status(400).json({ error: "Both arguments required" });
  }

  game.status = "judging";
  io.emit(`game:${game.id}:status`, { status: "judging" });

  const roundData = {
    round: game.currentRound,
    p1Argument,
    p2Argument,
    scores: null,
  };

  res.json({ message: "Judging started" });

  try {
    const prompt = `You are an ELITE WORLD-CLASS DEBATE JUDGE.

Your job is to evaluate arguments with extreme precision, logic, and fairness.

=====================
DEBATE TOPIC:
${game.topic}

PLAYER 1 (${game.players.p1.name} - FOR):
${p1Argument}

PLAYER 2 (${game.players.p2.name} - AGAINST):
${p2Argument}
=====================

EVALUATION RULES (VERY IMPORTANT):

1. LOGIC (0–10)
- Strength of reasoning
- Cause-effect clarity
- Absence of contradictions

2. EVIDENCE & EXAMPLES (0–10)
- Use of facts, examples, analogies
- Real-world grounding

3. REBUTTAL QUALITY (0–10)
- Did they counter the opponent directly?
- Did they weaken opponent’s claims?

4. CLARITY & STRUCTURE (0–10)
- Easy to follow
- Well organized

5. PERSUASION (0–10)
- Convincing power
- Emotional + rational balance

6. CREATIVITY (0–10)
- Unique ideas
- Fresh perspective

---------------------

CRITICAL JUDGING RULES:

- DO NOT favor longer arguments
- DO NOT assume facts unless stated
- Penalize irrelevant or vague statements
- Reward direct engagement with opponent
- Be STRICT, not generous
- Scores must reflect REAL differences

---------------------

PROCESS (MANDATORY):

1. Briefly analyze BOTH arguments internally
2. Score each category carefully
3. Compute total = sum of all categories
4. Decide winner ONLY based on total + reasoning

---------------------

RETURN STRICT JSON ONLY (NO TEXT OUTSIDE JSON):

{
  "p1": {
    "logic": 0,
    "evidence": 0,
    "rebuttal": 0,
    "clarity": 0,
    "persuasion": 0,
    "creativity": 0,
    "total": 0
  },
  "p2": {
    "logic": 0,
    "evidence": 0,
    "rebuttal": 0,
    "clarity": 0,
    "persuasion": 0,
    "creativity": 0,
    "total": 0
  },
  "verdict": "2-3 sentence clear explanation of WHY the winner won",
  "crowd": 0,
  "roundWinner": "p1 or p2 or draw"
}

IMPORTANT:
- crowd = 0–100 (who audience supports)
- roundWinner must match scores
- NO markdown
- NO explanation outside JSON
`;

    // 🔥 OpenRouter API CALL
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3001", // recommended
          "X-Title": "Debate Arena",
        },
      },
    );

    const text = response.data.choices?.[0]?.message?.content || "";

    // 🔥 Simulated streaming
    let fullText = "";
    for (let char of text) {
      fullText += char;
      io.emit(`game:${game.id}:stream`, {
        chunk: char,
        full: fullText,
      });
      await new Promise((r) => setTimeout(r, 3));
    }

    // 🔥 Clean + parse JSON
    let scores;
    try {
      const clean = fullText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");

      scores = JSON.parse(match[0]);
    } catch (err) {
      console.error("❌ Parse failed FULL TEXT:\n", fullText);
      io.emit(`game:${game.id}:error`, {
        message: "AI returned invalid format",
      });
      game.status = "arguing";
      return;
    }

    // Ensure totals
    // ✅ Better total calculation (supports new scoring system)
    const calcTotal = (p) =>
      (p.logic || 0) +
      (p.evidence || 0) +
      (p.rebuttal || 0) +
      (p.clarity || 0) +
      (p.persuasion || 0) +
      (p.creativity || 0);

    // Ensure totals exist
    scores.p1.total ??= calcTotal(scores.p1);
    scores.p2.total ??= calcTotal(scores.p2);

    // ✅ Stronger winner logic (handles edge cases)
    if (!scores.roundWinner) {
      if (scores.p1.total > scores.p2.total) {
        scores.roundWinner = "p1";
      } else if (scores.p2.total > scores.p1.total) {
        scores.roundWinner = "p2";
      } else {
        scores.roundWinner = "draw";
      }
    }
    // UPDATE GAME
    roundData.scores = scores;
    game.players.p1.score += scores.p1.total;
    game.players.p2.score += scores.p2.total;
    game.crowdMeter = scores.crowd || 50;
    game.rounds.push(roundData);

    if (game.currentRound >= game.maxRounds) {
      game.status = "finished";
      game.winner = scores.roundWinner;
    } else {
      game.currentRound++;
      game.status = "arguing";
    }

    io.emit(`game:${game.id}:scores`, {
      scores,
      game,
    });
  } catch (err) {
    console.error(
      "❌ OpenRouter FULL ERROR:",
      err.response?.data || err.message,
    );
    io.emit(`game:${game.id}:error`, {
      message: "OpenRouter API failed",
    });
    game.status = "arguing";
  }
});

// DELETE GAME
app.delete("/api/game/:gameId", (req, res) => {
  games.delete(req.params.gameId);
  res.json({ message: "Game deleted" });
});

// SOCKET
io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);
});

// HEALTH
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    games: games.size,
  });
});

// ✅ SAFE SERVER START (prevents crash if port busy)
const PORT = process.env.PORT || 3001;

server
  .listen(PORT, () => {
    console.log(`\n🎭 Server running on http://localhost:${PORT}`);
    console.log(
      `OpenRouter Key: ${
        process.env.OPENROUTER_API_KEY ? "✅ Loaded" : "❌ Missing"
      }\n`,
    );
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${PORT} busy, trying ${PORT + 1}...`);
      server.listen(PORT + 1);
    } else {
      console.error("❌ Server error:", err);
    }
  });
