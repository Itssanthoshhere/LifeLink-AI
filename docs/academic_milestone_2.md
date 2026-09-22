# LifeLink AI — Milestone 2 (M2) Review Document
## Evaluation Period: Sep 21 – Sep 25 | Academic & Technical Project Assessment

---

## 1. Review of Existing Systems and Project Feasibility (3 Marks)

### 1.1 Literature Review & Existing System Limitations
Managing healthcare blood supply chains requires coordinating scarce, perishable biological products (RBC, FFP, Platelets, Whole Blood) across uncertain, dynamic clinical demand landscapes. Existing blood bank and hospital supply chain architectures present five core operational failure modes:

```
[ Traditional Approaches ]                           [ LifeLink AI Architecture ]
1. Decentralized Min-Max Buffers    ──────────▶     Global Multi-Echelon Visibility
2. Unilateral Courier Requests      ──────────▶     MILP Network Transshipment
3. Broadcast Bulk SMS Outreach      ──────────▶     Multi-Criteria Decision Analysis (MCDA)
4. Historical Moving Averages       ──────────▶     75-Feature XGBoost Demand Regression
5. Static Threshold Shortage Alarms ──────────▶     Calibrated Probabilistic Early Warning
```

#### Comparative Review Matrix

| Functional Domain | Traditional Systems | Key Limitations & Failure Modes | LifeLink AI Implementation |
| :--- | :--- | :--- | :--- |
| **Inventory Control** | Independent $(s, S)$ min-max stock buffers per facility. | Promotes localized hoarding; causes concurrent shortages and regional wastage. | **Engine 4 Global MILP**: Coordinated allocation respecting regional safety reserve floors. |
| **Demand Forecasting** | Linear moving averages or ARIMA time-series models. | Fails to incorporate weekend surgical dips, trauma surges, or epidemic spikes. | **Model 1 XGBoost Regression**: 75-feature lag, rolling, calendar, and emergency signals. |
| **Shortage Detection** | Reactive alarm triggered when on-shelf stock reaches zero. | Alerts occur too late for physical courier transport or donor phlebotomy. | **Model 2 Early Warning**: Multi-horizon calibrated classification (24h, 48h, 72h). |
| **Donor Engagement** | Unfiltered bulk SMS/phone outreach to static registries. | High donor fatigue; low contact yield; ignores proximity and 90-day rest intervals. | **Model 3 MCDA Scoring**: Dynamic ranking of distance, response probability, and rest intervals. |

---

### 1.2 Multi-Dimensional Project Feasibility Evaluation

Based on the verified working codebase, the feasibility of **LifeLink AI** was evaluated across eight core dimensions:

1. **Technical Feasibility (High)**: Fully containerized open-source stack (Python 3.12, FastAPI, XGBoost, Google OR-Tools, Next.js 14, Tailwind CSS). Demonstrated 100% test pass rate across 12 API endpoints.
2. **Data Feasibility (High Prototype / Moderate Clinical)**: Validated on 700,800 synthetic data points simulating 30 hospitals, 10 blood bank hubs, 5,000 donors, and 400k inventory batches over 730 days. Real-world deployment requires standard HL7/FHIR EHR integration.
3. **Algorithmic Feasibility (High)**: Gradient-boosted decision trees handle non-linear tabular healthcare dynamics; branch-and-cut MILP guarantees physical constraint satisfaction (vehicle capacity, FEFO, compatibility).
4. **Computational Feasibility (High)**: Real-time inference executes in $< 15\text{ ms}$; global MILP network optimization across 40 nodes and 646 transit edges solves in **2.18 seconds**.
5. **Operational Feasibility (High)**: Designed as an human-in-the-loop decision-support tool with transparent constraint rationales for transfusion medical officers.
6. **Scalability Feasibility (High)**: The MILP model scales linearly with blood components and quadratically with transit corridors, remaining computationally tractable for up to 100 regional facilities.
7. **Deployment Feasibility (High)**: Microservice architecture with FastAPI REST endpoints and Next.js frontend; zero proprietary license fees.
8. **Ethical & Safety Feasibility (Strictly Bounded)**: Synthetic simulation foundation ensures zero risk to patient privacy (non-PII); system disclaims autonomous clinical authority and operates purely on logistics.

---

## 2. Objectives and Methodology of the Proposed Work (3 Marks)

### 2.1 Core Project Objectives
1. **Prevent Blood Shortages**: Reduce unfulfilled clinical requisitions by $\ge 40\%$ across 30 regional facilities.
2. **Minimize Cold-Chain Perishability & Spoilage**: Optimize First-Expired, First-Out (FEFO) dispatch to keep total network expiration rate below $5\%$.
3. **Automate Inter-Hospital Transshipment**: Execute Google OR-Tools MILP optimization to dispatch peer-to-peer transfers within $< 3\text{ seconds}$.
4. **Intelligent Emergency Donor Matching**: Rank eligible voluntary donors within $< 50\text{ ms}$ based on distance, blood group compatibility, and past response probability.
5. **Real-Time Operational Dashboard**: Deliver a unified Next.js 14 command center interface with geospatial route topologies and explainable rationale logs.

