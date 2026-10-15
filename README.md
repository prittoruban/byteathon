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

## 2. Technology Stack

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
All 16 test cases verify health, database connection, reading from all 6 endpoints, batch lifecycle, Step 4 distribution constraints, and Step 5 Arrhenius biological degradation kinetics.

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

