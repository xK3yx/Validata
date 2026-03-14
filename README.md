# Validata — AI Startup Idea Validator

Validate your startup or SaaS idea in seconds with a comprehensive AI-powered report. Powered by **Llama 3.3 70B** via Groq.

![Validata](https://img.shields.io/badge/AI-Llama%203.3%2070B-6366f1?style=flat-square) ![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-10b981?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)

---

## Features

- **9-Dimension Analysis** — Market opportunity, competition, monetization, risks, MVP features, pivot suggestions, and more
- **Viability Score** — 0–100 score with verdict (Highly Promising → Risky)
- **Head-to-Head Comparison** — Submit two ideas simultaneously and get a side-by-side AI battle with radar chart
- **Refinement Mode** — Get a report, refine your idea based on feedback, and re-validate to improve your score
- **Competitor Deep Dive** — Click any competitor for live intel (founded, funding, pricing, features, weaknesses)
- **AI Follow-up Chat** — Ask the AI anything about your idea after validation
- **PDF Export** — Download a polished 2-page PDF report — client-side, no server roundtrip
- **Public Share Links** — Share any report via a unique URL
- **History & Trends** — View all past analyses with a score trend chart
- **Usage Tracking** — 5 free validations per day per browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts (radar + line charts) |
| PDF | @react-pdf/renderer (client-side) |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| AI | Groq SDK — Llama 3.3 70B Versatile |
| Competitor Research | Serper API (google.serper.dev) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Groq API key](https://console.groq.com) (free)
- [Serper API key](https://serper.dev) (optional — for competitor deep dive)

### Installation

```bash
# Clone the repo
git clone https://github.com/xK3yx/Validata.git
cd Validata

# Install all dependencies (server + client)
npm run install:all
```

### Environment Setup

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here   # optional
PORT=3001
```

### Running in Development

```bash
npm run dev
```

This starts both the Express server (port 3001) and Vite dev server (port 5173) concurrently with hot reload.

| URL | Service |
|-----|---------|
| http://localhost:5173 | React app |
| http://localhost:3001 | API server |
| http://localhost:3001/api/health | Health check |

---

## Project Structure

```
validata/
├── server/
│   ├── index.js          # Express entry point
│   ├── db.js             # SQLite schema + queries
│   ├── groq.js           # Groq AI integration (analyzeIdea, compareIdeas, chat)
│   ├── serper.js         # Competitor research via Serper API
│   └── routes/
│       ├── validate.js   # POST /api/validate, GET /api/validate/usage
│       ├── history.js    # GET/DELETE /api/history/:id
│       ├── compare.js    # POST /api/compare
│       ├── competitor.js # GET /api/competitor
│       ├── chat.js       # POST /api/chat
│       └── share.js      # GET /api/share/:shareId
├── client/
│   └── src/
│       ├── pages/        # Home, Results, History, Compare, Share, Pricing
│       ├── components/   # Navbar, IdeaForm, ScoreBadge, ChatWidget, PDFReport, ...
│       ├── api/          # Axios client (baseURL: /api)
│       └── utils/        # clientId (localStorage UUID)
├── .env                  # API keys (not committed)
└── validata.db           # SQLite database (auto-created, not committed)
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/validate` | Analyze a startup idea |
| `GET` | `/api/validate/usage` | Check daily usage remaining |
| `POST` | `/api/compare` | Compare two ideas head-to-head |
| `GET` | `/api/history` | Get all past analyses |
| `GET` | `/api/history/:id` | Get analysis by ID |
| `DELETE` | `/api/history/:id` | Delete an analysis |
| `GET` | `/api/competitor?name=X&industry=Y` | Competitor deep dive |
| `POST` | `/api/chat` | Follow-up AI chat |
| `GET` | `/api/share/:shareId` | Public shared report |
| `GET` | `/api/health` | Server health check |

---

## Report Structure

Each validated idea returns a JSON report with:

```json
{
  "viability_score": 72,
  "verdict": "Promising",
  "summary": "...",
  "market_opportunity": { "score": 8, "analysis": "...", "market_size": "$4.2B TAM" },
  "competition": { "score": 6, "analysis": "...", "competitors": ["..."] },
  "monetization": { "strategies": [{ "name": "...", "description": "..." }] },
  "risks": [{ "title": "...", "severity": "High|Medium|Low", "description": "..." }],
  "mvp_features": [{ "feature": "...", "priority": "Must Have|Should Have|Nice to Have" }],
  "pivot_suggestions": [{ "title": "...", "description": "...", "key_change": "...", "potential_upside": "..." }],
  "dimension_scores": { "innovation": 7, "execution_feasibility": 8, "monetization_potential": 7 }
}
```

---

## License

MIT