---

### 2.2 Intelligence Cascade Architecture

```
                       Synthetic Healthcare Simulation Engine (generate_all.py)
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │   data/raw/*.csv    │
                               └──────────┬──────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
 ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
 │ Model 1: Demand    │        │ Model 2: Shortage  │        │ Model 3: Donor     │
 │ Forecasting        │        │ Early Warning      │        │ Ranking & Dispatch │
 └──────────┬─────────┘        └──────────┬─────────┘        └──────────┬─────────┘
            │                             │                             │
            └─────────────────────────────┼─────────────────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ Engine 4: Network Optimization        │
                      │ (Google OR-Tools MILP Solver)         │
                      └───────────────────┬───────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ FastAPI REST Server & Next.js UI      │
                      │ /api/command-center, /api/shortages...│
                      └───────────────────────────────────────┘
```

---

### 2.3 Mathematical Formulation & Methodology

#### 1. Mathematical Notation
* $\mathcal{H} = \{1, \dots, 30\}$: Set of 30 hospitals.
* $\mathcal{B} = \{1, \dots, 10\}$: Set of 10 regional blood banks.
* $\mathcal{V} = \mathcal{H} \cup \mathcal{B}$: All 40 network facilities.
* $\mathcal{G} = \{O^-, O^+, A^-, A^+, B^-, B^+, AB^-, AB^+\}$: Set of 8 blood groups.
* $\mathcal{C} = \{\text{RBC}, \text{Platelets}, \text{Plasma}, \text{Whole\_Blood}\}$: Set of 4 blood components.
* $\mathcal{E} \subset \mathcal{V} \times \mathcal{V}$: Directed road transit corridors (646 edges).
* $I_{i,g,c}$: Available on-shelf inventory of product $(g, c)$ at facility $i$.
* $R_{i,g,c}$: Mandatory safety reserve floor for product $(g, c)$ at facility $i$.
* $\hat{D}_{j,g,c}^{H}$: Model 1 forecasted demand units for hospital $j$ over horizon $H \in \{24\text{h}, 48\text{h}, 72\text{h}\}$.

---

#### 2. Model 1 Formulation (Demand Regression)
For each horizon $H \in \{24\text{h}, 48\text{h}, 72\text{h}\}$:
$$\hat{D}_{j,g,c}^{H} = \max\left(0.0, \sum_{m=1}^{M} f_m(\mathbf{x}_{j,g,c,t})\right)$$
where $f_m \in \mathcal{F}$ represents a decision tree in the XGBoost ensemble, and $\mathbf{x}_{j,g,c,t} \in \mathbb{R}^{75}$ is the feature vector of historical lags ($t-1 \dots t-28$), past rolling statistics (3d, 7d, 14d, 28d mean/std), calendar seasonality, weather/context, and emergency signals.

---

#### 3. Model 2 Formulation (Shortage Classification & Calibration)
$$\hat{P}_{j,g,c}^{H} = \sigma\left(\alpha \cdot \log\left(\frac{\hat{p}_{\text{raw}}}{1 - \hat{p}_{\text{raw}}}\right) + \beta\right)$$
where $\sigma$ is the sigmoid logistic function, $\hat{p}_{\text{raw}}$ is the output of the gradient-boosted decision tree classifier, and $(\alpha, \beta)$ are Platt calibration parameters fit via cross-validation to guarantee empirical probability alignment.

---

#### 4. Model 3 Formulation (Multi-Criteria Donor Scoring)
For each donor $k \in \mathcal{D}$ eligible for target request $(j, g, c)$:
$$\text{Score}_k = 100 \times \left(w_{\text{prox}} \frac{d_{\max} - d_k}{d_{\max}} + w_{\text{resp}} \frac{t_{\max} - t_k}{t_{\max}} + w_{\text{rel}} p_{\text{rel},k} + w_{\text{comp}} m_k + w_{\text{avail}} a_k\right)$$
where $d_k$ is Haversine driving distance in km, $t_k$ is historical response latency, $p_{\text{rel},k}$ is donation completion frequency, $m_k \in \{0.7, 1.0\}$ is blood compatibility match quality, and $a_k \in \{0.5, 1.0\}$ is availability status.

---

#### 5. Engine 4 Formulation (MILP Optimization Engine)

##### Objective Function:
$$\min_{\mathbf{X}, \mathbf{Y}, \mathbf{S}} \sum_{(i,j) \in \mathcal{E}} \sum_{g_s, g_d} \sum_c C_{i,j}^{\text{trans}} X_{i,j,g_s,g_d,c} + \sum_{j \in \mathcal{H}} \sum_{g,c} C^{\text{donor}} Y_{j,g,c} + \sum_{j \in \mathcal{H}} \sum_{g,c} P_{j,g,c}^{\text{short}} S_{j,g,c} - \sum_{(i,j)} \sum_{g_s,g_d,c} B_{i,g_s,c}^{\text{FEFO}} X_{i,j,g_s,g_d,c}$$

