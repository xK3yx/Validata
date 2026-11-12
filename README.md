# Validata - AI Startup Idea Validator

Validate your startup or SaaS idea with an AI-powered report grounded in live web search results. Runs on Groq (`openai/gpt-oss-120b` by default) with Serper for research.

[![CI](https://github.com/xK3yx/Validata/actions/workflows/ci.yml/badge.svg)](https://github.com/xK3yx/Validata/actions/workflows/ci.yml) ![AI](https://img.shields.io/badge/AI-Groq-6366f1?style=flat-square) ![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-10b981?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)

---

## Features

- **Grounded in real search results** — before analysis, the server searches the web for competitors and market data; the report cites them as [1], [2]… and links each market size figure to its source (or labels it an AI estimate)
- **9-Dimension Analysis** — Market opportunity, competition, monetization, risks, MVP features, pivot suggestions, and more
- **Viability Score** — 0–100 score with verdict (Highly Promising → Risky)
- **Head-to-Head Comparison** — Submit two ideas simultaneously and get a side-by-side AI battle with radar chart
- **Refinement Mode** — Get a report, refine your idea based on feedback, and re-validate to improve your score
- **Competitor Deep Dive** — Click any competitor for live intel (founded, funding, pricing, features, weaknesses)
- **AI Follow-up Chat** — Ask the AI anything about your idea after validation
- **PDF Export** — Download a polished 2-page PDF report — client-side, no server roundtrip
- **Public Share Links** — Share any report via a unique URL
- **Private History & Trends** — Past analyses with a score trend chart, visible only to the browser that created them
- **Usage Limits** — 5 free validations per browser per day (failed AI calls don't count), plus a per-IP hourly cap
- **Validated AI output** — every report is checked against a schema (Zod) and retried if the model returns malformed JSON

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts (radar + line charts) |
| PDF | @react-pdf/renderer (client-side) |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| AI | Groq SDK — `openai/gpt-oss-120b` (configurable via `GROQ_MODEL`) |
| Web Research | Serper API (google.serper.dev) |
| Validation & Security | Zod, Helmet, express-rate-limit |
| Tests | Node test runner + Supertest |

---

## Getting Started

### Prerequisites

- Node.js 22+
- [Groq API key](https://console.groq.com) (free)
- [Serper API key](https://serper.dev) (optional — enables grounded reports and competitor deep dive)

### Installation

```bash
# Clone the repo
git clone https://github.com/xK3yx/Validata.git
cd Validata

# Install all dependencies (server + client)
npm run install:all
```

### Environment Setup

Copy `.env.example` to `.env` in the project root and add your keys:

```env
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here   # optional
```

`.env.example` documents the other settings (model, port, CORS origin, rate limits).

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

### Running Tests

```bash
npm test
```

The API tests use an in-memory database and stub the Groq and Serper calls, so no keys are needed.

---

## Project Structure

```
validata/
├── server/
│   ├── index.js          # Entry point: env checks, DB init, listen
│   ├── app.js            # Express app: security headers, rate limits, routes
│   ├── db.js             # SQLite schema, migrations, per-browser queries
│   ├── groq.js           # Groq calls, report schema validation, retries
│   ├── serper.js         # Web research for grounding + competitor lookup
│   ├── middleware/       # X-Client-ID check, request body validation
│   ├── test/             # API and report-parsing tests
│   └── routes/
│       ├── validate.js   # POST /api/validate, GET /api/validate/usage
│       ├── history.js    # GET/DELETE /api/history/:id
│       ├── compare.js    # POST /api/compare
│       ├── competitor.js # GET /api/competitor
│       ├── chat.js       # POST /api/chat
│       └── share.js      # GET /api/share/:shareId
├── client/
│   └── src/
│       ├── pages/        # Home, Results, History, Compare, Share
│       ├── components/   # Navbar, IdeaForm, Sources, ChatWidget, PDFReport, ...
│       ├── api/          # Axios client (adds X-Client-ID to every request)
│       └── utils/        # clientId (localStorage UUID)
├── .env                  # API keys (not committed)
└── validata.db           # SQLite database (auto-created, not committed)
```

---

## API Reference

Endpoints that read or create analyses require an `X-Client-ID` header (a random per-browser UUID). History is scoped to it; reports are only public through their share link.

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

```jsonc
{
  "viability_score": 72,
  "verdict": "Promising",  // derived from the score
  "summary": "...",
  "market_opportunity": { "score": 8, "analysis": "... [1]", "market_size": "$4.2B TAM", "market_size_source": 1 },
  "competition": { "score": 6, "analysis": "...", "competitors": ["..."] },
  "monetization": { "strategies": [{ "name": "...", "description": "..." }] },
  "risks": [{ "title": "...", "severity": "High|Medium|Low", "description": "..." }],
  "mvp_features": [{ "feature": "...", "priority": "Must Have|Should Have|Nice to Have" }],
  "pivot_suggestions": [{ "title": "...", "description": "...", "key_change": "...", "potential_upside": "..." }],
  "dimension_scores": { "innovation": 7, "execution_feasibility": 8, "monetization_potential": 7 },
  "sources": [{ "id": 1, "title": "...", "url": "https://...", "snippet": "..." }]
}
```

---

## License

[MIT](LICENSE)
