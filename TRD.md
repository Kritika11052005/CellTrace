# CellTrace — Technical Requirements Document (TRD)

## 1. System Overview

CellTrace is a three-layer system: a **prediction service** (Python/ML), a **provenance layer** (Solidity smart contract on Polygon Amoy — already built and deployed), and a **presentation layer** (React frontend). The layers communicate through a single backend API — the frontend never talks to the blockchain or the models directly.

```
┌──────────────┐     HTTPS/JSON     ┌──────────────────┐     web3 calls    ┌────────────────────┐
│   Frontend   │ ─────────────────▶ │  FastAPI Backend  │ ────────────────▶ │  BatteryProvenance  │
│  (React/Next)│ ◀───────────────── │  (Render, Python)  │ ◀──────────────── │  (Polygon Amoy)      │
└──────────────┘                    └──────────┬─────────┘                  └────────────────────┘
                                                │
                                     ┌──────────▼─────────┐
                                     │   ML Models (.pkl)  │
                                     │  loaded at startup   │
                                     └──────────┬─────────┘
                                                │
                                     ┌──────────▼─────────┐
                                     │  Postgres (off-chain │
                                     │  metadata, reports)  │
                                     └─────────────────────┘
```

## 2. Frontend Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (React 18+, App Router)** | SSR for fast first paint on the dashboard, file-based routing, good Vercel deploy story |
| 3D / immersive visuals | **Three.js via React Three Fiber (R3F)**, `@react-three/drei` for helpers | Declarative 3D in React, the ecosystem this brief calls for (a living, rendered battery cell as the signature visual — see UI/UX doc) |
| Motion / scroll choreography | **GSAP + ScrollTrigger** | Fine-grained, timeline-based animation for the page-load sequence and scroll-triggered reveals — more control than CSS-only or Framer Motion for a cinematic feel |
| Micro-interactions | **Framer Motion** (used sparingly, for UI-level transitions — modals, hover states) | Keeps small interactions cheap; GSAP is reserved for the orchestrated, signature moments |
| Styling | **Tailwind CSS** + CSS variables for the design token system | Fast iteration, keeps the token system (colors/type/spacing) centralized and swappable |
| Data viz (SOH/RUL trend charts) | **visx** or **Recharts** | Lightweight, composable, good for the degradation-trend chart in the dashboard |
| State/data fetching | **TanStack Query (React Query)** | Caching + loading/error states for API calls, avoids hand-rolled fetch logic |

## 3. Backend Stack

| Concern | Choice | Why |
|---|---|---|
| API framework | **FastAPI + Uvicorn** | Already chosen and running; async, typed, auto-generated OpenAPI docs |
| ML serving | **scikit-learn / joblib models loaded once at startup** | Matches current setup — two models, ~22 MB total, no need for a model server at this scale |
| Blockchain client | **web3.py** | Backend signs and sends transactions to `BatteryProvenance` using the operator wallet's private key (never exposed to frontend) |
| Background jobs (if needed) | **FastAPI `BackgroundTasks`** for fire-and-forget on-chain writes, so the prediction response doesn't block on blockchain confirmation | Keeps API latency low; the UI can poll or receive a webhook/callback for on-chain confirmation |
| Hosting | **Render** (existing plan) | Already in place; paid Starter tier or uptime-ping cron to avoid cold-start during judging |

## 4. Database

| Concern | Choice | Why |
|---|---|---|
| Primary store | **PostgreSQL** (Render-managed or Supabase free tier) | Relational fit for battery records, predictions, and users; strong consistency for off-chain metadata that's *referenced* by on-chain hashes |
| What's stored on-chain vs off-chain | **On-chain: hash + timestamp + event type only.** **Off-chain (Postgres): the full report** (raw prediction, input data reference, model version) that hashes to the on-chain value | Keeps gas costs minimal and avoids ever putting sensitive/bulky data on a public chain |
| Schema | See `05-Backend-Schema.md` | — |

## 5. Auth & Security

- **JWT-based auth** for operator/admin actions (submitting new readings, triggering on-chain writes). Public battery-lookup/verification stays unauthenticated (that's the point — anyone should be able to verify).
- **Role separation**: `viewer` (read-only, public) vs `operator` (can submit predictions + write on-chain).
- **Secrets**: private key, DB credentials, RPC URL all live in environment variables on Render, never in the repo (already `.gitignore`d). See `06-Security.md` for full threat handling.
- **Cloudflare Turnstile** on public-facing submission forms to block bot abuse without the friction of traditional CAPTCHA.

## 6. AI & APIs

- **Inference**: in-house scikit-learn models (SOH/RUL regression), no external AI API dependency for the core prediction — keeps latency and cost predictable and avoids a third-party outage taking down the demo.
- **Optional**: an LLM-backed "explain this health report in plain language" feature (e.g., Claude API) as a stretch feature — clearly separated from the core prediction path so it can fail gracefully without breaking the main flow.

## 7. Deployment

| Component | Where | Notes |
|---|---|---|
| Frontend | **Vercel** | Free tier, first-class Next.js support, fast global CDN for the 3D assets |
| Backend | **Render** | Existing plan — paid Starter tier during judging to avoid cold starts, or free tier + cron ping |
| Smart contract | **Polygon Amoy testnet** | Already deployed at the address logged in project memory |
| Database | **Render Postgres or Supabase** | Managed, minimal ops overhead for a 4-day build |

## 8. Architecture Flow (Request Lifecycle)

1. User uploads/selects battery cycle data on the frontend.
2. Frontend `POST`s to `/predict` on the FastAPI backend.
3. Backend runs the loaded ML models, returns SOH + RUL + confidence range.
4. Frontend shows the result and offers "Log to chain."
5. On confirmation, backend hashes the report, calls `addRecord()` on `BatteryProvenance` via `web3.py`, using the operator wallet.
6. Backend stores the full report in Postgres, keyed by battery ID and the on-chain transaction hash.
7. Frontend polls or receives confirmation, updates the UI with the on-chain proof (tx hash, block explorer link).
8. Anyone can later `GET /battery/{id}` to see the full history — cross-checked live against the contract's `getAllRecords()`.

## 9. Engineering Rules

- **Scalability**: build for the load this actually has (a hackathon demo, then modest real usage) — no premature distributed infrastructure. Scale the boring way first: connection pooling, caching predictions for identical inputs, pagination on history endpoints.
- **Modularity**: prediction logic, blockchain-write logic, and API routing are separate modules/services — swapping the model or the chain shouldn't touch the other two.
- **Observability**: structured logging on every prediction and every on-chain write (success/failure, gas used, tx hash); a `/health` endpoint for uptime checks and the cron-ping keep-alive.
- **Security by default**: no secret ever in client-side code or logs; all writes to the contract are server-signed, never client-signed; input validation on every endpoint (especially file uploads for cycle data) before it reaches the model or the chain.
- **Fail loud, fail safe**: if the blockchain write fails, the prediction is still saved and shown to the user — provenance logging is additive, never a single point of failure for the core feature.
