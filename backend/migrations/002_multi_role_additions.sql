-- BYTEATHON 2026 (Track BYTE01) — Multi-Role Platform Rebuild Migration

-- 1. Profiles: One row per auth user
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY,
  role              TEXT NOT NULL CHECK (role IN ('farmer','fpo_coordinator','cold_storage_owner','truck_driver','buyer')),
  display_name      TEXT,
  phone             TEXT,
  linked_entity_id  UUID,  -- FK to farmers.id / buyers.id / storage_facilities.id / transport_vehicles.id
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 2. In-app notification inbox
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,  -- 'plan_request' | 'booking_request' | 'pickup_request' | 'delivery_assigned'
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  payload       JSONB,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Decision engine output before farmer confirms
CREATE TABLE IF NOT EXISTS dispatch_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              UUID REFERENCES produce_batches(id) ON DELETE CASCADE,
  buyer_id              UUID REFERENCES buyers(id),
  vehicle_id            UUID REFERENCES transport_vehicles(id),
  storage_id            UUID REFERENCES storage_facilities(id),
  store_quantity_kg     NUMERIC,
  dispatch_quantity_kg  NUMERIC,
  estimated_price_inr   NUMERIC,
  net_delta_inr         NUMERIC,  -- vs baseline mandi plan
  shelf_life_hours_remaining NUMERIC,
  urgency               TEXT CHECK (urgency IN ('low','medium','high','critical')),
  status                TEXT DEFAULT 'proposed'
    CHECK (status IN ('proposed','selected','confirmed','rejected','expired')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  confirmed_at          TIMESTAMPTZ
);

-- 4. Add to produce_batches
ALTER TABLE produce_batches
  ADD COLUMN IF NOT EXISTS harvest_timestamp TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'pending';

-- 5. Enable RLS where supported
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
