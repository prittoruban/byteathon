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
  Plus,
  Edit2,
  Filter,
  DollarSign,
  AlertTriangle,
  Scale,
  Thermometer,
  Route,
  Zap,
  Check,
  Flame,
  Navigation,
} from "lucide-react";
import { ShelfLifeBadge } from "@/components/ShelfLifeBadge";
import { CreateBatchModal } from "@/components/CreateBatchModal";
import { UpdateBatchModal } from "@/components/UpdateBatchModal";
import { SpoilageSimulator } from "@/components/SpoilageSimulator";
import { DynamicReroutingView } from "@/components/DynamicReroutingView";
import { SecondaryRecoveryView } from "@/components/SecondaryRecoveryView";
import { IntegratedMissionControl } from "@/components/IntegratedMissionControl";

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

interface AllocationRecommendation {
  allocation_id: string;
  batch_id: string;
  crop_type: string;
  farmer_name: string;
  origin_location: string;
  buyer_name: string;
  buyer_type: string;
  destination_location: string;
  vehicle_number: string;
  is_refrigerated: boolean;
  allocated_quantity_kg: number;
  distance_km: number;
  estimated_transit_hours: number;
  transport_cost: number;
  expected_revenue: number;
  net_margin: number;
  shelf_life_margin_hours: number;
  explanation: string;
}

interface DistributionPlan {
  plan_id: string;
  timestamp: string;
  total_allocated_kg: number;
  total_unallocated_kg: number;
  total_expected_revenue: number;
  total_transport_cost: number;
  total_net_margin: number;
  recommendations: AllocationRecommendation[];
  unallocated_batches: {
    batch_id: string;
    crop_type: string;
    farmer_name: string;
    original_quantity_kg: number;
    unallocated_quantity_kg: number;
    storage_condition: string;
    remaining_shelf_life_days: number;
    reason: string;
    recommended_action: string;
  }[];
  unfulfilled_demands: {
    buyer_id: string;
    buyer_name: string;
    buyer_type: string;
    crop_type: string;
    original_demand_kg: number;
    unfulfilled_demand_kg: number;
    reason: string;
  }[];
  constraints_audit: {
    demand_limits_respected: boolean;
    vehicle_capacities_respected: boolean;
    shelf_life_limits_respected: boolean;
    all_allocations_feasible: boolean;
  };
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [batches, setBatches] = useState<ProduceBatchItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerItem[]>([]);
  const [storages, setStorages] = useState<StorageFacilityItem[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicleItem[]>([]);
  const [distributionPlan, setDistributionPlan] = useState<DistributionPlan | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] =
    useState<ProduceBatchItem | null>(null);

