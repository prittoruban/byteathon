"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sprout,
  Activity,
  ShieldCheck,
  ThermometerSnowflake,
  Truck,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Cpu,
  Layers,
  Database,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  Edit2,
  Filter,
  DollarSign,
  AlertTriangle,
  Scale,
  Thermometer,
} from "lucide-react";
import { ShelfLifeBadge } from "@/components/ShelfLifeBadge";
import { CreateBatchModal } from "@/components/CreateBatchModal";
import { UpdateBatchModal } from "@/components/UpdateBatchModal";

interface HealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  database_configured: boolean;
  supabase_url?: string;
}

interface InventorySummary {
  total_produce_kg: number;
  total_batches_count: number;
  active_batches_count: number;
  avg_remaining_shelf_life_days: number;
  critical_batches_count: number;
  buyer_demand: {
    total_demand_kg: number;
    primary_demand_kg: number;
    secondary_demand_kg: number;
    total_buyers: number;
  };
  storage: {
    total_capacity_kg: number;
    utilization_kg: number;
    available_capacity_kg: number;
    utilization_pct: number;
    facilities_count: number;
  };
  vehicles: {
    total_payload_kg: number;
    total_vehicles: number;
    refrigerated_count: number;
    ambient_count: number;
  };
}

interface ProduceBatchItem {
  id: string;
  crop_type: string;
  quantity_kg: number;
  harvest_date: string;
  initial_shelf_life_days: number;
  remaining_shelf_life_days: number;
  storage_condition: string;
  basal_degradation_score: number;
  status: string;
  created_at: string;
  farmers?: {
    name: string;
    location: string;
  };
}

interface BuyerItem {
  id: string;
  name: string;
  type: string;
  location: string;
  demand_crop: string;
  demand_kg: number;
  offered_price_per_kg: number;
  quality_threshold_min_shelf_life_hours: number;
}

interface StorageFacilityItem {
  id: string;
  name: string;
  location: string;
  total_capacity_kg: number;
  current_utilization_kg: number;
  temperature_celsius: number;
  humidity_pct: number;
  cost_per_kg_per_day: number;
}

interface TransportVehicleItem {
  id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  max_payload_kg: number;
  is_refrigerated: boolean;
  current_temp_celsius: number;
  current_humidity_pct: number;
  cost_per_km: number;
  status: string;
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [batches, setBatches] = useState<ProduceBatchItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerItem[]>([]);
  const [storages, setStorages] = useState<StorageFacilityItem[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicleItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] =
    useState<ProduceBatchItem | null>(null);

