# LifeLink AI — Beginner-Friendly Data Dictionary
## Complete Field-by-Field Reference Across All Core Tables

> **"Whenever you look at a CSV table or API JSON response and wonder: 'What does this column actually mean?', look it up in this dictionary."**

---

## 1. Table: `hospitals.csv`

| Field Name | Simple Meaning | Technical Definition & Type |
| :--- | :--- | :--- |
| `hospital_id` | Unique ID code for the hospital. | Primary key string (e.g., `"HOSP_007"`). |
| `hospital_name` | Full official name of the hospital. | Descriptive name string (e.g., `"Valley Trauma Center"`). |
| `city` | The metropolitan district where it is located. | City/municipality name string. |
| `latitude` | North-South GPS coordinate on the map. | Floating-point geographic coordinate. |
| `longitude` | East-West GPS coordinate on the map. | Floating-point geographic coordinate. |
| `facility_type` | Level of emergency care provided. | Categorical: `"Tier-1 Trauma Center"`, `"General Hospital"`, `"Specialized Clinic"`. |
| `bed_capacity` | Total inpatient hospital beds available. | Integer count (ranges from 50 to 800 beds). |

---

## 2. Table: `blood_banks.csv`

| Field Name | Simple Meaning | Technical Definition & Type |
| :--- | :--- | :--- |
| `blood_bank_id` | Unique ID code for the regional storage bank. | Primary key string (e.g., `"BANK_001"`). |
| `bank_name` | Name of the central blood distribution hub. | Descriptive name string (e.g., `"Central Metropolitan Blood Bank"`). |
| `latitude` | North-South GPS coordinate. | Floating-point coordinate. |
| `longitude` | East-West GPS coordinate. | Floating-point coordinate. |
| `storage_capacity_units` | Maximum total bags of blood it can refrigerate. | Integer ceiling (ranges from 2,000 to 10,000 units). |

---

## 3. Table: `donors.csv`

| Field Name | Simple Meaning | Technical Definition & Type |
| :--- | :--- | :--- |
| `donor_id` | Unique code for the registered volunteer donor. | Primary key string (e.g., `"DONOR_01421"`). |
| `blood_group` | The donor's biological blood group. | Categorical: `O_NEG`, `O_POS`, `A_NEG`, `A_POS`, `B_NEG`, `B_POS`, `AB_NEG`, `AB_POS`. |
| `latitude` | North-South GPS coordinate of the donor's home. | Floating-point coordinate. |
| `longitude` | East-West GPS coordinate of the donor's home. | Floating-point coordinate. |
| `last_donation_date` | The date the person last gave blood. | ISO 8601 Date string (`YYYY-MM-DD`). Used to check the 90-day rest rule. |
| `eligible` | Whether the person is medically cleared to donate. | Boolean: `True` (healthy/cleared) or `False` (medical deferral). |
| `availability` | Whether the person is free right now. | Categorical: `"Available"` (ready), `"Busy"` (at work), `"Inactive"` (away). |
| `donation_count` | Total lifetime donations completed by this person. | Integer count of previous successful donations. |
| `response_probability` | Historical likelihood that this person answers calls. | Probability float between $0.0$ and $1.0$. |
| `average_response_time_minutes` | How many minutes they usually take to respond. | Floating-point minutes (ranges from 10 to 60 minutes). |

---

## 4. Table: `inventory_batches.csv`

| Field Name | Simple Meaning | Technical Definition & Type |
| :--- | :--- | :--- |
| `batch_id` | Unique barcode tracking this specific bag of blood. | Primary key string (e.g., `"BATCH_04812"`). |
| `location_id` | Which hospital or blood bank holds this bag. | Foreign key to `hospital_id` or `blood_bank_id`. |
| `location_type` | Whether it is sitting in a hospital or a blood bank. | Categorical: `"hospital"` or `"blood_bank"`. |
| `blood_group` | Blood type in the bag. | Categorical blood group string. |
| `component` | Which part of the blood is in this bag. | Categorical: `"RBC"`, `"Platelets"`, `"Plasma"`, `"Whole_Blood"`. |
| `units` | Number of volume units in this batch. | Integer count (standard unit = 1 bag $\approx 450\text{ mL}$). |
| `collection_date` | When the blood was collected from the donor. | ISO 8601 Date string (`YYYY-MM-DD`). |
| `expiry_date` | The exact date after which this blood spoils. | ISO 8601 Date string (`YYYY-MM-DD`). |
| `days_to_expiry` | How many days are left before this blood goes bad. | Calculated integer: $\text{expiry\_date} - \text{current\_date}$. |
| `status` | Current availability of the blood bag. | Categorical: `"available"`, `"reserved"`, `"expired"`. |

---

## 5. Table: `transport_network.csv`

| Field Name | Simple Meaning | Technical Definition & Type |
| :--- | :--- | :--- |
| `route_id` | Unique code for the road delivery corridor. | Primary key string (e.g., `"RT-082"`). |
| `source_facility` | Where the courier vehicle picks up the blood. | Foreign key string (e.g., `"HOSP_005"`). |
| `destination_facility` | Where the courier vehicle delivers the blood. | Foreign key string (e.g., `"HOSP_007"`). |
| `distance_km` | Estimated driving distance along city streets. | Floating-point kilometers (includes 1.25 road tortuosity factor). |
| `travel_time_minutes` | Expected courier driving time under normal traffic. | Calculated floating-point minutes at 35 km/h average speed. |
| `max_vehicle_capacity` | Maximum blood boxes the delivery van can carry. | Hard integer capacity ceiling (200 units). |
| `is_active` | Whether this road is open or closed. | Boolean: `True` (open) or `False` (closed due to storm/flooding). |
