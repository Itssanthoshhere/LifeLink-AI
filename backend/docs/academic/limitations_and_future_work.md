# Limitations and Future Work
## Candid Academic Appraisal of Current Boundaries and Next Steps

---

## 1. Explicit Current Limitations

1. **Synthetic Simulation Foundation**:
   - The system is trained and evaluated on synthetic data generated via Poisson demand and Gaussian spatial models. While calibrated to clinical blood-banking literature, real-world healthcare environments involve idiosyncratic physician transfusion preferences and unexpected inventory discrepancies.
2. **Absence of Live GPS Telemetry**:
   - Transit times are calculated using straight-line Haversine distance, a 1.25 road tortuosity factor, and a fixed 35 km/h metropolitan speed. Real-world conditions involve dynamic rush-hour traffic jams, weather delays, and construction closures.
3. **Absence of Historical Donor Outreach Logs**:
   - Model 3 uses multi-criteria heuristic scoring rather than supervised machine learning due to the absence of empirical telephone response logs in the synthetic data.
4. **Deterministic MILP Formulation**:
   - Engine 4 currently solves a single-scenario deterministic MILP taking expected demand as a fixed input. It does not yet model multi-stage stochastic recourse.
5. **Static Hospital Geodesics**:
   - Assumes fixed coordinates without intermediate cross-docking distribution hubs.

---

## 2. Future Improvements & Research Directions

1. **Real-World HL7 / FHIR EHR Streaming**:
   - Connect the FastAPI backend to real-world Electronic Health Record (EHR) systems and Blood Bank Laboratory Information Systems (LIS) via HL7 FHIR standards.
2. **Live Traffic API Integration**:
   - Integrate the Google Maps Distance Matrix API to update road corridor transit times dynamically based on real-time traffic telemetry.
3. **Two-Stage Stochastic Programming with Recourse**:
   - Extend Engine 4 to optimize over a probability distribution of demand outcomes rather than a single point forecast.
4. **Supervised Donor Conversion Modeling**:
   - Log empirical call-center response telemetry to train and validate the existing `MLDonorRanker` supervised interface.
