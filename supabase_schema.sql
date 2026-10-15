-- ====================================================================
-- HARVEST ZERO — SUPABASE RELATIONAL SCHEMA MIGRATION (STEP 2)
-- Track: BYTE01 — Intelligent Post-Harvest Loss Prevention
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/nlnsqrjvdrtbfrfvyqfg/sql
-- ====================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if needed (cascade to cleanly recreate)
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS produce_batches CASCADE;
DROP TABLE IF EXISTS transport_vehicles CASCADE;
DROP TABLE IF EXISTS storage_facilities CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- --------------------------------------------------------------------
-- 1. FARMERS
-- Connects smallholder agricultural producers and regional farm clusters
-- --------------------------------------------------------------------
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    storage_type TEXT NOT NULL DEFAULT 'ambient_heap' 
        CHECK (storage_type IN ('ambient_heap', 'ventilated_shed', 'cold_storage')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 2. PRODUCE BATCHES
-- High-perishability harvest inventory with biological shelf-life tracking
-- --------------------------------------------------------------------
CREATE TABLE produce_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_kg >= 0),
    harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    initial_shelf_life_days NUMERIC(6, 2) NOT NULL,
    remaining_shelf_life_days NUMERIC(6, 2) NOT NULL,
    storage_condition TEXT NOT NULL DEFAULT 'ambient_heap'
        CHECK (storage_condition IN ('ambient_heap', 'ventilated_shed', 'cold_storage')),
    basal_degradation_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'harvested' 
        CHECK (status IN ('harvested', 'in_storage', 'in_transit', 'delivered', 'spoiled', 'diverted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 3. BUYERS
-- Primary retail supermarkets and secondary processing arbitrage facilities
-- --------------------------------------------------------------------
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('primary_retail', 'secondary_processor')),
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    demand_crop TEXT NOT NULL,
    demand_kg NUMERIC(10, 2) NOT NULL CHECK (demand_kg >= 0),
    offered_price_per_kg NUMERIC(10, 2) NOT NULL CHECK (offered_price_per_kg > 0),
    quality_threshold_min_shelf_life_hours NUMERIC(6, 2) NOT NULL DEFAULT 24.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 4. STORAGE FACILITIES
-- Regional cold storage and buffer warehouses
-- --------------------------------------------------------------------
CREATE TABLE storage_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    total_capacity_kg NUMERIC(12, 2) NOT NULL CHECK (total_capacity_kg > 0),
    current_utilization_kg NUMERIC(12, 2) NOT NULL DEFAULT 0.00 
        CHECK (current_utilization_kg <= total_capacity_kg),
    temperature_celsius NUMERIC(5, 2) NOT NULL DEFAULT 4.0,
    humidity_pct NUMERIC(5, 2) NOT NULL DEFAULT 85.0,
    cost_per_kg_per_day NUMERIC(8, 2) NOT NULL DEFAULT 0.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 5. TRANSPORT VEHICLES
-- Logistics fleet equipped with simulated IoT telemetry sensors
-- --------------------------------------------------------------------
CREATE TABLE transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number TEXT NOT NULL UNIQUE,
    driver_name TEXT,
    driver_phone TEXT,
    max_payload_kg NUMERIC(10, 2) NOT NULL CHECK (max_payload_kg > 0),
    is_refrigerated BOOLEAN NOT NULL DEFAULT FALSE,
    current_temp_celsius NUMERIC(5, 2) NOT NULL DEFAULT 24.0,
    current_humidity_pct NUMERIC(5, 2) NOT NULL DEFAULT 65.0,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    cost_per_km NUMERIC(8, 2) NOT NULL DEFAULT 15.00,
    status TEXT NOT NULL DEFAULT 'idle' 
        CHECK (status IN ('idle', 'in_transit', 'loading', 'maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 6. SHIPMENTS
-- Active and planned consignments with real-time Arrhenius risk tracking
-- --------------------------------------------------------------------
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES produce_batches(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE RESTRICT,
    origin_type TEXT NOT NULL CHECK (origin_type IN ('farmer', 'storage_facility')),
    origin_id UUID NOT NULL,
    destination_buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE RESTRICT,
    original_buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
    allocated_quantity_kg NUMERIC(10, 2) NOT NULL CHECK (allocated_quantity_kg > 0),
    transit_distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_transit_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    current_spoilage_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 
        CHECK (current_spoilage_risk_score >= 0 AND current_spoilage_risk_score <= 100),
    status TEXT NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_transit', 'rerouted', 'delivered', 'spoiled')),
    reroute_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX idx_batches_farmer ON produce_batches(farmer_id);
CREATE INDEX idx_batches_status ON produce_batches(status);
CREATE INDEX idx_buyers_type ON buyers(type);
CREATE INDEX idx_shipments_batch ON shipments(batch_id);
CREATE INDEX idx_shipments_vehicle ON shipments(vehicle_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted select/insert/update/delete for authenticated & anon service access
CREATE POLICY "Public Read Farmers" ON farmers FOR SELECT USING (true);
CREATE POLICY "Public Insert Farmers" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Farmers" ON farmers FOR UPDATE USING (true);
CREATE POLICY "Public Delete Farmers" ON farmers FOR DELETE USING (true);

CREATE POLICY "Public Read Batches" ON produce_batches FOR SELECT USING (true);
CREATE POLICY "Public Insert Batches" ON produce_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Batches" ON produce_batches FOR UPDATE USING (true);
CREATE POLICY "Public Delete Batches" ON produce_batches FOR DELETE USING (true);

CREATE POLICY "Public Read Buyers" ON buyers FOR SELECT USING (true);
CREATE POLICY "Public Insert Buyers" ON buyers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Buyers" ON buyers FOR UPDATE USING (true);
CREATE POLICY "Public Delete Buyers" ON buyers FOR DELETE USING (true);

CREATE POLICY "Public Read Storage" ON storage_facilities FOR SELECT USING (true);
CREATE POLICY "Public Insert Storage" ON storage_facilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Storage" ON storage_facilities FOR UPDATE USING (true);
CREATE POLICY "Public Delete Storage" ON storage_facilities FOR DELETE USING (true);

CREATE POLICY "Public Read Vehicles" ON transport_vehicles FOR SELECT USING (true);
CREATE POLICY "Public Insert Vehicles" ON transport_vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Vehicles" ON transport_vehicles FOR UPDATE USING (true);
CREATE POLICY "Public Delete Vehicles" ON transport_vehicles FOR DELETE USING (true);

CREATE POLICY "Public Read Shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Public Insert Shipments" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Shipments" ON shipments FOR UPDATE USING (true);
CREATE POLICY "Public Delete Shipments" ON shipments FOR DELETE USING (true);

-- --------------------------------------------------------------------
-- SEED DATA (Demonstration Data for Hackathon Evaluation)
-- --------------------------------------------------------------------
DO $$
DECLARE
    f1 UUID; f2 UUID; f3 UUID;
    b1 UUID; b2 UUID; b3 UUID; b4 UUID;
    s1 UUID; s2 UUID;
    v1 UUID; v2 UUID; v3 UUID;
    batch1 UUID; batch2 UUID; batch3 UUID;
BEGIN
    -- 1. Insert Farmers
    INSERT INTO farmers (name, phone, location, latitude, longitude, storage_type)
    VALUES 
        ('Ramesh Patel (Greenfield Farms)', '+91-9876543210', 'Nashik Cluster North', 19.9975, 73.7898, 'ambient_heap')
    RETURNING id INTO f1;

    INSERT INTO farmers (name, phone, location, latitude, longitude, storage_type)
    VALUES 
        ('Kavitha Reddy (Deccan Organics)', '+91-9876543211', 'Pune Rural Sector 4', 18.5204, 73.8567, 'ventilated_shed')
    RETURNING id INTO f2;

    INSERT INTO farmers (name, phone, location, latitude, longitude, storage_type)
    VALUES 
        ('Sukhwinder Singh (Kisan Producer Co)', '+91-9876543212', 'Nagpur Agri Zone', 21.1458, 79.0882, 'cold_storage')
    RETURNING id INTO f3;

    -- 2. Insert Buyers (Primary Supermarkets + Secondary Processing Factories)
    INSERT INTO buyers (name, type, location, latitude, longitude, demand_crop, demand_kg, offered_price_per_kg, quality_threshold_min_shelf_life_hours)
    VALUES 
        ('FreshMart Hypermarket (Prime Retail)', 'primary_retail', 'Mumbai Central Hub', 19.0760, 72.8777, 'Tomato', 4000.00, 42.00, 36.00)
    RETURNING id INTO b1;

    INSERT INTO buyers (name, type, location, latitude, longitude, demand_crop, demand_kg, offered_price_per_kg, quality_threshold_min_shelf_life_hours)
    VALUES 
        ('Apex Agro Puree & Sauce Corp', 'secondary_processor', 'Thane Industrial Zone', 19.2183, 72.9781, 'Tomato', 8000.00, 26.50, 8.00)
    RETURNING id INTO b2;

    INSERT INTO buyers (name, type, location, latitude, longitude, demand_crop, demand_kg, offered_price_per_kg, quality_threshold_min_shelf_life_hours)
    VALUES 
        ('NaturePure Juices & Pulp Ltd', 'secondary_processor', 'Kalyan Food Park', 19.2403, 73.1305, 'Mango', 6000.00, 35.00, 12.00)
    RETURNING id INTO b3;

    INSERT INTO buyers (name, type, location, latitude, longitude, demand_crop, demand_kg, offered_price_per_kg, quality_threshold_min_shelf_life_hours)
    VALUES 
        ('Metro Organics Retail Outlet', 'primary_retail', 'Navi Mumbai Vashi APMC', 19.0330, 73.0297, 'Potato', 5000.00, 28.00, 48.00)
    RETURNING id INTO b4;

    -- 3. Insert Storage Facilities
    INSERT INTO storage_facilities (name, location, latitude, longitude, total_capacity_kg, current_utilization_kg, temperature_celsius, humidity_pct, cost_per_kg_per_day)
    VALUES 
        ('Kisan Cold Chain Terminal A', 'Nashik Logistics Corridor', 20.0010, 73.8100, 50000.00, 18500.00, 4.00, 88.00, 0.40)
    RETURNING id INTO s1;

    INSERT INTO storage_facilities (name, location, latitude, longitude, total_capacity_kg, current_utilization_kg, temperature_celsius, humidity_pct, cost_per_kg_per_day)
    VALUES 
        ('Deccan Agri Cold Hub', 'Pune-Chakan Express Zone', 18.6200, 73.8100, 80000.00, 32000.00, 3.50, 90.00, 0.45)
    RETURNING id INTO s2;

    -- 4. Insert Transport Vehicles
    INSERT INTO transport_vehicles (vehicle_number, driver_name, driver_phone, max_payload_kg, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km, status)
    VALUES 
        ('MH-15-TC-1088', 'Anil Shinde', '+91-9922001122', 5000.00, TRUE, 8.50, 80.00, 19.9800, 73.7900, 22.00, 'in_transit')
    RETURNING id INTO v1;

    INSERT INTO transport_vehicles (vehicle_number, driver_name, driver_phone, max_payload_kg, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km, status)
    VALUES 
        ('MH-12-BG-4521', 'Mahesh Patil', '+91-9922003344', 3500.00, FALSE, 28.50, 60.00, 18.5300, 73.8600, 14.00, 'idle')
    RETURNING id INTO v2;

    INSERT INTO transport_vehicles (vehicle_number, driver_name, driver_phone, max_payload_kg, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km, status)
    VALUES 
        ('MH-31-EV-9902', 'Vikram Deshmukh', '+91-9922005566', 7000.00, TRUE, 6.00, 85.00, 21.1500, 79.0900, 25.00, 'idle')
    RETURNING id INTO v3;

    -- 5. Insert Produce Batches
    INSERT INTO produce_batches (farmer_id, crop_type, quantity_kg, harvest_date, initial_shelf_life_days, remaining_shelf_life_days, storage_condition, basal_degradation_score, status)
    VALUES 
        (f1, 'Tomato', 4000.00, CURRENT_DATE - 2, 10.00, 7.50, 'ambient_heap', 18.50, 'in_transit')
    RETURNING id INTO batch1;

    INSERT INTO produce_batches (farmer_id, crop_type, quantity_kg, harvest_date, initial_shelf_life_days, remaining_shelf_life_days, storage_condition, basal_degradation_score, status)
    VALUES 
        (f2, 'Tomato', 3500.00, CURRENT_DATE - 1, 10.00, 9.00, 'ventilated_shed', 8.20, 'harvested')
    RETURNING id INTO batch2;

    INSERT INTO produce_batches (farmer_id, crop_type, quantity_kg, harvest_date, initial_shelf_life_days, remaining_shelf_life_days, storage_condition, basal_degradation_score, status)
    VALUES 
        (f3, 'Potato', 12000.00, CURRENT_DATE - 5, 60.00, 56.00, 'cold_storage', 2.10, 'in_storage')
    RETURNING id INTO batch3;

    -- 6. Insert Shipments (Active consignment with Arrhenius Spoilage risk monitoring)
    INSERT INTO shipments (
        batch_id, vehicle_id, origin_type, origin_id, 
        destination_buyer_id, original_buyer_id, 
        allocated_quantity_kg, transit_distance_km, estimated_transit_hours, 
        current_spoilage_risk_score, status
    )
    VALUES (
        batch1, v1, 'farmer', f1,
        b1, b1,
        4000.00, 168.00, 4.50,
        14.20, 'in_transit'
    );
END $$;
