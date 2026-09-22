# LifeLink AI — Scientific & Technical Methodology
## Complete Mathematical Formulation of the Intelligence Cascade

---

## 1. Mathematical Notation

* $\mathcal{H} = \{1, \dots, 30\}$: Set of hospitals.
* $\mathcal{B} = \{1, \dots, 10\}$: Set of regional blood banks.
* $\mathcal{V} = \mathcal{H} \cup \mathcal{B}$: All 40 facilities.
* $\mathcal{G} = \{O^-, O^+, A^-, A^+, B^-, B^+, AB^-, AB^+\}$: Set of 8 blood groups.
* $\mathcal{C} = \{\text{RBC}, \text{Platelets}, \text{Plasma}, \text{Whole\_Blood}\}$: Set of 4 components.
* $\mathcal{E} \subset \mathcal{V} \times \mathcal{V}$: Directed transit corridors (646 edges).
* $I_{i,g,c}$: On-shelf inventory of product $(g, c)$ at facility $i$ at time $t$.
* $R_{i,g,c}$: Mandatory safety reserve floor for product $(g, c)$ at facility $i$.
* $\hat{D}_{j,g,c}$: Model 1 forecasted demand units needed by hospital $j$.

---

## 2. Model 1 Formulation (Demand Regression)

For each horizon $H \in \{24\text{h}, 48\text{h}, 72\text{h}\}$:
$$\hat{D}_{j,g,c}^{H} = \max\left(0.0, \sum_{m=1}^{M} f_m(\mathbf{x}_{j,g,c,t})\right)$$
where $f_m \in \mathcal{F}$ represents a decision tree in the XGBoost ensemble, and $\mathbf{x}_{j,g,c,t} \in \mathbb{R}^{75}$ is the feature vector of historical lags, rolling statistics, calendar seasonality, and trauma flags.

---

## 3. Model 2 Formulation (Shortage Classification)

$$\hat{P}_{j,g,c}^{H} = \sigma\left(\alpha \cdot \log\left(\frac{\hat{p}_{\text{raw}}}{1 - \hat{p}_{\text{raw}}}\right) + \beta\right)$$
where $\sigma$ is the sigmoid logistic function, $\hat{p}_{\text{raw}}$ is the output of the gradient-boosted decision tree ensemble, and $(\alpha, \beta)$ are Platt calibration parameters fit via cross-validation.

---

## 4. Model 3 Formulation (MCDA Scoring)

For each donor $k \in \mathcal{D}$ eligible for target request $(j, g, c)$:
$$\text{Score}_k = 100 \times \left(w_{\text{prox}} \frac{d_{\max} - d_k}{d_{\max}} + w_{\text{resp}} \frac{t_{\max} - t_k}{t_{\max}} + w_{\text{rel}} p_{\text{rel},k} + w_{\text{comp}} m_k + w_{\text{avail}} a_k\right)$$
where $d_k$ is the driving distance in km, $t_k$ is historical response latency, $p_{\text{rel},k}$ is donation completion frequency, $m_k \in \{0.7, 1.0\}$ is compatibility match quality, and $a_k \in \{0.5, 1.0\}$ is availability status.

---

## 5. Engine 4 Formulation (MILP Optimization)

### Objective Function:
$$\min_{\mathbf{X}, \mathbf{Y}, \mathbf{S}} \sum_{(i,j) \in \mathcal{E}} \sum_{g_s, g_d} \sum_c C_{i,j}^{\text{trans}} X_{i,j,g_s,g_d,c} + \sum_{j \in \mathcal{H}} \sum_{g,c} C^{\text{donor}} Y_{j,g,c} + \sum_{j \in \mathcal{H}} \sum_{g,c} P_{j,g,c}^{\text{short}} S_{j,g,c} - \sum_{(i,j)} \sum_{g_s,g_d,c} B_{i,g_s,c}^{\text{FEFO}} X_{i,j,g_s,g_d,c}$$

### Constraints:
1. **Demand Balance**:
   $$I_{j,g_d,c} + \sum_{i \in \mathcal{V}} \sum_{g_s \in \mathcal{G}} X_{i,j,g_s,g_d,c} + Y_{j,g_d,c} + S_{j,g_d,c} \ge \hat{D}_{j,g_d,c} \quad \forall j \in \mathcal{H}, g_d \in \mathcal{G}, c \in \mathcal{C}$$
2. **Safety Reserve Floor**:
   $$\sum_{j \in \mathcal{V}} \sum_{g_d \in \mathcal{G}} X_{i,j,g_s,g_d,c} \le \max\left(0, I_{i,g_s,c} - R_{i,g_s,c}\right) \quad \forall i \in \mathcal{V}, g_s \in \mathcal{G}, c \in \mathcal{C}$$
3. **Vehicle Capacity**:
   $$\sum_{g_s, g_d} \sum_c X_{i,j,g_s,g_d,c} \le 200 \quad \forall (i, j) \in \mathcal{E}$$
4. **Donor Pool Upper Bound**:
   $$Y_{j,g,c} \le \text{CandidatePool}_{j,g,c} \quad \forall j \in \mathcal{H}, g \in \mathcal{G}, c \in \mathcal{C}$$
5. **Integer Variables**:
   $$X_{i,j,g_s,g_d,c} \in \mathbb{Z}_{\ge 0}, \quad Y_{j,g,c} \in \mathbb{Z}_{\ge 0}, \quad S_{j,g,c} \ge 0$$
