# HARVEST ZERO — Intelligent Post-Harvest Loss Prevention & Distribution Optimization

> **BYTEATHON 2026 — Track BYTE01: Agriculture & Food Supply Chain**  
> Department of Computer Science and Engineering, Noorul Islam Centre for Higher Education

---

## 1. Project Overview

**HARVEST ZERO** is a decision-support and dynamic cold-chain optimization platform designed to eliminate agricultural food waste between harvest and consumption. 

In India alone, post-harvest fruit and vegetable losses range from **6.02% to 15.88%** annually (NABCONS / ICAR-CIPHET), representing over ₹31,486 crore in economic degradation. HARVEST ZERO tackles this through:
1. **Dynamic Arrhenius Shelf-Life Modeling:** Calculating non-linear biochemical decay based on real-time temperature and humidity telemetry.
2. **Quality-Driven Dynamic Rerouting:** Autonomously recalculating delivery destinations when transit delays or thermal stress jeopardize perishable payloads.
3. **Continuous Secondary-Market Arbitrage:** Automatically diverting sub-prime produce to secondary processing buyers (e.g., puree, sauce, juice manufacturers) before biological expiration.
4. **Micro-Climate FEFO Dispatch:** Transitioning from static FIFO queues to First-Expired-First-Out dispatch based on farm-level storage conditions (ambient heap vs cold room).

---

## 2. Technology Stacka

- **Frontend:** Next.js (App Router, React 19, TypeScript)
- **Styling & Design System:** Tailwind CSS with CSS Variables adhering to `.agents/skills/ui-ux-pro-max/` (Organic Biophilic + Technical Precision)
- **Icons:** Lucide React (vector-only, WCAG contrast compliant, no emoji icons)
- **Backend:** Python FastAPI with Uvicorn
- **Configuration & Validation:** Pydantic v2 & Pydantic-Settings
- **Database:** Supabase PostgreSQL (PostgREST, Row Level Security, Relational Schema)
- **Automation (Step 10):** n8n Event-Driven Orchestration Webhooks

---

## 3. Database Architecture (Step 2)

The platform is built on 6 core relational tables designed for multi-echelon agricultural logistics:

| Table | Description | Key Fields & Constraints |
| :--- | :--- | :--- |
| `farmers` | Smallholder farmers & regional clusters | `id`, `name`, `phone`, `location`, `storage_type` (`ambient_heap`, `ventilated_shed`, `cold_storage`) |
| `produce_batches` | Harvested crops with shelf life | `id`, `farmer_id` (FK), `crop_type`, `quantity_kg`, `initial_shelf_life_days`, `remaining_shelf_life_days`, `status` |
| `buyers` | Dual-tier buyers (retail & processors) | `id`, `name`, `type` (`primary_retail`, `secondary_processor`), `demand_crop`, `demand_kg`, `offered_price_per_kg` |
| `storage_facilities` | Cold chain hubs & warehouses | `id`, `name`, `location`, `total_capacity_kg`, `current_utilization_kg`, `temperature_celsius`, `humidity_pct` |
| `transport_vehicles` | Logistics fleet with IoT telemetry | `id`, `vehicle_number` (UNIQUE), `max_payload_kg`, `is_refrigerated`, `current_temp_celsius`, `current_humidity_pct`, `status` |
| `shipments` | Consignments with dynamic rerouting | `id`, `batch_id` (FK), `vehicle_id` (FK), `destination_buyer_id` (FK), `original_buyer_id` (FK), `spoilage_risk_score`, `status` |

---

## 4. Setup & Running Instructions

### Step 4.1 — Backend Setup (FastAPI)

1. Activate the Python virtual environment:
   ```bash
   cd backend
   source venv/bin/activate
   ```
