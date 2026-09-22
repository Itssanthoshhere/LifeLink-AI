# Integration Guide: React JS + Node JS Blood Bank Management System & Python AI Backend

This guide outlines how to seamlessly integrate a **React JS + Node JS + Bootstrap** Blood Bank Management System with the existing **Python FastAPI AI Command Center Backend** in the `lifelink-ai` project.

---

## 1. High-Level Architecture

```text
                               ┌───────────────────────────────────┐
                               │   React.js Frontend (Bootstrap)   │
                               │   - Donor & Inventory Management  │
                               │   - AI Command Center Dashboard   │
                               └─────────────────┬─────────────────┘
                                                 │
                                        HTTP API Requests
                                                 │
                    ┌────────────────────────────┴────────────────────────────┐
                    ▼                                                         ▼
┌───────────────────────────────────────┐                 ┌───────────────────────────────────────┐
│       Node.js / Express API           │                 │      Python FastAPI AI Engine         │
│  - User Auth & RBAC (JWT)             │                 │  - Model 1: Demand Forecasting        │
│  - CRUD (Donors, Inventory, Requests) │ ◄── (Optional) ─►│  - Model 2: Shortage Early Warning    │
│  - Transactional DB (MongoDB/Postgres)│   Internal Proxy│  - Model 3: Donor Ranker & Dispatch   │
└───────────────────────────────────────┘                 │  - Engine 4: MILP Supply Chain Solver │
                                                          └───────────────────────────────────────┘
```

---

## 2. Target Directory Structure

Organize your project repository cleanly with separate folders for each service:

```text
lifelink-ai/
│
├── frontend/                     # React JS App (Port 3000)
│   ├── public/
│   ├── src/
│   │   ├── components/           # UI Components (Bootstrap Navbar, Cards, Tables)
│   │   ├── pages/                # Donor Portal, Inventory, AI Command Center
│   │   ├── services/             # Axios API clients (nodeApi.js, aiApi.js)
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env                      # REACT_APP_NODE_API_URL, REACT_APP_AI_API_URL
│
├── server/                       # Node.js + Express API Server (Port 5000)
│   ├── controllers/              # Auth, Donors, Inventory, AI Proxy
│   ├── models/                   # Mongoose / Sequelize Schemas
│   ├── routes/                   # API Routes (/api/auth, /api/donors, /api/inventory)
│   ├── server.js
│   ├── package.json
│   └── .env                      # PORT=5000, DB_URI, AI_SERVICE_URL=http://localhost:8000
│
├── backend/                      # Existing Python FastAPI AI Backend (Port 8000)
│   ├── src/
│   │   ├── api.py                # FastAPI REST Server
│   │   ├── command_center.py     # AI Orchestration
│   │   └── ...
│   ├── models/                   # XGBoost models (.pkl)
│   └── requirements.txt
│
└── package.json                  # Root runner (runs frontend, server, & python backend together)
```

---

## 3. Communication Patterns

### Option A: Direct Client Requests (Recommended for Real-Time AI Dashboard)
The React frontend makes requests directly to both backends:
- **Node.js (Port 5000)** for authentication, CRUD records (register donor, update stock).
- **FastAPI (Port 8000)** for AI predictions, shortage risk alerts, donor ranking lists, and logistics optimization.

```javascript
// frontend/src/services/api.js
import axios from 'axios';

export const nodeApi = axios.create({
  baseURL: process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api'
});

export const aiApi = axios.create({
  baseURL: process.env.REACT_APP_AI_API_URL || 'http://localhost:8000/api'
});
```

### Option B: Node.js API Gateway (Proxying)
The React frontend only talks to Node.js (Port 5000). Node.js proxies AI requests to FastAPI (Port 8000) using `axios`.

```javascript
// server/controllers/aiController.js (Node.js)
const axios = require('axios');

exports.getCommandCenterIntelligence = async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8000/api/command-center');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch AI intelligence" });
  }
};
```

---

## 4. Environment & CORS Setup

1. **FastAPI CORS ([`backend/src/api.py`](file:///Users/sandy/Developer/Projects/lifelink-ai/backend/src/api.py))**:
   FastAPI is already configured with CORS enabled:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Node.js CORS (`server/server.js`)**:
   ```javascript
   const cors = require('cors');
   app.use(cors({ origin: 'http://localhost:3000' }));
   ```

---

## 5. Unified 1-Command Startup

You can use `concurrently` in a root [`package.json`](file:///Users/sandy/Developer/Projects/lifelink-ai/package.json) to launch all 3 services simultaneously:

```json
{
  "name": "lifelink-ai-monorepo",
  "version": "1.0.0",
  "scripts": {
    "start:ai": "cd backend && source .venv/bin/activate && uvicorn src.api:app --reload --port 8000",
    "start:server": "cd server && npm start",
    "start:frontend": "cd frontend && npm start",
    "dev": "concurrently \"npm run start:ai\" \"npm run start:server\" \"npm run start:frontend\""
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

---

## 6. Integration Checklist for Later Execution

- [ ] Initialize `frontend/` using React JS & Bootstrap.
- [ ] Initialize `server/` using Node.js & Express.
- [ ] Align MongoDB/PostgreSQL schemas with Python dataset fields (`hospital_id`, `blood_group`, `component`, `units`).
- [ ] Connect React AI Dashboard component to `http://localhost:8000/api/command-center`.
- [ ] Connect React Donor Dispatch component to `http://localhost:8000/api/donors`.
- [ ] Setup root `package.json` with `concurrently` for 1-click execution.
