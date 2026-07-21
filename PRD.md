# CellTrace — Product Requirements Document (PRD)

## 1. App Overview

CellTrace is a battery intelligence platform that predicts the health and remaining useful life of a lithium-ion battery from its usage data, and permanently anchors every prediction to an immutable, tamper-proof provenance record on-chain.

In one sentence: **CellTrace tells you how healthy a battery really is, and proves that assessment can never be quietly altered.**

The platform has two tightly coupled halves:

- **Prediction engine** — ML models (trained on CALCE, MIT, NASA, and SNL cell-degradation datasets, 209 cells) that estimate State of Health (SOH) and Remaining Useful Life (RUL) from charge/discharge cycle data.
- **Provenance layer** — every prediction is hashed and written to a smart contract (`BatteryProvenance`, deployed on Polygon Amoy) that only CellTrace's backend wallet can write to, creating a verifiable, append-only history per battery ID.

## 2. Problem

Batteries change hands constantly — EV resale, second-life energy storage, grid batteries, refurbished laptop/phone packs — and at every handoff, the buyer has to trust a health report they cannot independently verify. Health reports today are:

- **Editable after the fact.** A spreadsheet or PDF can be altered with no trace.
- **Siloed.** A report from a previous owner or reseller lives on their system, not the battery's.
- **Opaque.** There's no standard way to check "has this health score changed since it was issued?"

This creates real financial risk: buyers overpay for degraded batteries, second-life energy storage projects inherit hidden risk, and there's no chain of custody for a physical asset that can hold real danger (thermal runaway) if its actual condition is misrepresented.

## 3. Target Users

| User | Need |
|---|---|
| **EV / battery resale buyers** | Verify a battery's real health before purchase, independent of the seller's word |
| **Second-life battery integrators** (grid storage, repurposing) | A trustworthy, auditable health history to assess suitability for reuse |
| **Battery recyclers & refurbishers** | Track a cell's condition across its lifecycle to route it correctly (reuse vs. recycle) |
| **Hackathon judges / technical evaluators** | Assess the technical soundness of the ML + blockchain integration |

For the hackathon build, the primary user-facing persona is a **buyer or evaluator checking a battery's health report**, with a secondary **admin/operator persona** submitting new readings.

## 4. Core Features

1. **Battery health prediction** — upload or select cycle data, get SOH % and estimated RUL (cycles/time remaining).
2. **On-chain provenance logging** — each prediction is hashed (keccak256) and written to the smart contract under the battery's ID, with a timestamp and event type.
3. **Provenance verification / history view** — look up any battery ID and see its full on-chain record trail, verifiable independently via the block explorer.
4. **Tamper-evidence check** — recompute a stored report's hash and compare it against the on-chain hash to prove (or disprove) it hasn't been altered.
5. **Dashboard / visual health report** — a clear, visual presentation of SOH, RUL, degradation trend, and chain-of-custody for a given battery.

## 5. Goals

- Ship a working end-to-end demo: raw data → prediction → on-chain record → verifiable proof, inside the hackathon window.
- Make the trust mechanism (blockchain) legible to a non-technical judge in under 60 seconds of demo time.
- Keep the architecture honest — no infrastructure added that isn't earning its place at this scale (see TRD for the reasoning already applied to this: no Kafka, no Spark, no premature distributed systems).

## 6. User Stories

- *As a buyer*, I want to enter a battery ID and see its verified health history, so I can decide whether to trust the asking price.
- *As an operator*, I want to submit new cycle data and get a health prediction I can then log on-chain, so the record becomes part of that battery's permanent history.
- *As a judge*, I want to see that a report's hash matches what's on-chain, so I can confirm the system genuinely prevents silent tampering.
- *As a second-life integrator*, I want to see a battery's full degradation trend over time, not just a single snapshot, so I can judge its fit for a new use case.

## 7. Success Metrics

For the hackathon submission:

- **Functional**: prediction → hash → on-chain write → verified read-back works end-to-end without manual intervention.
- **Correctness**: model predictions are within a reasonable, explainable error margin on held-out data (report actual metrics — RMSE/MAE on SOH, not just "it works").
- **Demo clarity**: a judge with zero blockchain background can watch the demo and correctly explain, in their own words, what the on-chain layer is protecting against.
- **Resilience**: the deployed app doesn't visibly fail during judging (cold-start handled, RPC calls don't hang the UI).

## 8. Feature Map

```
CellTrace
├── Prediction
│   ├── Upload / select battery cycle data
│   ├── Run SOH + RUL inference
│   └── View prediction result (with confidence/error range)
├── Provenance
│   ├── Hash + submit prediction to BatteryProvenance contract
│   ├── Look up battery ID → full record history
│   └── Verify: recompute hash vs on-chain hash
├── Dashboard
│   ├── Single-battery health report view
│   ├── Degradation trend chart (SOH over time / cycles)
│   └── Chain-of-custody timeline
└── Admin (operator-only)
    ├── Submit new readings
    └── Manage battery IDs
```
