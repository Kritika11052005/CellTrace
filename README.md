<div align="center">

# ⚡ CellTrace APM
### Multi-Agent EV Asset Performance Management (APM) & Battery Integrity Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy_Testnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white)](https://polygon.technology/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

*An enterprise EV Asset Performance Management (APM) agent combining Gemini 2.5 Flash AI, Electro-Chemical Physics RAG, multi-model Scikit-Learn ML inference, and Polygon blockchain provenance.*

[Public Gateway](http://localhost:3000) • [APM Operations Console](http://localhost:3000/dashboard) • [Inference Terminal](http://localhost:3000/dashboard/predict) • [API Docs](http://localhost:8000/docs)

---

</div>

## 📌 Executive Summary

**CellTrace APM** is an AI-powered EV Asset Performance Management layer designed for industrial EV battery packs, stationary storage modules, and secondary-life cells. 

It monitors **State-of-Health (SOH)**, analyzes **charging cycle C-rate patterns**, tracks **thermal excursions**, and models **degradation trajectories** across a fleet — generating dynamic **predictive maintenance triggers**, **optimal charge-discharge recommendations**, and **remaining useful life (RUL) estimates** per asset, anchored onto the **Polygon Amoy Blockchain**.

---

## ✨ Key Features & Agent Architecture

- **🧠 Gemini 2.5 Flash APM Agent Engine**:
  - High-precision root-cause diagnostics (SEI layer dissolution, active lithium loss, cell imbalance).
  - Dynamic failure risk probability (%) & estimated service window calculation in days.
  - Actionable predictive maintenance work orders with interactive dispatch triggers.
  - Optimal charge-discharge protocols (Max C-rate capping, 15%-85% SOC windows, thermal pre-conditioning).

- **🔬 Electro-Chemical Battery Physics RAG**:
  - Integrated RAG knowledge base covering lithium plating over-potential mechanics, SEI growth kinetics ($t^{0.5}$), lattice stress in high-nickel cathodes (NMC 811), and thermal runaway thresholds.
  - Retrieves exact electro-chemical literature to power the **Gemini APM Fleet Copilot** chat.

- **🗄️ Live Database Telemetry Context Ingestion**:
  - Direct integration with Neon PostgreSQL database via Prisma ORM.
  - Ingests historical SOH trajectories, cycle counts, peak temperatures (46.2°C), average C-rates (1.4C), and cell imbalance deltas (18.4 mV) for exact, asset-specific diagnostics.

- **⚡ Multi-Model Scikit-Learn ML Inference Engine**:
  - **SOH Regressor (`soh_final_model.pkl`)**: Predicts SOH % using 8-feature cycle telemetry (`soh_at_start`, `soh_at_cutoff`, `soh_fade_slope`, `soh_fade_curvature`, `soh_std`, `n_cycles_used`, `voltage_max_mean`, `voltage_max_trend`).
  - **RUL Forecasting (`rul_final_model.pkl`)**: Predicts remaining operational cycle counts and fraction.
  - **Knee-Point Classifier (`knee_point_final_model.pkl`)**: Flags accelerated capacity fade and non-linear phase transitions.

- **⛓️ Polygon Blockchain Provenance Anchoring**:
  - Keccak-256 cryptographic report hashing and on-chain verification via `BatteryProvenance.sol` on **Polygon Amoy Testnet (Chain ID: 80002)**.

- **🔋 3D Living Cell Telemetry Core & Multi-Column UI**:
  - Three.js & React Three Fiber dynamic 3D cylindrical battery visualizer with glowing active core and orbital energy rings.
  - Multi-column dashboard grid layout eliminating empty space and maximizing screen real estate.

---

## 🏗️ System Architecture

```
                                    +-----------------------------------+
                                    |       Next.js 16 Web App          |
                                    | (TailwindCSS v4, Three.js, React) |
                                    +-----------------+-----------------+
                                                      |
                                           HTTP / REST JSON API
                                                      |
                                                      v
                                    +-----------------+-----------------+
                                    |         FastAPI Backend           |
                                    |     (Uvicorn, Pydantic, Web3)     |
                                    +--+----------------+------------+--+
                                       |                |            |
             +-------------------------+                |            +-------------------------+
             |                                          |                                      |
             v                                          v                                      v
+------------+------------------+     +-----------------+------------------+     +-----------------+------------------+
|  Scikit-Learn ML Inference    |     |  Gemini 2.5 Flash APM Agent    |     |   Polygon Amoy Blockchain        |
|  - soh_final_model.pkl        |     |  - Root-Cause Diagnostics      |     |   - BatteryProvenance.sol        |
|  - rul_final_model.pkl        |     |  - Battery Physics RAG           |     |   - Web3.py RPC Integration      |
|  - knee_point_final_model.pkl |     |  - Optimal Charging Protocols    |     +-----------------+------------------+
+------------+------------------+     +-----------------+------------------+                       |
             |                                          |                                      v
             +------------------------------------------+-----------------------------> Prisma ORM <
                                                                                       (Neon PostgreSQL)
```

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Generative AI & RAG** | Google Gemini API (`gemini-2.5-flash`), Electro-Chemical RAG Knowledge Engine, SlowAPI Rate Limiting |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Three.js, React Three Fiber, Recharts, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Web3.py, Joblib, Scikit-Learn, Pandas, NumPy, Prisma Client |
| **Database** | Neon Serverless PostgreSQL, Prisma ORM |
| **Blockchain** | Solidity (`v0.8.20`), Hardhat, Polygon Amoy Testnet (Chain ID 80002), Ethers.js |

---

## 📂 Repository Structure

```
CellTrace/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py           # FastAPI application entrypoint
│   │   ├── config.py         # Settings & Gemini API key configuration
│   │   ├── routes/           # REST endpoints (apm, predictions, fleet, chain, auth)
│   │   └── services/         # APM Agent, RAG Knowledge, ML & Web3 services
│   │       ├── apm_agent.py  # Gemini 2.5 Flash APM reasoning service
│   │       ├── rag_knowledge.py # Electro-chemical physics RAG engine
│   │       ├── ml_service.py # Scikit-Learn 8-feature ML solver
│   │       └── web3_service.py # Polygon Web3 anchoring service
│   └── models/               # Trained Scikit-Learn .pkl model files
│       ├── soh_final_model.pkl
│       ├── rul_final_model.pkl
│       └── knee_point_final_model.pkl
├── frontend/                 # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/              # App Router pages (dashboard, predict, login, gateway)
│   │   ├── components/       # APMCopilot, PredictiveMaintenanceFeed, OptimalChargingPanel, LivingCell
│   │   └── services/         # API integration client
│   └── public/               # Static assets & brand favicons
└── blockchain/               # Hardhat Smart Contract Workspace
    ├── contracts/            # BatteryProvenance.sol Solidity contract
    ├── scripts/              # Contract deployment scripts
    └── hardhat.config.js     # Hardhat network configuration
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0+`
- **Python**: `v3.11+`
- **Git**

---

### 2. Clone the Repository
```bash
git clone https://github.com/Kritika11052005/CellTrace.git
cd CellTrace
```

---

### 3. Backend Setup (FastAPI & Gemini AI)
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```env
DATABASE_URL="postgresql://user:password@ep-cool-db.neon.tech/celltrace?sslmode=require"
JWT_SECRET="celltrace-super-secret-key-2026"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://cell-trace.vercel.app"

# Gemini AI Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_MODEL="gemini-2.5-flash"

# Web3 Polygon Amoy
POLYGON_AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
CONTRACT_ADDRESS="0x..."
PRIVATE_KEY="0x..."
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

---

### 4. Frontend Setup (Next.js 16)
```bash
cd ../frontend
npm install
```

Create a `.env.local` file inside `frontend/`:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

Run the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
