# LifeLink AI — Glossary of Technical Terms
## Technical Term $\to$ Plain-English Meaning

> **"Whenever you encounter an acronym, mathematical abbreviation, or technical term in this project, use this table to find an immediate, plain-English explanation."**

---

| Technical Term | Abbreviation | Plain-English Meaning | Where It Is Used in LifeLink AI |
| :--- | :---: | :--- | :--- |
| **Artificial Intelligence** | **AI** | A computer system that performs tasks typically requiring human intelligence, such as recognizing complex patterns and predicting future outcomes. | The overall system philosophy. |
| **Machine Learning** | **ML** | A branch of AI where computer algorithms learn statistical patterns from historical data rather than following rigid, hand-written rules. | Powers Model 1 (Forecasting) and Model 2 (Shortage Alarms). |
| **Extreme Gradient Boosting** | **XGBoost** | A powerful machine-learning algorithm that combines hundreds of small, simple "decision trees" into an ensemble, where each new tree corrects the errors made by previous trees. | The underlying model for Model 1 and Model 2. |
| **Demand Forecasting** | — | Estimating the numerical amount of a resource (e.g., blood bags) that patients will consume over upcoming days. | Handled by Model 1. |
| **Shortage Prediction** | — | Estimating the probability that a hospital's inventory will drop below its minimum safe threshold within a specific timeframe. | Handled by Model 2. |
| **Multi-Criteria Decision Analysis** | **MCDA** | A structured mathematical method for evaluating and ranking a list of options based on multiple competing factors (e.g., distance, response speed, availability). | Handled by Model 3 (Donor Matching). |
| **Operations Research** | **OR** | The scientific discipline of applying mathematical methods and optimization to make better logistical and operational decisions. | The foundation of Engine 4. |
| **Mixed-Integer Linear Programming** | **MILP** | A mathematical optimization technique that finds the best possible outcome (e.g., lowest cost or fewest shortages) while obeying strict linear rules and requiring certain variables (like blood bags or trucks) to be whole integer numbers. | The mathematical formulation of Engine 4. |
| **Optimization** | — | The process of finding the mathematically best possible decision among millions of alternatives while respecting strict real-world limits. | Handled by Engine 4 via Google OR-Tools. |
| **Constraint** | — | A mandatory rule that an optimization model is strictly forbidden from breaking (e.g., a truck cannot carry more than 200 bags; a hospital cannot give A-blood to an O-patient). | Enforced by Engine 4. |
| **Objective Function** | — | The mathematical goal that the optimization engine is trying to minimize or maximize (e.g., minimize unmet shortages and transport time). | The target equation solved by Engine 4. |
| **Decision Variables** | — | The unknown values that the optimization model must solve for (e.g., *"How many units should be moved from Hospital 5 to Hospital 7?"*). | Calculated by Engine 4. |
| **First-Expire, First-Out** | **FEFO** | An inventory management rule stating that products closest to their expiration date must be used or shipped first to prevent waste. | Prioritized by Engine 4 to rescue blood bags. |
| **Safety Reserve Floor** | — | A minimum buffer of emergency blood units that a facility must keep on its shelves at all times to protect its own local patients. | Preserved by Engine 4 during transfers. |
| **Application Programming Interface** | **API** | A software messenger that allows the web dashboard to send requests to the Python backend and receive structured data in response. | Implemented using FastAPI. |
| **FastAPI** | — | A modern, high-speed Python web framework used to build REST APIs. | Serves the 12 backend endpoints. |
| **Next.js** | — | A popular React-based web development framework used to build fast, interactive user interfaces. | Powers the operations web dashboard. |
| **Synthetic Data** | — | Artificially generated data created by a computer simulation to mimic real-world patterns without exposing real human private medical records. | The entire data foundation of LifeLink AI. |
| **Personally Identifiable Information** | **PII / PHI** | Protected personal or health data belonging to real human beings (names, medical histories, phone numbers). | **Zero PII/PHI** is used in this project. |
| **Mean Absolute Error** | **MAE** | The average absolute difference between predicted numbers and actual outcomes. If MAE is 1.2, predictions are off by an average of 1.2 blood units. | Used to evaluate Model 1. |
| **Root Mean Squared Error** | **RMSE** | Similar to MAE, but penalizes large forecasting mistakes much more heavily by squaring the errors before averaging them. | Used to evaluate Model 1. |
| **Weighted Absolute Percentage Error** | **WAPE** | Total absolute errors divided by total actual demand. Measures overall percentage volume mismatch. | Used to evaluate Model 1. |
| **Coefficient of Determination** | **$R^2$** | A statistical score showing how much of the variation in the data is captured by the model relative to a simple average baseline. | Used to evaluate Model 1 ($R^2 \approx 0.46$). |
| **Receiver Operating Characteristic Area Under Curve** | **ROC-AUC** | A score between 0.5 and 1.0 measuring a classification model's ability to distinguish between shortage and non-shortage events across all possible decision thresholds. | Used to evaluate Model 2 (Score: 0.85 to 0.86). |
| **Precision-Recall Area Under Curve** | **PR-AUC** | A vital metric for rare events measuring the trade-off between false alarms (Precision) and missed crises (Recall). Superior to ROC-AUC for imbalanced data. | Used to evaluate Model 2 (Score: 0.19 to 0.37). |
| **Probability Calibration** | — | Adjusting a model's predicted probabilities so that an 80% risk score truly corresponds to an 80% real-world chance of a shortage occurring. | Applied to Model 2 via Platt/Isotonic methods. |
| **Brier Score** | — | A mathematical measure of how accurate probabilistic predictions are (lower is better; 0.0 is perfect accuracy). | Evaluates Model 2 calibration ($< 0.075$). |
| **Class Imbalance** | — | A dataset situation where one outcome is very rare compared to another (e.g., blood shortages occur on less than 5% of hospital days). | Handled by Model 2's weighting algorithms. |
| **Inter-Donation Interval** | — | The mandatory medical waiting period between blood donations (at least 90 days for whole blood) to protect the donor's health. | Strictly enforced by Model 3. |
| **Red Blood Cells** | **RBC** | Blood cells carrying oxygen. Used in surgeries and trauma resuscitation. Shelf life: 35–42 days. | Tracked across all 8 blood groups. |
| **Platelets** | — | Cell fragments responsible for clotting blood. Highly perishable. Shelf life: only 5–7 days. | Tracked across all 8 blood groups. |
| **Fresh Frozen Plasma** | **FFP** | Liquid portion of blood containing clotting factors. Frozen shelf life: up to 1 year. | Tracked across all 8 blood groups. |
| **Haversine Distance** | — | The mathematical formula used to calculate great-circle direct distances between two GPS coordinates on the Earth's surface. | Used to estimate travel distances in Model 3. |
| **Road Tortuosity Factor** | — | A multiplier (1.25 in this project) applied to straight-line distance to estimate realistic driving distance along winding city streets. | Used in transit time calculations. |
| **Human-in-the-Loop** | **HITL** | A system architecture where automated algorithms generate recommendations, but a human operator must review and authorize any real-world action. | The core safety policy of LifeLink AI. |