  // Filters & Tabs
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<
    "overview" | "distribution" | "rerouting" | "secondary" | "spoilage" | "batches" | "buyers" | "storage" | "vehicles"
  >("overview");

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [
        healthRes,
        summaryRes,
        batchesRes,
        buyersRes,
        storageRes,
        vehiclesRes,
        planRes,
      ] = await Promise.all([
        fetch(`${backendUrl}/health`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/inventory/summary`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/produce-batches`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/buyers`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/storage-facilities`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/transport-vehicles`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/distribution/recommend`, { cache: "no-store" }),
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
      if (planRes.ok) setDistributionPlan(await planRes.json());
    } catch (err) {
      console.error("Failed to load inventory and distribution data:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const runDistributionOptimization = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`${backendUrl}/api/distribution/recommend`, {
        cache: "no-store",
      });
      if (res.ok) {
        const plan: DistributionPlan = await res.json();
        setDistributionPlan(plan);
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const filteredBatches = batches.filter((b) => {
    const matchesCrop =
      cropFilter === "all" ||
      b.crop_type.toLowerCase() === cropFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      b.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCrop && matchesStatus;
  });

  const tabsConfig = [
    {
      id: "overview",
      label: "Mission Control (Overview)",
      icon: Activity,
    },
    {
      id: "distribution",
      label: `Distribution Engine (${distributionPlan?.recommendations.length ?? 0})`,
      icon: Route,
    },
    {
      id: "rerouting",
      label: "Dynamic Rerouting",
      icon: Navigation,
    },
    {
      id: "secondary",
      label: "Secondary Arbitrage",
      icon: Scale,
    },
    {
      id: "spoilage",
      label: "Arrhenius Spoilage Engine",
      icon: Flame,
    },
    {
      id: "batches",
      label: `Produce Batches (${batches.length})`,
      icon: Sprout,
    },
    {
      id: "buyers",
      label: `Buyer Demand (${buyers.length})`,
      icon: Warehouse,
    },
    {
      id: "storage",
      label: `Cold Storage (${storages.length})`,
      icon: ThermometerSnowflake,
    },
    {
      id: "vehicles",
      label: `Vehicle Fleet (${vehicles.length})`,
      icon: Truck,
    },
  ] as const;

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = tabsConfig.length;
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % total;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = total - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = tabsConfig[nextIndex].id;
    setActiveTab(nextTab as typeof activeTab);
    const nextElem = document.getElementById(`tab-${nextTab}`);
    nextElem?.focus();
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-slate-900 dark:bg-[#000000] dark:text-white transition-colors">
      {/* Proper Apple HIG Navigation Bar (Sticky with Liquid Glass material) */}
      <header className="sticky top-0 z-40 ios-glass-bar shadow-xs">
        {/* Top Brand & Actions Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  HARVEST ZERO
                </span>
                <span className="text-[11px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Operations Control
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                Post-Harvest Loss Prevention and Cold-Chain Logistics
              </p>
            </div>
          </div>

          {/* Quick Actions & System Status */}
          <div className="flex items-center gap-2.5">
            {/* Quick Register Produce Action */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Batch</span>
            </button>

            {/* Live Indicator */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
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
              <span className="hidden sm:inline">
                {loading
                  ? "Optimizing..."
                  : health?.status === "healthy"
                  ? `Engine Active (${latency}ms)`
                  : "Disconnected"}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-white rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Refresh all inventory data"
              aria-label="Refresh all inventory data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? "animate-spin text-emerald-600" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sub-Navigation: iOS Segmented Control Tab Bar */}
        <div className="border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto flex items-center justify-between gap-4 scrollbar-none">
            <nav
              role="tablist"
              aria-label="Platform Navigation"
              className="flex items-center gap-1 shrink-0"
            >
              {tabsConfig.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 ${
                      isActive
                        ? "bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-bold border border-black/[0.06] dark:border-white/[0.08]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Contextual Action Button */}
            {activeTab === "distribution" && (
              <button
                onClick={runDistributionOptimization}
                disabled={optimizing}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    optimizing ? "animate-spin text-amber-300" : ""
                  }`}
                />
                <span>
                  {optimizing ? "Computing..." : "Re-Run Optimization"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top 5 KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Produce Tracked */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
              <span>Active Produce</span>
              <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary
                  ? (summary.total_produce_kg / 1000).toFixed(1)
                  : "--"}
                <span className="text-sm font-semibold ml-0.5 text-slate-500">k</span>
              </span>
              <span className="text-xs text-slate-500">kg total</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {summary
                ? `${summary.active_batches_count} batches logged`
                : "Loading..."}
            </div>
          </div>

          {/* 2. Remaining Shelf Life */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
              <span>Avg Shelf Life</span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary ? summary.avg_remaining_shelf_life_days : "--"}
                <span className="text-sm font-semibold ml-0.5 text-slate-500">d</span>
              </span>
              <span className="text-xs text-slate-500">average</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              {summary?.critical_batches_count
                ? `⚠️ ${summary.critical_batches_count} critical (<3 days)`
                : "All batches currently safe"}
            </div>
          </div>

          {/* 3. Buyer Demand */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
              <span>Buyer Demand</span>
              <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary
                  ? (summary.buyer_demand.total_demand_kg / 1000).toFixed(1)
                  : "--"}
                <span className="text-sm font-semibold ml-0.5 text-slate-500">k</span>
              </span>
              <span className="text-xs text-slate-500">kg demand</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
              {summary
                ? `${(summary.buyer_demand.primary_demand_kg / 1000).toFixed(
                    1
                  )}k retail / ${(
                    summary.buyer_demand.secondary_demand_kg / 1000
                  ).toFixed(1)}k puree`
                : "Loading..."}
            </div>
          </div>

          {/* 4. Storage Availability */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
              <span>Cold Storage</span>
              <ThermometerSnowflake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary ? summary.storage.utilization_pct : "--"}
                <span className="text-sm font-semibold ml-0.5 text-slate-500">%</span>
              </span>
              <span className="text-xs text-slate-500">utilized</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
              {summary
                ? `${(summary.storage.available_capacity_kg / 1000).toFixed(
                    1
                  )}k kg available`
                : "Loading..."}
            </div>
          </div>

          {/* 5. Transport Fleet Payload */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
              <span>Vehicle Fleet</span>
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary
                  ? (summary.vehicles.total_payload_kg / 1000).toFixed(1)
                  : "--"}
                <span className="text-sm font-semibold ml-0.5 text-slate-500">k</span>
              </span>
              <span className="text-xs text-slate-500">kg payload</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
              {summary
                ? `${summary.vehicles.refrigerated_count} cold / ${summary.vehicles.ambient_count} ambient`
                : "Loading..."}
            </div>
          </div>
        </section>

        {/* TAB: MISSION CONTROL OVERVIEW */}
        {activeTab === "overview" && (
          <div
            id="panel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            tabIndex={0}
            className="focus:outline-none"
          >
            <IntegratedMissionControl
              onNavigateToTab={(tab) => setActiveTab(tab as typeof activeTab)}
            />
          </div>
        )}

        {/* TAB: DYNAMIC REROUTING */}
        {activeTab === "rerouting" && (
          <div
            id="panel-rerouting"
            role="tabpanel"
            aria-labelledby="tab-rerouting"
            tabIndex={0}
            className="focus:outline-none"
          >
            <DynamicReroutingView />
          </div>
        )}

        {/* TAB: SECONDARY-MARKET RECOVERY */}
        {activeTab === "secondary" && <SecondaryRecoveryView />}

        {/* TAB: SPOILAGE-RISK ENGINE */}
        {activeTab === "spoilage" && <SpoilageSimulator />}

        {/* TAB: DISTRIBUTION ENGINE */}
        {activeTab === "distribution" && (
          <div className="space-y-6">
            {/* Optimization Financial Banner */}
            {distributionPlan && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white border border-emerald-800 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <Cpu className="w-4 h-4" />
                      <span>FEFO-Optimized Plan: <span className="font-mono">{distributionPlan.plan_id}</span></span>
                    </div>
                    <h2 className="text-xl font-bold mt-1 tracking-tight">
                      Multi-Echelon Allocation & Transportation Economics
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Demand Limits Respected
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Vehicle Payload Checked
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Shelf Life Safe
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Allocated Volume</span>
                    <div className="text-lg font-bold text-emerald-300 mt-0.5 tabular-nums">
                      {distributionPlan.total_allocated_kg.toLocaleString()}<span className="text-xs font-medium ml-0.5 text-emerald-400">kg</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Unallocated Volume</span>
                    <div className="text-lg font-bold text-amber-300 mt-0.5 tabular-nums">
                      {distributionPlan.total_unallocated_kg.toLocaleString()}<span className="text-xs font-medium ml-0.5 text-amber-400">kg</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Expected Gross Revenue</span>
                    <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
                      <span className="text-xs font-medium mr-0.5">₹</span>{distributionPlan.total_expected_revenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Transport Cost</span>
                    <div className="text-lg font-bold text-rose-300 mt-0.5 tabular-nums">
                      <span className="text-xs font-medium mr-0.5">₹</span>{distributionPlan.total_transport_cost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Net Economic Yield</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
                      <span className="text-xs font-medium mr-0.5">₹</span>{distributionPlan.total_net_margin.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Route className="w-4 h-4 text-emerald-600" />
                  Recommended Produce Allocations ({distributionPlan?.recommendations.length ?? 0})
                </h3>
                <span className="text-xs text-slate-500">
                  Prioritized by basal decay rate & maximum net margin
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {distributionPlan?.recommendations.map((rec) => {
                  const isPrimary = rec.buyer_type === "primary_retail";
                  return (
                    <div
                      key={rec.allocation_id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {rec.crop_type}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 tabular-nums">
                            {rec.allocated_quantity_kg.toLocaleString()} kg
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            isPrimary
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {isPrimary ? "Primary Retail" : "Secondary Processor"}
                        </span>
                      </div>

                      {/* Route Map description */}
                      <div className="text-xs space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="text-slate-400">Origin:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {rec.farmer_name} ({rec.origin_location})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="text-slate-400">Destination:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {rec.buyer_name} ({rec.destination_location})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="text-slate-400">Assigned Truck:</span>
                          <span>
                            {rec.vehicle_number} (
                            {rec.is_refrigerated ? "Refrigerated" : "Ambient"})
                          </span>
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="text-[10px] text-slate-400">Distance</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {rec.distance_km} km
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Transit</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {rec.estimated_transit_hours}h
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Freight Cost</div>
                          <div className="font-bold text-rose-600 tabular-nums">
                            ₹{rec.transport_cost.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Net Profit</div>
                          <div className="font-bold text-emerald-600 tabular-nums">
                            ₹{rec.net_margin.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                          Optimization Rationale:
                        </div>
                        {rec.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unallocated and Unfulfilled section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unallocated Batches */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Unallocated Produce Inventory ({distributionPlan?.unallocated_batches.length ?? 0})
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    Buffer Stock
                  </span>
                </div>
                <div className="space-y-2">
                  {distributionPlan?.unallocated_batches.map((ub, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span>
                          {ub.crop_type} ({ub.farmer_name})
                        </span>
                        <span className="text-amber-700 dark:text-amber-400 tabular-nums">
                          {ub.unallocated_quantity_kg.toLocaleString()} kg
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{ub.reason}</div>
                      <div className="text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                        Action: {ub.recommended_action}
                      </div>
                    </div>
                  ))}
                  {distributionPlan?.unallocated_batches.length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      All produce batches fully allocated.
                    </div>
                  )}
                </div>
              </div>

              {/* Unfulfilled Buyer Demand */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Unfulfilled Buyer Demand ({distributionPlan?.unfulfilled_demands.length ?? 0})
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                    Demand Deficit
                  </span>
                </div>
                <div className="space-y-2">
                  {distributionPlan?.unfulfilled_demands.map((ud, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span>
                          {ud.buyer_name} ({ud.crop_type})
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                          {ud.unfulfilled_demand_kg.toLocaleString()} kg short
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{ud.reason}</div>
                    </div>
                  ))}
                  {distributionPlan?.unfulfilled_demands.length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      All buyer demand completely fulfilled.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCE INVENTORY & BATCHES */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 text-xs font-sans">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Filters:
                </span>
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
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {batch.crop_type}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded tabular-nums">
                            {batch.quantity_kg.toLocaleString()} kg
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            batch.status === "harvested"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : batch.status === "in_storage"
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                              : batch.status === "in_transit"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {batch.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Farmer info */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-sans space-y-1 mb-4">
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
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        Harvest: {batch.harvest_date}
                      </span>
                      <button
                        onClick={() => setSelectedBatchForEdit(batch)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BUYER DEMAND MATRIX */}
        {activeTab === "buyers" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <Warehouse className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">
                  Dual-Tier Arbitrage Demand Architecture:
                </span>{" "}
                Primary retail buyers require premium cosmetics and &gt;24h shelf life at full market value (e.g., ₹42/kg). Secondary processors (puree, paste, juice) absorb thermally stressed goods at salvage rates (e.g., ₹26.50/kg) with lower quality thresholds down to 8h.
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
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {b.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {b.location}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${
                          isPrimary
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {isPrimary ? "Primary Retail" : "Secondary Processor"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <div className="text-slate-400 text-[11px]">Crop Demand</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {b.demand_crop}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Volume (kg)</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">
                          {b.demand_kg.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Offered Price</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                          ₹{b.offered_price_per_kg}/kg
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Min Arrival Shelf Life:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        ≥ {b.quality_threshold_min_shelf_life_hours} hours
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COLD STORAGE CAPACITY */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storages.map((s) => {
                const utilPct = Math.round(
                  (s.current_utilization_kg / s.total_capacity_kg) * 100
                );
                const available =
                  s.total_capacity_kg - s.current_utilization_kg;
                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0f1b14] border border-slate-200/80 dark:border-emerald-950 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {s.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          {utilPct}% Utilized
                        </span>
                      </div>
                    </div>

                    {/* Capacity Track */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 tabular-nums">
                          {s.current_utilization_kg.toLocaleString()} kg used
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {available.toLocaleString()} kg free
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 tabular-nums">
                        Total Capacity: {s.total_capacity_kg.toLocaleString()} kg
                      </div>
                    </div>

                    {/* Telemetry metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px]">Temperature</div>
                        <div className="font-bold text-emerald-600 mt-0.5 tabular-nums">
                          {s.temperature_celsius}°C
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px]">Humidity</div>
                        <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
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

        {/* TAB 5: VEHICLE FLEET & TELEMETRY */}
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
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          v.status === "in_transit"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {v.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Driver:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {v.driver_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Payload:</span>
                        <span className="tabular-nums font-medium text-slate-800 dark:text-slate-200">{v.max_payload_kg.toLocaleString()} kg</span>
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
                          {isCold
                            ? "Active Refrigeration"
                            : "Ambient Ventilation"}
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
      <footer className="mt-16 border-t border-slate-200/80 dark:border-white/10 py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
        <p>HARVEST ZERO © 2026. Post-Harvest Loss Prevention and Cold-Chain Logistics</p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Decision support platform connecting farmers, cold storage facilities, transport fleets, and commercial buyers.
        </p>
      </footer>
    </div>
  );
}
