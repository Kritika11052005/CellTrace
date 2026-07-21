<div align="center">

# ⚡ CellTrace
### On-Chain Battery Integrity & Machine Learning Degradation Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy_Testnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white)](https://polygon.technology/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

*An enterprise-grade battery lifecycle intelligence system combining multi-model Scikit-Learn ML inference with immutable Polygon blockchain provenance anchoring.*

[Public Gateway](http://localhost:3000) • [Operator Console](http://localhost:3000/login) • [API Documentation](http://localhost:8000/docs)

---

</div>

## 📌 Executive Summary

**CellTrace** bridges advanced electrochemical machine learning with decentralized ledger technology. It enables EV fleet operators, secondary market buyers, and grid storage facilities to evaluate battery **State-of-Health (SOH)**, forecast **Remaining Useful Life (RUL)**, detect **Knee-Point accelerated capacity fade**, and lock verifiable inspection reports directly onto the **Polygon Amoy Blockchain**.

---

## ✨ Key Features

- **⚡ ML Predictive Engine**: 
  - **SOH Regressor (`soh_final_model.pkl`)**: Predicts current battery capacity percentage based on cycle count, early fade rate statistics, and cathode chemistry (`LFP`, `NMC`, `NCA`, `LCO`).
  - **RUL Forecasting (`rul_final_model.pkl`)**: Computes remaining operational cycle life and capacity fraction.
  - **Knee-Point Classifier (`knee_point_final_model.pkl`)**: Early detection of internal resistance spikes and accelerated lithium plating phase transitions.
- **⛓️ Cryptographic Provenance Anchoring**:
  - SHA3-256 / Keccak-256 cryptographic canonical report hashing.
  - On-chain storage via `BatteryProvenance.sol` smart contract deployed on **Polygon Amoy Testnet (Chain ID: 80002)**.
- **🔋 3D Interactive Telemetry Core**:
  - Built with **Three.js & React Three Fiber**.
  - Dynamic 3D cylindrical battery cell visualizer with metallic end-caps, glowing active core, and orbital holographic energy rings that react dynamically to SOH changes.
- **🛡️ Fleet Management & Provenance Audit**:
  - Centralized registry for tracking EV packs, stationary storage modules, and secondary-life batteries.
  - Direct integration with PolygonScan explorer links for transaction verification.
- **🎨 High-Tech Cyber-Dark UI**:
  - Modern aesthetic built with `#deff00` (Cyber Lime) & `#070709` glassmorphism styling.

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
                                    +--------+----------------+---------+
                                             |                |
                       +---------------------+                +----------------------+
                       |                                                             |
                       v                                                             v
        +--------------+---------------+                             +---------------+---------------+
        |  Scikit-Learn ML Inference   |                             |   Polygon Amoy Blockchain     |
        |  - soh_final_model.pkl       |                             |   - BatteryProvenance.sol     |
        |  - rul_final_model.pkl       |                             |   - Web3.py RPC Integration   |
        |  - knee_point_model.pkl      |                             +---------------+---------------+
        +--------------+---------------+                                             |
                       |                                                             v
                       +---------------------> Prisma ORM <--------------------------+
                                                (Neon PostgreSQL)
```

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Three.js, React Three Fiber, Recharts, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Web3.py, Joblib, Scikit-Learn, NumPy, Prisma Client |
| **Database** | Neon Serverless PostgreSQL, Prisma ORM |
| **Blockchain** | Solidity (`v0.8.20`), Hardhat, Polygon Amoy Testnet (Chain ID 80002), Ethers.js |

---

## 📂 Repository Structure

```
CellTrace/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py           # FastAPI application entrypoint
│   │   ├── config.py         # App settings & environment loader
│   │   ├── routes/           # REST endpoints (auth, predict, fleet, chain)
│   │   └── services/         # Core business logic (ML & Web3 services)
│   └── models/               # Trained Scikit-Learn .pkl model files
│       ├── soh_final_model.pkl
│       ├── rul_final_model.pkl
│       └── knee_point_final_model.pkl
├── frontend/                 # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/              # App Router pages (gateway, login, dashboard)
│   │   ├── components/       # UI components & 3D LivingCell visualizer
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

### 3. Backend Setup (FastAPI)
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
AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
CONTRACT_ADDRESS="0xYourDeployedContractAddress"
PRIVATE_KEY="0xYourWalletPrivateKey"
CORS_ORIGINS="http://localhost:3000"
```

Start the backend server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
> The API interactive docs will be available at `http://127.0.0.1:8000/docs`.

---

### 4. Frontend Setup (Next.js)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> Open `http://localhost:3000` in your web browser.

---

### 5. Smart Contract Deployment (Optional - Hardhat)
If you wish to deploy a new instance of the smart contract to Polygon Amoy:
```bash
cd blockchain
npm install
npx hardhat run scripts/deploy.js --network amoy
```

---

## 🔗 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates operator session and returns JWT bearer token |
| `POST` | `/api/predict/soh` | Runs SOH, RUL, and Knee-Point ML inference |
| `POST` | `/api/chain/anchor` | Hashes report data & anchors record to Polygon Amoy smart contract |
| `GET` | `/api/chain/records/{id}` | Reads on-chain transaction history for a target battery cell |
| `GET` | `/api/batteries` | Retrieves registered battery fleet list |
| `GET` | `/api/health` | System health check endpoint |

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Developed with ⚡ by **Team CellTrace**

</div>
