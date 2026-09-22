### 1. Full Project Overview & Architecture

The **LifeLink AI** repository is a complete **AI Blood Supply Command Center** consisting of two main services:

```
                            ┌───────────────────────────────────────┐
                            │    Next.js 14 Frontend (Port 3000)    │
                            │  - Real-Time Command Dashboard        │
                            │  - Hospital Network Topology & Charts │
                            │  - Emergency Donor Dispatch & Scenarios│
                            └───────────────────┬───────────────────┘
                                                │
                                    REST API Requests (HTTP / CORS)
                                                │
                                                ▼
                            ┌───────────────────────────────────────┐
                            │   Python FastAPI AI Backend (Port 8000)│
                            │  - Model 1: XGBoost Demand Forecast   │
                            │  - Model 2: Shortage Early Warning    │
                            │  - Model 3: Intelligent Donor Ranker  │
                            │  - Engine 4: Google OR-Tools MILP     │
                            └───────────────────┬───────────────────┘
                                                │
                                                ▼
                            ┌───────────────────────────────────────┐
                            │  730-Day Synthetic Dataset Engine     │
                            │  (data/raw/*.csv, validation suite)   │
                            └───────────────────────────────────────┘
```

#### 1. Python FastAPI AI Backend (`/backend`)
- **Simulation Engine**: Generates 2 years of synthetic healthcare data (30 hospitals, 10 blood banks, 5k donors, 400k inventory batches, 260k orders, 390 emergencies).
- **Model 1 (Demand Forecasting)**: Multi-horizon XGBoost regressors (24h, 48h, 72h).
- **Model 2 (Shortage Prediction)**: Multi-horizon XGBoost classifiers calibrated via Isotonic Regression.
- **Model 3 (Donor Dispatch & Ranking)**: Spatial & compatibility algorithm for emergency donor mobilization.
- **Engine 4 (Google OR-Tools MILP Solver)**: Mixed-Integer Linear Programming network solver for inter-hospital blood transfers and FEFO inventory allocation.
- **FastAPI REST Server**: Exposes API endpoints (`/api/command-center`, `/api/shortages`, `/api/inventory`, `/api/network`, `/api/donors`, `/api/optimization`, `/api/scenarios`, etc.).

#### 2. Next.js Web Frontend (`/frontend`)
- Built with **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**.
- Renders an interactive operations dashboard connected directly to the FastAPI AI Backend.


### 2. How to Run the Entire Project (Backend + Frontend)

Follow these steps to set up and launch both services simultaneously.

#### Terminal 1: Setup & Launch Python AI Backend (Port 8000)

1. Open a terminal and navigate to the project root:
   ```bash
   cd /Users/sandy/Developer/Projects/lifelink-ai
   ```

2. Activate the Python virtual environment (or create it if not already done):
   ```bash
   # Create virtualenv (if needed)
   python3 -m venv backend/.venv

   # Activate virtualenv
   source backend/.venv/bin/activate
   ```

3. Install backend requirements:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```
   *(Note for macOS users: if XGBoost requires OpenMP, run `brew install libomp`)*

4. (Optional) Run validation suite:
   ```bash
   python backend/src/validation.py
   ```

5. Launch the FastAPI server:
   ```bash
   cd backend
   uvicorn src.api:app --reload --port 8000
   ```
   - **API Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - **Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

#### Terminal 2: Setup & Launch Next.js Frontend (Port 3000)

1. Open a **second terminal** and navigate to the `frontend` folder:
   ```bash
   cd /Users/sandy/Developer/Projects/lifelink-ai/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)

---

### Summary Checklist

| Component | Technology | Command | Default URL |
| :--- | :--- | :--- | :--- |
| **Backend API** | Python 3.12 / FastAPI / OR-Tools | `uvicorn src.api:app --reload --port 8000` | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **Frontend App** | Next.js 14 / React 18 / Tailwind | `npm run dev` | [http://localhost:3000](http://localhost:3000) |

All files are configured and ready to run using the two-terminal setup outlined above!

---
