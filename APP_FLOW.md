# CellTrace — App Flow

## 1. Core Pages

| Page | Purpose |
|---|---|
| **Landing** | Cinematic intro — the "living cell" hero, one-line value prop, primary CTA |
| **Predict** | Upload/select cycle data, run a health prediction |
| **Report** | Single prediction result — SOH, RUL, confidence, "Log to chain" action |
| **Battery Lookup** | Search by battery ID, view full on-chain provenance history |
| **Dashboard** | Operator view — list of tracked batteries, trend charts, recent activity |
| **Verify** | Standalone tamper-check: paste/upload a report, confirm its hash matches on-chain |
| **Login** (operator only) | Auth gate for submission/write actions |

## 2. Primary User Journey (Buyer / Evaluator)

```
Landing
  │
  ▼
Battery Lookup ── enters battery ID
  │
  ▼
History view ── sees full record trail (timestamps, hashes, event types)
  │
  ▼
Verify ── (optional) uploads the seller's report PDF/JSON
  │         → app recomputes hash → compares to on-chain hash
  ▼
Result: "✅ Matches on-chain record" or "⚠️ No match — report may have been altered"
```

## 3. Primary User Journey (Operator)

```
Login
  │
  ▼
Dashboard ── "New Reading" action
  │
  ▼
Predict ── upload cycle data → runs model → Report page
  │
  ▼
Report ── reviews SOH/RUL → clicks "Log to chain"
  │
  ▼
Confirmation state (pending → confirmed) ── shows tx hash + block explorer link
  │
  ▼
Battery Lookup for that ID now shows the new record
```

## 4. Flow Diagram (Full System)

```
[Landing] → [Battery Lookup] → [History View] → [Verify] → [Result]
     │
     └→ [Login] → [Dashboard] → [Predict] → [Report] → [Log to Chain] → [Confirmation] → back to [History View]
```

## 5. Navigation Rules

- Public pages (Landing, Battery Lookup, History View, Verify) require no auth — provenance verification must be checkable by anyone, that's the entire point of the product.
- Predict, Report (submission mode), and Dashboard require an authenticated **operator** session.
- Every page that shows a battery ID links directly to its History View — no dead ends.
- The "Log to chain" action is a one-way door in the UI: once submitted, it moves to a pending/confirmed state and cannot be undone or edited (matching the actual immutability of the underlying record).

## 6. Primary Actions

- **Look up a battery** (public, from Landing or nav bar at all times)
- **Run a prediction** (operator)
- **Log a prediction to chain** (operator, explicit confirm step — this costs gas and is irreversible)
- **Verify a report's authenticity** (public)
- **View degradation trend** (public, from History View)

## 7. Edge Cases

| Case | Handling |
|---|---|
| Battery ID has no on-chain records yet | History View shows an explicit empty state: "No records yet for this battery" — not a blank page or error |
| On-chain write fails (RPC down, out of gas, etc.) | Prediction result is still shown and saved off-chain; UI clearly marks it as "Not yet logged to chain" with a retry action |
| User uploads malformed/corrupt cycle data | Predict page validates and rejects before hitting the model, with a specific message about what's wrong |
| Verify shows a hash mismatch | Result is framed neutrally and factually ("recomputed hash does not match the on-chain record") — the interface doesn't accuse, it reports |
| Cold-start delay on Render free tier | Loading state on first request explains a brief delay is expected, rather than looking frozen/broken |
| Wallet/contract unreachable (RPC outage) | Read paths (lookup, verify) degrade gracefully with a "temporarily unable to reach the chain, try again shortly" message, distinct from "no records" |

## 8. User States

- **Anonymous / public** — can look up and verify, cannot submit or log.
- **Operator (authenticated)** — can do everything anonymous users can, plus submit predictions and log to chain.
- **Pending confirmation** — a specific in-flow state after "Log to chain" is clicked, before the transaction is mined; UI shows a distinct pending indicator, not a generic spinner.

## 9. Flow Notes

- The single most important flow to nail for the demo is **Predict → Report → Log to chain → History View shows it live**. Everything else supports that core loop.
- Verify should work as a standalone flow that doesn't require having just made a prediction — a judge should be able to paste in an arbitrary report and test it cold.
- Keep the "pending → confirmed" on-chain state visually honest — don't fake instant confirmation, since part of the product's credibility is that this is a real, verifiable write, not a UI illusion.