  // Filters
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"batches" | "buyers" | "storage" | "vehicles">("batches");

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [healthRes, summaryRes, batchesRes, buyersRes, storageRes, vehiclesRes] =
        await Promise.all([
          fetch(`${backendUrl}/health`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/inventory/summary`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/produce-batches`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/buyers`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/storage-facilities`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/transport-vehicles`, { cache: "no-store" }),
        ]);

      const end = performance.now();
      setLatency(Math.round(end - start));
      setLastChecked(new Date().toLocaleTimeString());

      if (healthRes.ok) setHealth(await healthRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (batchesRes.ok) setBatches(await batchesRes.json());
      if (buyersRes.ok) setBuyers(await buyersRes.json());
      if (storageRes.ok) setStorages(await storageRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const filteredBatches = batches.filter((b) => {
    const matchesCrop = cropFilter === "all" || b.crop_type.toLowerCase() === cropFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || b.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCrop && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070f0b] dark:text-slate-100 transition-colors">
      {/* Top Hackathon Banner */}
      <div className="bg-emerald-950 text-emerald-200 border-b border-emerald-900 px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-100">BYTEATHON 2026</span>
          <span className="text-emerald-500">|</span>
          <span>Track BYTE01: Intelligent Post-Harvest Loss Prevention</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">Codename: HARVEST ZERO</span>
          <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-700/50">
            Step 3: Live Inventory Dashboard
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0b1410]/90 backdrop-blur-md border-b border-emerald-100 dark:border-emerald-950/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-emerald-900 dark:text-emerald-100">
                  HARVEST ZERO
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded">
                  Live Supabase Inventory
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Operations Research & Kinetic Degradation Cold-Chain Optimizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-all ${
                loading
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                  : health?.status === "healthy"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  loading
                    ? "bg-amber-500 animate-ping"
                    : health?.status === "healthy"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <span>
                {loading
                  ? "Syncing..."
                  : health?.status === "healthy"
                  ? `Supabase + FastAPI (${latency}ms)`
                  : "Disconnected"}
              </span>
            </div>

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 dark:text-slate-400 dark:hover:text-emerald-300 rounded-lg transition-colors cursor-pointer"
              title="Refresh all inventory data"
              aria-label="Refresh all inventory data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top 5 KPI Grid (Summary of Step 3 Requirements) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Produce Tracked */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
              <span>Active Produce</span>
              <Sprout className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {summary ? `${(summary.total_produce_kg / 1000).toFixed(1)}k` : "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">kg total</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              {summary ? `${summary.active_batches_count} batches logged` : "Loading..."}
            </div>
          </div>

          {/* 2. Remaining Shelf Life */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
              <span>Avg Shelf Life</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {summary ? `${summary.avg_remaining_shelf_life_days}d` : "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">average</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-amber-700 dark:text-amber-400">
              {summary?.critical_batches_count
                ? `⚠️ ${summary.critical_batches_count} critical (<3 days)`
                : "All batches currently safe"}
            </div>
          </div>

          {/* 3. Buyer Demand */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
              <span>Buyer Demand</span>
              <Warehouse className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {summary ? `${(summary.buyer_demand.total_demand_kg / 1000).toFixed(1)}k` : "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">kg demand</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-blue-700 dark:text-blue-400">
              {summary
                ? `${(summary.buyer_demand.primary_demand_kg / 1000).toFixed(1)}k retail / ${(summary.buyer_demand.secondary_demand_kg / 1000).toFixed(1)}k puree`
                : "Loading..."}
            </div>
          </div>

          {/* 4. Storage Availability */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
              <span>Cold Storage</span>
              <ThermometerSnowflake className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {summary ? `${summary.storage.utilization_pct}%` : "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">utilized</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-purple-700 dark:text-purple-400">
              {summary
                ? `${(summary.storage.available_capacity_kg / 1000).toFixed(1)}k kg available`
                : "Loading..."}
            </div>
          </div>

          {/* 5. Transport Fleet Payload */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
              <span>Vehicle Fleet</span>
              <Truck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {summary ? `${(summary.vehicles.total_payload_kg / 1000).toFixed(1)}k` : "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">kg payload</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-teal-700 dark:text-teal-400">
              {summary
                ? `${summary.vehicles.refrigerated_count} cold / ${summary.vehicles.ambient_count} ambient`
                : "Loading..."}
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: "batches", label: `Produce Batches (${batches.length})`, icon: Sprout },
              { id: "buyers", label: `Buyer Demand (${buyers.length})`, icon: Warehouse },
              { id: "storage", label: `Cold Storage (${storages.length})`, icon: ThermometerSnowflake },
              { id: "vehicles", label: `Vehicle Fleet (${vehicles.length})`, icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "batches" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Produce Batch</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: PRODUCE INVENTORY & BATCHES */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Filters:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Crop:</span>
                  <select
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="all">All Crops</option>
                    <option value="tomato">Tomato</option>
                    <option value="potato">Potato</option>
                    <option value="onion">Onion</option>
                    <option value="mango">Mango</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="harvested">Harvested</option>
                    <option value="in_storage">In Storage</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="diverted">Diverted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Produce Batches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => {
                const isAmbient = batch.storage_condition === "ambient_heap";
                const isCold = batch.storage_condition === "cold_storage";

                return (
                  <div
                    key={batch.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row: Crop + Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {batch.crop_type}
                          </span>
                          <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded">
                            {batch.quantity_kg.toLocaleString()} kg
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            batch.status === "harvested"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : batch.status === "in_storage"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : batch.status === "in_transit"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {batch.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Farmer info */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono space-y-1 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Producer:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {batch.farmers?.name || "Smallholder Producer"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Cluster Location:</span>
                          <span>{batch.farmers?.location || "Regional Cluster"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Storage Environment:</span>
                          <span
                            className={`font-semibold ${
                              isAmbient
                                ? "text-rose-600 dark:text-rose-400"
                                : isCold
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {batch.storage_condition.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Basal Decay Rate:</span>
                          <span>+{batch.basal_degradation_score} pts/day</span>
                        </div>
                      </div>

                      {/* Shelf life progress gauge */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <ShelfLifeBadge
                          remainingDays={batch.remaining_shelf_life_days}
                          initialDays={batch.initial_shelf_life_days}
                        />
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        Harvest: {batch.harvest_date}
                      </span>
                      <button
                        onClick={() => setSelectedBatchForEdit(batch)}
                        className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredBatches.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200 dark:border-emerald-950 text-slate-500 font-mono text-xs">
                No produce batches match the selected filters.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUYER DEMAND MATRIX */}
        {activeTab === "buyers" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs font-mono text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Warehouse className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Dual-Tier Arbitrage Demand Architecture:</span> Primary retail buyers require premium cosmetics and &gt;24h shelf life at full market value (e.g., ₹42/kg). Secondary processors (puree, paste, juice) absorb thermally stressed goods at salvage rates (e.g., ₹26.50/kg) with lower quality thresholds down to 8h.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyers.map((b) => {
                const isPrimary = b.type === "primary_retail";
                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                          {b.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{b.location}</p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                          isPrimary
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {isPrimary ? "Primary Retail" : "Secondary Processor"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs font-mono">
                      <div>
                        <div className="text-slate-400 text-[11px]">Crop Demand</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {b.demand_crop}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Volume (kg)</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {b.demand_kg.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Offered Price</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          ₹{b.offered_price_per_kg}/kg
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Min Arrival Shelf Life:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        ≥ {b.quality_threshold_min_shelf_life_hours} hours
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: COLD STORAGE CAPACITY */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storages.map((s) => {
                const utilPct = Math.round((s.current_utilization_kg / s.total_capacity_kg) * 100);
                const available = s.total_capacity_kg - s.current_utilization_kg;
                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                          {s.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{s.location}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                          {utilPct}% Utilized
                        </span>
                      </div>
                    </div>

                    {/* Capacity Track */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">
                          {s.current_utilization_kg.toLocaleString()} kg used
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {available.toLocaleString()} kg free
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-400">
                        Total Capacity: {s.total_capacity_kg.toLocaleString()} kg
                      </div>
                    </div>

                    {/* Telemetry metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px]">Temperature</div>
                        <div className="font-bold text-emerald-600 mt-0.5">
                          {s.temperature_celsius}°C
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px]">Humidity</div>
                        <div className="font-bold text-blue-600 mt-0.5">
                          {s.humidity_pct}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px]">Holding Tariff</div>
                        <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          ₹{s.cost_per_kg_per_day}/kg/d
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLE FLEET & TELEMETRY */}
        {activeTab === "vehicles" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.map((v) => {
                const isCold = v.is_refrigerated;
                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {v.vehicle_number}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          v.status === "in_transit"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Driver:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {v.driver_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Payload:</span>
                        <span>{v.max_payload_kg.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cooling System:</span>
                        <span
                          className={`font-semibold ${
                            isCold
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isCold ? "Active Refrigeration" : "Ambient Ventilation"}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry pill */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                        <span>Temp: {v.current_temp_celsius}°C</span>
                      </div>
                      <span className="text-slate-400">|</span>
                      <span>RH: {v.current_humidity_pct}%</span>
                      <span className="text-slate-400">|</span>
                      <span>₹{v.cost_per_km}/km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateBatchModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchAllData}
        backendUrl={backendUrl}
      />

      <UpdateBatchModal
        batch={selectedBatchForEdit}
        isOpen={selectedBatchForEdit !== null}
        onClose={() => setSelectedBatchForEdit(null)}
        onSuccess={fetchAllData}
        backendUrl={backendUrl}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-emerald-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        <p>HARVEST ZERO © 2026 — Built for BYTEATHON 2026 Grand Finale</p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Department of CSE, Noorul Islam Centre for Higher Education
        </p>
      </footer>
    </div>
  );
}
