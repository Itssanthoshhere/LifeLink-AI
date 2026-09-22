# Relevance of Algorithms and Techniques
## Scientific Justification for Model Selection in LifeLink AI

---

## 1. Why XGBoost for Demand Forecasting (Model 1)?
* **Tabular Heterogeneity**: Healthcare blood consumption is tabular, non-linear, and multi-modal. Unlike computer vision or natural language processing, gradient-boosted decision trees consistently outperform deep neural networks on structured tabular datasets.
* **Resistance to Overfitting**: Tree pruning, L1/L2 regularization, and column subsampling prevent the model from memorizing random noise in sparse hospital demand.
* **Lag Interaction Modeling**: Tree splits naturally capture conditional logic (e.g., *"If day is Monday AND 7-day lag is high AND facility is trauma center $\to$ Predict 14 units"*).

---

## 2. Why Calibrated Classification for Shortage Prediction (Model 2)?
* **Operational Binary Thresholds**: A hospital does not face an emergency when stock is slightly low; an emergency occurs when stock crosses the critical safety threshold into negative territory. Classification directly models this operational phase boundary.
* **Handling Rare Events (Class Imbalance)**: Stockouts represent $< 5\%$ of historical data. Standard regression models optimize overall mean squared error, effectively ignoring rare, high-consequence stockouts. XGBoost classification with scale-pos-weight optimization prioritizes the minority critical class.
* **Platt Calibration**: Guarantees that predicted probabilities represent true empirical frequencies, which is vital for downstream cost-benefit optimization.

---

## 3. Why MCDA Instead of Supervised ML for Donor Ranking (Model 3)?
* **Academic Integrity**: Supervised machine learning requires ground-truth labels of historical outreach outcomes. Fabricating fake phone-call response records to train an ML model would constitute scientific fraud.
* **Clinical Transparency**: Transfusion coordinators require fully explainable criteria (e.g., *"Why did you pick Donor A over Donor B?"*). MCDA provides a clear, deterministic utility score with explicit weights.

---

## 4. Why Mixed-Integer Linear Programming for Transshipment (Engine 4)?
* **The "Models Predict; Optimization Decides" Paradigm**: Machine learning models cannot enforce hard physical laws: they generate fractional values, miss global vehicle weight ceilings, and fail to guarantee that source hospitals maintain emergency reserves.
* **Global Mathematical Optimality**: Branch-and-cut MILP algorithms guarantee that the chosen transshipment plan is the single cheapest, fastest, and safest solution possible across the entire 40-node network.