##### Key Operational Constraints:
1. **Demand Balance**:
   $$I_{j,g_d,c} + \sum_{i \in \mathcal{V}} \sum_{g_s \in \mathcal{G}} X_{i,j,g_s,g_d,c} + Y_{j,g_d,c} + S_{j,g_d,c} \ge \hat{D}_{j,g_d,c} \quad \forall j \in \mathcal{H}, g_d \in \mathcal{G}, c \in \mathcal{C}$$
2. **Safety Reserve Floor**:
   $$\sum_{j \in \mathcal{V}} \sum_{g_d \in \mathcal{G}} X_{i,j,g_s,g_d,c} \le \max\left(0, I_{i,g_s,c} - R_{i,g_s,c}\right) \quad \forall i \in \mathcal{V}, g_s \in \mathcal{G}, c \in \mathcal{C}$$
3. **Vehicle Cooler Capacity**:
   $$\sum_{g_s, g_d} \sum_c X_{i,j,g_s,g_d,c} \le 200 \quad \forall (i, j) \in \mathcal{E}$$
4. **Donor Candidate Bounds**:
   $$Y_{j,g,c} \le \text{CandidatePool}_{j,g,c} \quad \forall j \in \mathcal{H}, g \in \mathcal{G}, c \in \mathcal{C}$$
5. **Integrity & Bounds**:
   $$X_{i,j,g_s,g_d,c} \in \mathbb{Z}_{\ge 0}, \quad Y_{j,g,c} \in \mathbb{Z}_{\ge 0}, \quad S_{j,g,c} \ge 0$$

---

## 3. Relevance of Algorithms / Techniques (3 Marks)

### 3.1 Why XGBoost for Demand Forecasting (Model 1)?
* **Heterogeneous Tabular Data**: Healthcare blood consumption is tabular, non-linear, and multi-modal. Gradient-boosted decision trees consistently outperform deep neural networks on structured tabular datasets.
* **Regularization & Generalization**: Tree pruning, L1/L2 regularization ($\alpha, \lambda$), and column subsampling prevent overfitting on sparse hospital demand series.
* **Conditional Feature Interactions**: Tree splits naturally capture complex non-linear interaction logic (e.g., *"If day is Monday AND 7-day lag is high AND hospital is Trauma Center $\to$ Predict 14 units"*).

---

### 3.2 Why Calibrated Classification for Shortage Early Warning (Model 2)?
* **Operational Phase Boundaries**: A hospital does not face an acute emergency when stock is slightly reduced; an emergency occurs when stock crosses the critical safety threshold into deficit. Classification directly models this operational boundary.
* **Severe Class Imbalance Handling**: Stockouts represent $< 5\%$ of historical operational records. Standard regression models optimize overall MSE, ignoring rare high-consequence stockouts. XGBoost classification with scale-pos-weight optimization prioritizes the minority critical shortage class.
* **Isotonic Platt Calibration**: Raw model confidence scores are calibrated into true empirical probabilities, ensuring downstream economic optimization receives unbiased risk values.

---

### 3.3 Why MCDA Scoring for Donor Matching (Model 3)?
* **Academic & Scientific Integrity**: Supervised machine learning requires ground-truth labels of historical outreach outcomes. Fabricating synthetic phone-call response records to train an ML classifier would introduce artificial bias.
* **Clinical Transparency & Explainability**: Transfusion officers require fully transparent, deterministic selection criteria (e.g., *"Why was Donor A ranked over Donor B?"*). MCDA provides explicit, auditable utility scores based on proximity, response latency, and eligibility.

---

### 3.4 Why Mixed-Integer Linear Programming for Network Transshipment (Engine 4)?
* **The "Models Predict; Optimization Decides" Principle**: Machine learning models predict demand and risk, but cannot enforce hard physical laws: they output fractional values, ignore vehicle container limits, and fail to guarantee safety reserve floors.
* **Global Mathematical Optimality**: Branch-and-cut MILP algorithms guarantee that the chosen transshipment plan is the single mathematically optimal solution across the entire 40-node network.

---

## Summary of Milestone 2 Evaluation Metrics

| Metric / Aspect | Target Benchmark | LifeLink AI Benchmark Achieved | Status |
| :--- | :---: | :---: | :---: |
| **Model 1 Demand Forecast ($R^2$ Score)** | $> 0.40$ | **$0.464$ (72h Forecast)** | **Exceeded** |
| **Model 2 Shortage Early Warning (ROC-AUC)** | $> 0.80$ | **$0.862$ (72h Forecast)** | **Exceeded** |
| **Engine 4 Solve Runtime** | $< 5.0\text{ s}$ | **$2.18\text{ s}$ (40 Nodes, 646 Edges)** | **Exceeded** |
| **API Endpoints Tested & Validated** | $100\%$ | **12 / 12 Endpoints Passing** | **Exceeded** |
| **Frontend Integration & Build** | Clean Build | **Next.js 14 Production Compiled** | **Exceeded** |