2. Start the FastAPI development server:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   - **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
   - **Database Verification:** [http://localhost:8000/api/db-verify](http://localhost:8000/api/db-verify)

### Step 4.2 — Frontend Setup (Next.js)

1. Start the Next.js development server:
   ```bash
   cd frontend
   npm run dev -- -p 3000
   ```
   - **Dashboard UI:** [http://localhost:3000](http://localhost:3000)

---

## 5. Verification & Testing

### 1. Database Full Round-Trip Verification Script
Run the automated verification script from workspace root:
```bash
PYTHONPATH=. backend/venv/bin/python3 backend/scripts/verify_db.py
```
**Output:**
```
============================================================
HARVEST ZERO — SUPABASE DATABASE VERIFICATION
============================================================
✓ Supabase Client initialized.

--- 1. Testing READ operations across all 6 tables ---
  ✓ Table 'farmers': Readable (3 rows found)
  ✓ Table 'produce_batches': Readable (3 rows found)
  ✓ Table 'buyers': Readable (4 rows found)
  ✓ Table 'storage_facilities': Readable (2 rows found)
  ✓ Table 'transport_vehicles': Readable (3 rows found)
  ✓ Table 'shipments': Readable (1 rows found)

--- 2. Testing WRITE operations (Insert -> Read -> Delete) ---
  ✓ INSERT successful: Created test farmer
  ✓ SELECT successful: Retrieved inserted record verified.
  ✓ DELETE successful: Cleaned up test record.

============================================================
SUCCESS: Full Read & Write Verification Passed for all 6 tables!
============================================================
```

### 2. Automated Pytest Test Suite
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests/ -v
```
All 22 test cases verify health, database connection, reading from all 6 endpoints, batch lifecycle, Step 4 distribution constraints, Step 5 Arrhenius degradation kinetics, Step 6 Dynamic Rerouting, and Step 7 Secondary Market Arbitrage & Food Safety.

---

## 6. Step 3 — Inventory Dashboard Endpoints

- `GET /api/inventory/summary` — Aggregate metrics (total produce kg, average shelf life, buyer demand, storage utilization %, and vehicle fleet payload).
- `GET /api/produce-batches` — Full list of produce batches with joined farmer records.
- `POST /api/produce-batches` — Register a new produce batch with harvest date, shelf life, and storage condition.
- `PATCH /api/produce-batches/{id}` — Update batch status, remaining shelf life, or storage condition.
- `DELETE /api/produce-batches/{id}` — Remove or archive a batch.
- `GET /api/buyers` — Primary retail and secondary processor demand matrix.
- `GET /api/storage-facilities` — Cold storage capacity, temperature, and humidity telemetry.
- `GET /api/transport-vehicles` — Fleet payload, refrigeration specs, and real-time sensor metrics.

---

## 7. Step 4 — Distribution Engine (FEFO + Multi-Constraint Matching)

- `GET /api/distribution/recommend` — Autonomously matches inventory produce batches with buyer demand and available logistics fleet.
- `POST /api/distribution/simulate` — Runs custom simulation scenarios with injected batches, buyers, and vehicles.

### Key Logic & Constraints:
1. **First-Expired-First-Out (FEFO) Micro-Climate Prioritization:** Batches stored in `ambient_heap` or with lower remaining shelf life are prioritized first for immediate dispatch before cold-stored goods.
2. **Shelf-Life Safety Threshold:** Ensures $\text{remaining\_shelf\_life} \ge \text{transit\_days} + \text{buyer\_buffer\_days}$.
3. **Vehicle Capacity & Demand Caps:** Strict constraint checking guarantees payload limits and buyer crop requirements are never exceeded.
4. **Economic Margin Optimization:** Calculates gross revenue minus transit freight costs ($\text{base freight} + \text{₹/km} \times \text{distance}$) and provides transparent decision rationales.

---

## 8. Step 5 — Spoilage-Risk Engine (Arrhenius Biological Kinetics)

- `GET /api/spoilage/crops` — Empirical crop kinetics database ($E_a$, $T_{\text{ref}}$, $k_{\text{ref}}$, optimal moisture bounds).
- `POST /api/spoilage/evaluate` — Evaluates real-time biological deterioration and Arrhenius acceleration rate for any crop under ambient or vehicle telemetry.
- `POST /api/spoilage/simulate-temperature-spike` — Simulates active refrigeration failure (thermal spike), comparing baseline cold chain against elevated thermal stress.
- `GET /api/spoilage/live-assessments` — Evaluates dynamic Arrhenius decay across all active batches in Supabase.

### Arrhenius Kinetic Formulation:
$$k(T) = k_{\text{ref}} \cdot \exp\left(-\frac{E_a}{R} \left(\frac{1}{T} - \frac{1}{T_{\text{ref}}}\right)\right)$$
$$\alpha(T) = \frac{k(T)}{k_{\text{ref}}}$$
- **Demonstration Assumptions:** Reactions are modeled under pseudo-first-order degradation kinetics. Crop kinetic parameters ($E_a$, $T_{\text{ref}}$, $k_{\text{ref}}$) are calibrated from USDA Agricultural Handbook 66 and published post-harvest literature.
- **Thermal Sensitivity:** High activation energy crops (e.g. Mango at $68\text{ kJ/mol}$, Tomato at $58\text{ kJ/mol}$) accelerate decay exponentially ($>7\times$ at $36^\circ\text{C}$), triggering dynamic rerouting flags before cargo write-off occurs.

---

## 9. Step 6 — Dynamic Rerouting Engine (Quality-Driven Diversion)

- `GET /api/shipments/active` — Active consignments in transit with real-time telemetry and destination buyers.
- `POST /api/rerouting/evaluate/{shipment_id}` — Evaluates whether a live shipment requires diversion under current or simulated thermal stress.
- `POST /api/rerouting/simulate-spike-and-reroute` — Simulates in-transit cooling breakdown and tests alternative candidate buyer diversion.
- `POST /api/rerouting/confirm/{shipment_id}` — Persists the autonomous rerouting decision directly to Supabase (`status = 'rerouted'`, updated destination buyer, and audit reason).

---

## 10. Step 7 — Secondary-Market Recovery & Arbitrage Protocol

- `GET /api/secondary/buyers` — Industrial processors (puree, paste, juice, dehydration, starch) registered in the network.
- `POST /api/secondary/arbitrage-evaluate` — Evaluates real-time economic spread between primary supermarket contracts and secondary processor off-take.
- `GET /api/secondary/benchmark-scenarios` — Pre-computed comparison benchmarks (Scenario A: Diversion Beneficial vs Scenario B: Maintain Retail).

### Quality Penalty & Food Safety Framework:
1. **Quality Tiers:**
   - **Grade A (Prime Fresh):** Display buffer $\ge 48\text{h}$ $\rightarrow$ 0% penalty (100% price paid).
   - **Grade B (Commercial):** Display buffer $24\text{h} - 47\text{h}$ $\rightarrow$ 25% discount markdown.
   - **Grade C (Processing Only):** Buffer $4\text{h} - 23\text{h}$ $\rightarrow$ Supermarket rejection / 80% dock; Processors pay full contracted industrial rate with 0% cosmetic penalty.
   - **Grade D (Biological Spoilage):** Buffer $< 4\text{h}$ $\rightarrow$ FSSAI food-safety violation. Total loss.
2. **Food Safety Enforcement:** Validates compliance under FSSAI Section 19. If cargo is severely decayed ($< 4.0\text{h}$ life), secondary human food processors strictly reject the consignment; cargo is diverted to bio-digestion or organic compost.
3. **Continuous Arbitrage Rule:** Recommends secondary processor diversion only when $\text{Net Margin}_{\text{secondary}} > \text{Net Margin}_{\text{primary}}$ and food safety is verified.

### Decision Protocol:
1. **Destination Viability Check:** Evaluates whether remaining biological shelf life at arrival exceeds buyer quality threshold ($\ge 24\text{h}$ for primary retail, $\ge 4\text{h}$ for secondary processors).
2. **Multi-Buyer Alternative Ranking:** Discovers closer regional processing hubs and primary stores matching crop demand.
3. **Economic Margin Arbitrage:** Compares original vs diverted net margin ($(\text{kg} \times \text{price}) - \text{freight}$) and salvages cargo value before biological write-off.
4. **Database Audit Persistence:** Records full explainable rationale and switches active route in Supabase PostgreSQL.

---

## 11. Step 8 — Integrated Mission Control (End-to-End Orchestration)

- `POST /api/workflow/simulate-spike-and-resolve` — One-click automated loop executing all subsystems sequentially:
  1. In-transit cargo telemetry ingestion and ambient temperature spike ($+26^\circ\text{C}$).
  2. Arrhenius degradation recalculation ($\alpha(T)$ acceleration & remaining shelf life depletion).
  3. Dynamic rerouting viability test (identifies primary buyer rejection risk).
  4. Secondary-market arbitrage analysis (computes optimal processor off-take and net salvage delta).
  5. Actionable recommendation payload with one-click Supabase persistence.
- **Frontend Dashboard (`IntegratedMissionControl.tsx`):**
  - Live system health, active produce volume, vehicle status, and Supabase round-trip latency.
  - Interactive "Simulate Temperature Spike (+26°C)" trigger demonstrating the entire intelligent cold-chain decision loop in real time.
  - Side-by-side comparative route visualization (Original Destination vs Diverted Recovery Facility).
  - Clear financial audit strip showing exact value salvaged ($₹\text{ net delta}$) and carbon waste prevented.
  - Seamless navigation links to dive into dedicated subsystems (Distribution Engine, Dynamic Rerouting, Secondary Arbitrage, Spoilage Simulator).

---

## 12. Step 9 — Testing, Quantitative Benchmarks & Judge Demo Script

### 12.1 Automated Test Suite (30 Tests Passing)

Execute the complete end-to-end regression and constraint suite:
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests/ -v
```

| Test Module | Tests | Validation Scope |
| :--- | :--- | :--- |
| `test_database.py` | 6 | Read/write CRUD, RLS, foreign keys, lifecycle states on Supabase PostgreSQL |
| `test_distribution.py` | 3 | Haversine distance solver, vehicle payloads, demand limits, and shelf-life constraints |
| `test_health.py` | 2 | Root status, Supabase connection latency, and service availability |
| `test_rerouting.py` | 2 | Thermal trigger threshold, route sustainability, and explainable rationale |
| `test_secondary_recovery.py` | 4 | Quality grades A–D, FSSAI §19 compliance cutoff, and continuous arbitrage rule |
| `test_spoilage.py` | 5 | Arrhenius $k(T)$ equation, $Q_{10}$, chilling injury, and humidity decay penalties |
| `test_workflow.py` | 1 | Complete end-to-end automated anomaly resolution loop with database persistence |
| `test_step9_consistency_and_benchmarks.py` | 7 | Mass balance, capacity constraints, demand limits, spoilage buffers, and baseline benchmarking |
| **Total** | **30** | **100% Passed (0 Failures, 0 Errors)** |

---

### 12.2 Quantitative Benchmark: Traditional Baseline vs HARVEST ZERO

| Metric | Traditional Logistics (Baseline FIFO) | HARVEST ZERO (FEFO + Arrhenius) | Impact / Delta |
| :--- | :--- | :--- | :--- |
| **Allocation Strategy** | First-In-First-Out (ignoring micro-climate decay) | First-Expired-First-Out + Micro-Climate Kinetics | Perishable crops prioritized for shortest cold transit |
| **Vehicle Assignment** | Arbitrary fleet assignment (ambient trucks used) | Perishability-gated thermal vehicle pairing | High-risk produce strictly paired with Reefer units |
| **Dock Rejection / Spoilage** | **1,500 kg (31.2% loss)** | **0 kg (0.0% loss)** | **-1,500 kg (-100% waste reduction)** |
| **Dock Rejection Penalty** | ₹60,000 write-off & total loss | ₹0 (all cargo arrives with $\ge 24\text{h}$ buffer) | Value preserved at farm gate |
| **Net Realized Margin** | ₹166,157 | ₹171,448 | **+₹5,291.40 (+3.2% net yield increase)** |
| **Transit Anomaly Action** | Unmonitored breakdown until delivery rejection | Automated reroute to proximate secondary processor | Cargo salvaged into juice/puree before expiration |

---

### 12.3 Hackathon Presentation & Live Demo Script

Follow this step-by-step walkthrough during the hackathon evaluation:

1. **Step 1: Welcome & Problem Framing**
   - Open [http://localhost:3000](http://localhost:3000).
   - Point to top banner: **BYTEATHON 2026 — Track BYTE01**. Mention the ICAR-CIPHET statistic: India loses 6-16% of fruits and vegetables (₹31,000+ Cr) primarily due to unoptimized post-harvest logistics.
2. **Step 2: Operations Command Overview (Landing Tab)**
   - Highlight the **Live Telemetry Strip**: Active produce tracked, cold storage utilization, and Supabase PostgreSQL round-trip latency.
   - Point to the **Step 9 Operations Research Benchmark card**: Explain how baseline FIFO logistics causes 31.2% cargo rejection due to ambient temperature decay, whereas HARVEST ZERO achieves **0.0% dock rejection**.
3. **Step 3: Trigger the Thermal Anomaly Simulation**
   - Click the red **"Simulate Temperature Spike (+26°C)"** button.
   - Watch the animated system response:
     - Ingests live telemetry from shipment `MH-15-TC-1088`.
     - Displays Arrhenius stress meter: ambient temperature leaps from $4^\circ\text{C}$ to $36.5^\circ\text{C}$, causing decay rate acceleration $\alpha(T) = 4.92\times$.
     - Explains that the cargo would arrive with only $8.5\text{h}$ buffer, violating Nature Fresh Retail's mandatory $24.0\text{h}$ display quality threshold.
4. **Step 4: Autonomous Secondary Arbitrage Discovery**
   - Show the dynamic route diversion recommendation:
     - System discovers `Kisan Starch & Dehydrated Flakes` (industrial puree processor) located closer on the corridor.
     - Calculates economic arbitrage: Primary retail delivery would result in dock rejection (-₹160,000 write-off), whereas processor diversion yields +₹35,225 net salvage profit.
     - Highlights **FSSAI Section 19 compliance**: Cargo arrives with $8.5\text{h} > 4.0\text{h}$ threshold, legal for human food processing.
5. **Step 5: Direct Database Persistence**
   - Click **"Confirm & Commit Rerouting to Supabase"**.
   - Show the live toast notification and table update: The consignment status changes to `rerouted`, destination updates in Supabase PostgreSQL, and an immutable audit rationale is saved.
6. **Step 6: Granular Technical Deep-Dives**
   - Switch through tabs to demonstrate modular depth:
     - **Distribution Engine:** Micro-climate FEFO allocation table with mathematical explanation per route.
     - **Dynamic Rerouting:** Proximity radar and candidate buyer ranking.
     - **Secondary Arbitrage:** Multi-tier quality markdown matrix and net margin calculation.
     - **Arrhenius Spoilage Engine:** Interactive temperature slider and crop degradation graph.
     - **Produce Batches / Buyers / Storage / Vehicles:** Full CRUD interfaces connected directly to Supabase.



