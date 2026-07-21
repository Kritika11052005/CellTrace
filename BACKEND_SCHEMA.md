# CellTrace — Backend Schema

## 1. Design Principle

Store the minimum on-chain (hash, timestamp, event type — already what `BatteryProvenance.sol` does) and everything else off-chain in Postgres, linked by battery ID and transaction hash. This keeps gas costs low and keeps sensitive/bulky data off a public chain, while still making every off-chain record independently verifiable against its on-chain hash.

## 2. Tables

### `users`

Operators/admins who can submit predictions and trigger on-chain writes. Public visitors are not represented here — lookup/verify require no account.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `email` | text, unique | |
| `password_hash` | text | bcrypt/argon2 hash, never plaintext |
| `role` | enum(`operator`, `admin`) | |
| `wallet_address` | text, nullable | if operators have individually attributable actions; the actual signing wallet stays server-side regardless |
| `created_at` | timestamptz | |

### `batteries`

One row per physical battery being tracked.

| Column | Type | Notes |
|---|---|---|
| `id` | text, PK | the battery ID used as the on-chain key too — e.g. serial number |
| `manufacturer` | text, nullable | |
| `model` | text, nullable | |
| `chemistry` | text, nullable | e.g. NMC, LFP |
| `nominal_capacity_ah` | numeric, nullable | |
| `created_at` | timestamptz | |

### `predictions`

Every model run, whether or not it was ever logged on-chain.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `battery_id` | text, FK → `batteries.id` | |
| `soh_percent` | numeric | predicted State of Health |
| `rul_cycles` | integer, nullable | predicted Remaining Useful Life |
| `confidence_range` | jsonb | e.g. `{"soh_low": 82.1, "soh_high": 85.4}` |
| `model_version` | text | which model artifact produced this, for auditability |
| `input_data_ref` | text | pointer to the raw cycle-data file (object storage key or hash of the input) |
| `report_hash` | text | keccak256 hash of the canonical report payload — this is what gets written on-chain |
| `created_by` | UUID, FK → `users.id` | |
| `created_at` | timestamptz | |

### `chain_records`

One row per successful on-chain write, mirroring what's queryable from the contract directly (kept locally for fast reads/pagination without hitting the RPC every time).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `prediction_id` | UUID, FK → `predictions.id` | |
| `battery_id` | text, FK → `batteries.id` | |
| `tx_hash` | text, unique | Polygon transaction hash |
| `contract_address` | text | `BatteryProvenance` address on Amoy |
| `data_hash` | text | should equal `predictions.report_hash` — this equality is what "Verify" checks |
| `event_type` | text | matches the `eventType` param passed to `addRecord` |
| `block_number` | integer | |
| `chain_timestamp` | timestamptz | timestamp read back from the block, not just when we submitted |
| `status` | enum(`pending`, `confirmed`, `failed`) | |
| `created_at` | timestamptz | |

### `audit_log`

Append-only log of security-relevant actions, separate from `chain_records` (which is product data). Useful both for debugging and for demonstrating security posture to judges.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `actor_id` | UUID, nullable | null for unauthenticated/public actions like verify attempts |
| `action` | text | e.g. `login`, `predict`, `chain_write_attempt`, `verify_check` |
| `ip_address` | text | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | |

## 3. Relationships

```
users (1) ──< predictions (created_by)
batteries (1) ──< predictions (battery_id)
predictions (1) ──< chain_records (prediction_id)
batteries (1) ──< chain_records (battery_id)
```

## 4. Key Invariant

`predictions.report_hash` must equal `chain_records.data_hash` for any prediction that has a `confirmed` chain record. The **Verify** feature (see App Flow) is literally this check, run against a user-supplied report instead of the stored one — recompute the hash of what they gave you, compare to what's on-chain via `getAllRecords()`, and report a match or mismatch. This is the one query in the entire schema that has to be bulletproof, since it's the product's actual value proposition.
