# CellTrace — Security Document

## 1. Threat Model (what we're actually defending against)

| Threat | Impact if it happens |
|---|---|
| Backend wallet private key leaks | Attacker can write arbitrary fake provenance records — destroys the entire trust premise of the product |
| API keys / DB credentials leak | Data breach, ability to tamper with off-chain records, cost abuse on any paid API |
| User credentials stolen | Account takeover, unauthorized predictions/writes under someone else's identity |
| Bot abuse of public endpoints | Spam predictions, gas drained on pointless on-chain writes, inflated hosting costs |
| Tampered report passed off as genuine | Undermines the specific problem the product exists to solve |

The private key and the on-chain integrity guarantee are the two things that matter most — everything else is standard web-app hygiene, but those two are the product.

## 2. Secrets Management

- **Never in the repo, ever.** `PRIVATE_KEY`, `AMOY_RPC_URL`, DB connection strings, and any third-party API keys live only in Render's/Vercel's environment variable settings — `.gitignore` already blocks `.env` locally, but the real control is that these values are never typed anywhere that gets committed, screenshotted into a chat, or pasted into a public doc.
- **Least-privilege wallet.** The backend wallet holds only enough testnet POL to operate — it's not a wallet with real funds attached, which limits blast radius even in a worst-case leak.
- **Key rotation path.** `BatteryProvenance.transferOwnership()` already exists in the contract for exactly this reason — if the operating key is ever suspected compromised, ownership (and thus write access) can be moved to a new wallet without redeploying the contract.
- **No secrets in logs.** Structured logging must explicitly exclude request bodies/headers that could contain tokens, and never log the private key or full RPC URL with embedded credentials if using a keyed provider like Alchemy.

## 3. API Key & Backend Protection

- All blockchain-writing calls happen **server-side only** — the frontend never holds a private key, an RPC URL with an embedded API key, or any credential capable of writing to the contract. The frontend only ever calls CellTrace's own backend.
- Third-party API keys (RPC provider, any LLM API used for the "explain this report" stretch feature) are proxied through the backend, never exposed in frontend bundle code or `NEXT_PUBLIC_*` env vars.
- **Rate limiting** on all public endpoints (especially `/predict` and `/verify`) to prevent cost abuse and denial-of-service — e.g. via `slowapi` (FastAPI) or a reverse-proxy-level limiter.
- **CORS** locked to the actual frontend origin(s), not `*`.

## 4. User Data Protection

- Passwords stored as **bcrypt/argon2 hashes**, never plaintext, never reversible.
- **JWTs** short-lived with refresh tokens, not long-lived tokens stored insecurely client-side; store in httpOnly cookies rather than `localStorage` where possible, to reduce XSS token-theft risk.
- Minimal PII collection — the product doesn't need much beyond an operator email; don't collect or store more than the feature set requires.
- **Input validation and sanitization** on every endpoint, especially file uploads for cycle data — validate file type/size/structure before it ever reaches the model, and never `eval`/deserialize untrusted input.

## 5. On-Chain Integrity Protections (already built in)

- `onlyOwner` modifier on `addRecord()` — already implemented in `BatteryProvenance.sol` — means even a compromised frontend or a malicious third party cannot write fake records; they'd need the operator's private key specifically, which per section 2 never leaves the server environment.
- Because records are **append-only** (no `updateRecord` or `deleteRecord` function exists in the contract), even a compromised backend session can add fraudulent-but-attributable records, but can never quietly retroactively edit history — every write is a new, timestamped, permanent entry.

## 6. Bot / Abuse Protection — Cloudflare Turnstile

Yes — **Cloudflare Turnstile** is a good fit here and is recommended over traditional CAPTCHA:

- It's free, privacy-respecting (no user tracking/annoying image puzzles), and integrates as a simple widget + server-side token verification call.
- Apply it to: the public **Verify** flow (prevents scripted mass-verification abuse) and any public submission-adjacent form. It's not needed on pure read/lookup endpoints, where the cost of abuse is low and friction would hurt the product's "anyone can check this" premise.
- Flow: frontend renders the Turnstile widget → user completes it → frontend sends the resulting token to the backend alongside the request → backend verifies the token server-side with Cloudflare's siteverify API before processing → reject the request if verification fails.
- Turnstile's **secret key** follows the same rule as every other credential in section 2 — backend-only, never in frontend code.

## 7. Infrastructure Hardening

- HTTPS enforced everywhere (Render and Vercel both provide this by default — confirm it's not silently falling back to HTTP anywhere).
- Dependency scanning (`npm audit`, `pip-audit`) run before each deploy, given the tight hackathon timeline it's easy to pull in an outdated package with a known CVE.
- Database: parameterized queries / ORM (SQLAlchemy) everywhere, never raw string-interpolated SQL, to close off SQL injection entirely.
- Principle applied throughout: **the frontend is assumed hostile.** Every check that matters (auth, ownership, rate limits, input validation) is enforced server-side, because anything client-side can be bypassed by a motivated attacker with browser dev tools.
