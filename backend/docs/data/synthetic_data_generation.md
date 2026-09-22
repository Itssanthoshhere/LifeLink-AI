# Synthetic Data Generation Methodology
## Mathematical and Statistical Modeling of Regional Healthcare Networks

---

## 1. Simulation Engine Architecture

The synthetic healthcare simulator (`src/simulation_generator.py`) generates a consistent, unified multi-echelon network using reproducible statistical processes:

```
[ Random Seed = 42 ]
         │
         ├───▶ 1. Spatial Topology Generation (40 Facilities, 646 Road Corridors)
         ├───▶ 2. Donor Population Synthesis (5,000 Donors, Gaussian Clusters)
         ├───▶ 3. Hospital Demand Processes (Poisson Surgical & Trauma Demands)
         ├───▶ 4. Perishable Batch Tracking (FEFO Aging, Expiry Degradation)
         └───▶ 5. Environmental & Trauma Context (Calendar, Weather, Disasters)
```

---

## 2. Hospital Demand Generation (Non-Homogeneous Poisson Processes)

Hospital daily consumption is modeled as a non-homogeneous Poisson process whose rate parameter $\lambda_{h,g,c}(t)$ varies dynamically:

$$\lambda_{h,g,c}(t) = \text{BaseRate}_{h,c} \times \text{BloodGroupFreq}_g \times \text{DayOfWeekFactor}(t) \times \text{Seasonality}(t) \times \text{TraumaMultiplier}(t)$$

1. **Hospital Archetypes**:
   - **Tier-1 Trauma Centers (6 facilities)**: $\text{BaseRate} = 12 \text{ to } 18 \text{ units/day}$. High RBC consumption, high volatility.
   - **General Community Hospitals (14 facilities)**: $\text{BaseRate} = 4 \text{ to } 8 \text{ units/day}$. Steady surgical consumption.
   - **Specialized Pediatric / Cancer Clinics (10 facilities)**: $\text{BaseRate} = 1 \text{ to } 3 \text{ units/day}$. High platelet consumption.
2. **Weekly Seasonality**: Monday–Thursday factors = $1.15$ (elective surgeries); Saturday–Sunday factors = $0.70$ (emergency surgeries only).
3. **Emergency Disasters**: Random trauma incidents introduce sudden localized multiplier impulses ($3.0\times$ to $5.0\times$) concentrated in specific trauma centers.

---

## 3. Spatial Network Topology & Transit Modeling

* **Geographic Space**: Facilities and donors are distributed across an $80 \times 80 \text{ km}$ metropolitan grid centered at coordinates $(12.9716, 77.5946)$.
* **Road Tortuosity Multiplier**: Straight-line Haversine distance is multiplied by **1.25** to reflect actual winding metropolitan road networks.
* **Transit Speed**: Couriers are modeled moving at an average metropolitan delivery speed of **35 km/h**, yielding realistic travel times of 5 to 60 minutes across the 646 transit corridors.
