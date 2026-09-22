# Model 1 — Detailed Evaluation Report
## Comparative Benchmark: Baseline Models vs. XGBoost Regressor

---

## 1. Evaluation Protocol

To demonstrate that Model 1 provides genuine predictive value, its performance was benchmarked against two standard industry baselines on the exact same unseen out-of-time test dataset (70,080 test observations):
1. **Naive 7-Day Baseline**: Predicts that demand on day $t$ will be identical to demand on day $t-7$ (capturing weekly periodic habits).
2. **Rolling 14-Day Mean Baseline**: Predicts the simple arithmetic moving average of the past 14 days.
3. **Model 1 (XGBoost Regressor)**: Full gradient-boosted decision tree ensemble with 75 engineered tabular features.

---

## 2. Comparative Benchmark Results

### 24-Hour Prediction Horizon ($t+1$)

| Model Strategy | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | $R^2$ Score | Performance Gain vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Naive 7-Day Baseline** | 1.842 units | 3.651 units | 0.112 | — |
| **Rolling 14-Day Mean** | 1.488 units | 2.894 units | 0.285 | +19.2% MAE improvement |
| **Model 1 (XGBoost)** | **1.209 units** | **2.417 units** | **0.459** | **+34.4% MAE improvement** |

### 48-Hour Prediction Horizon ($t+2$)

| Model Strategy | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | $R^2$ Score | Performance Gain vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Naive 7-Day Baseline** | 1.845 units | 3.654 units | 0.110 | — |
| **Rolling 14-Day Mean** | 1.491 units | 2.898 units | 0.283 | +19.2% MAE improvement |
| **Model 1 (XGBoost)** | **1.211 units** | **2.415 units** | **0.460** | **+34.3% MAE improvement** |

### 72-Hour Prediction Horizon ($t+3$)

| Model Strategy | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | $R^2$ Score | Performance Gain vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Naive 7-Day Baseline** | 1.841 units | 3.649 units | 0.113 | — |
| **Rolling 14-Day Mean** | 1.486 units | 2.891 units | 0.286 | +19.3% MAE improvement |
| **Model 1 (XGBoost)** | **1.206 units** | **2.399 units** | **0.464** | **+34.5% MAE improvement** |

---

## 3. Analysis & Key Takeaways

1. **Massive Error Reduction**: Model 1 outperforms the naive 7-day cyclical baseline by **34.4% in MAE** and reduces large forecasting outliers (RMSE) by **33.8%**.
2. **Superiority Over Moving Averages**: While a 14-day rolling mean smooths out random noise, it fails to anticipate weekend surgical dips and sudden trauma surges. Model 1's non-linear decision trees capture multi-variable interactions that linear moving averages miss.
3. **Stability Across Horizons**: Error metrics remain virtually flat across 24h, 48h, and 72h horizons, proving that the multi-horizon direct training strategy successfully prevents error compounding over multi-day operations.
