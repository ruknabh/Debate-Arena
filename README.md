# 🎯 Debate Arena

A real-time multiplayer debate game where two players argue opposing sides of a topic and an AI judge scores each round.

## Tech Stack

- **Frontend** — React + Vite + Tailwind CSS + Zustand
- **Backend** — Node.js + Express + Socket.IO
- **AI Judge** — OpenRouter API (GPT-4o Mini)
- **Frontend Hosting** — Vercel
- **Backend Hosting** — Render

---

## How It Works

1. Player 1 creates a room with a topic and shares the room code
2. Player 2 joins using the code (or use Quick Match for random pairing)
3. Both players submit arguments each round
4. The AI judge scores both arguments across 6 criteria: Logic, Evidence, Rebuttal, Clarity, Persuasion, Creativity
5. Best of 3 rounds wins

---

## Project Structure

```
debate-arena/
├── src/                        # Frontend (React + Vite)
│   ├── screens/
│   │   ├── HomeScreen.jsx      # Landing / room creation / joining
│   │   ├── LobbyScreen.jsx     # Waiting room with countdown
│   │   ├── DebateScreen.jsx    # Main debate UI
│   │   └── FinalScreen.jsx     # Results + rematch
│   ├── components/
│   │   ├── CrowdMeter.jsx      # Live crowd sentiment bar
│   │   ├── JudgeStream.jsx     # AI verdict display
│   │   └── ScorePanel.jsx      # Per-player score breakdown
│   ├── hooks/
│   │   ├── useSocket.js        # Socket.IO connection + event handling
│   │   └── useRoom.js          # Room actions (submit arg, rematch)
│   ├── store/
│   │   └── gameStore.js        # Zustand global state
│   └── App.jsx                 # Phase-based screen router
├── server/                     # Backend (Node.js)
│   ├── index.js                # Express server + Socket.IO + judge logic
│   ├── roomManager.js          # Room CRUD, argument submission
│   └── matchmaking.js          # Queue-based matchmaking
├── .env.development            # Local env vars (frontend)
├── .env.production             # Production env vars (frontend)
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/debate-arena.git
cd debate-arena
npm install          # frontend deps
cd server && npm install   # backend deps (adjust path to your structure)
```

### 2. Set up environment variables

**Frontend** — create `.env.development` in the project root:
```
VITE_SERVER_URL=http://localhost:3001
```

**Backend** — create `.env` in the server folder:
```
OPENROUTER_API_KEY=your_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Run both servers

```bash
# Terminal 1 — backend
node index.js

# Terminal 2 — frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Set:
   - **Root Directory**: `server` (or wherever your `index.js` is)
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add Environment Variables:
   - `OPENROUTER_API_KEY` = your key
   - `FRONTEND_URL` = your Vercel URL (add after frontend is deployed)
6. Deploy — copy your Render URL (e.g. `https://debate-arena-api.onrender.com`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Add Environment Variable:
   - `VITE_SERVER_URL` = your Render backend URL
3. Deploy — copy your Vercel URL
4. Go back to Render → Environment → update `FRONTEND_URL` with the Vercel URL
5. Redeploy the Render service

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `VITE_SERVER_URL` | Frontend | Backend URL (Render) |
| `OPENROUTER_API_KEY` | Backend | OpenRouter API key for AI judge |
| `PORT` | Backend | Server port (Render sets this automatically) |
| `FRONTEND_URL` | Backend | Frontend URL (Vercel) for CORS |

---

## Game Scoring

Each argument is scored 1–10 on:

| Criterion | Description |
|---|---|
| Logic | How rational and well-reasoned |
| Evidence | Facts, examples, data cited |
| Rebuttal | Addresses the opposing side |
| Clarity | Clear and well-structured |
| Persuasion | Overall convincingness |
| Creativity | Originality of argument |

Max score per round: **60 points**. Best total score across 3 rounds wins.