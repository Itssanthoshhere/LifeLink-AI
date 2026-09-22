# LifeLink AI — Dataset Architecture & Simulation Documentation
## Comprehensive Overview of the 40-Node Healthcare Simulation Repository

> **"This project does NOT use real patient medical records. We explain why synthetic data is essential for responsible healthcare research, and how our 2-year simulation was calibrated to realistic medical literature."**

---

## 1. Why Synthetic Data Was Used

In healthcare artificial intelligence research, using real clinical data presents severe ethical, legal, and operational obstacles:
1. **Patient Privacy & Legal Protections**: Real patient blood transfusions and donor records are strictly protected under HIPAA (United States), GDPR (European Union), and national medical confidentiality laws. Using real patient records in an open academic project is legally and ethically unacceptable.
2. **Extreme Edge-Case Scarcity**: Real hospitals experience severe disasters (e.g., a regional cooling failure or a 100-car pileup) very rarely. Waiting for a real disaster to test software would take decades.
3. **Reproducibility**: To allow external examiners, professors, and peer researchers to verify every calculation, the dataset must be 100% reproducible.

### The Solution: A Fixed Random Seed (`Seed = 42`)
All nine relational CSV datasets in this project were generated using a deterministic Python simulation engine with a fixed random seed (`42`). Anyone running the code on any computer in the world will generate the exact same byte-for-byte dataset!

---

## 2. The 9 Relational Datasets

```
                                    RELATIONAL DATA SCHEMA
                                              │
         ┌────────────────────────────┬───────┴────────────────────┬────────────────────────────┐
         ▼                            ▼                            ▼                            ▼
  [ Facilities & Topology ]    [ Products & Batches ]       [ Patient Demand ]           [ Human Donors ]
  - hospitals.csv              - inventory_batches.csv      - daily_demand.csv           - donors.csv
  - blood_banks.csv                                         - blood_requests.csv
  - transport_network.csv                                   - emergency_events.csv
                                                            - events_context.csv
```

1. **`hospitals.csv` (30 rows)**: Contains hospital ID, name, city, latitude, longitude, facility type (Tier-1 Trauma Center, General Hospital, Clinic), and bed capacity.
2. **`blood_banks.csv` (10 rows)**: Centralized storage and distribution hubs holding regional reserve buffers.
3. **`transport_network.csv` (646 rows)**: Directed transit corridors connecting facilities, with Haversine distances, road tortuosity multipliers (1.25), transit times (at 35 km/h), and vehicle capacity limits (200 units).
4. **`inventory_batches.csv` (34 MB)**: Granular blood bag records tracking batch ID, facility location, blood group, component type, collection date, expiration date, and status (`available`, `reserved`, `expired`).
5. **`daily_demand.csv` (10 MB)**: Aggregated daily consumption records across all 960 time-series over 730 days (2024-01-01 through 2025-12-31).
6. **`blood_requests.csv` (26 MB)**: Transaction-level clinical transfusion requests issued by hospital operating rooms.
7. **`emergency_events.csv` (42 KB)**: Simulated disaster incident logs (traffic pileups, industrial accidents, building fires) with GPS coordinates and severity scores.
8. **`events_context.csv` (44 KB)**: Daily contextual signals including weather classifications (Clear, Rain, Storm), temperature anomalies, and national holiday indicators.
9. **`donors.csv` (375 KB)**: 5,000 registered volunteer donor profiles with blood groups, GPS coordinates, historical donation counts, response probabilities, and last donation timestamps.

---

## 3. Medical Realism Calibration

The simulation was not generated randomly; it was carefully calibrated against empirical transfusion medicine literature:
* **Blood Group Distribution**: Matches standard global biological frequencies:
  - $O^+$: 38.0% | $A^+$: 34.0% | $B^+$: 9.0% | $O^-$: 7.0%
  - $A^-$: 6.0% | $AB^+$: 3.0% | $B^-$: 2.0% | $AB^-$: 1.0%
* **Component Shelf Lives**:
  - Platelets: Exactly **5 days** ($120\text{ hours}$).
  - Red Blood Cells: Exactly **42 days**.
  - Plasma: **365 days**.
* **Inter-Donation Waiting Period**: Minimum **90 days** enforced between consecutive whole blood donations.
