"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Filter,
  Navigation,
  Plus,
  RefreshCw,
  Route,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Thermometer,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";
import { ShelfLifeBadge } from "@/components/ShelfLifeBadge";

interface ProduceBatch {
  id: string;
  crop_type: string;
  quantity_kg: number;
  initial_shelf_life_days: number;
  remaining_shelf_life_days: number;
  storage_condition: string;
  status: string;
  harvest_date: string;
  farmers?: {
    name: string;
    location: string;
  };
}

interface AllocationRecommendation {
  allocation_id: string;
  batch_id: string;
  crop_type: string;
  farmer_name: string;
  origin_location: string;
  buyer_name: string;
  destination_location: string;
  buyer_type: string;
  vehicle_number: string;
  is_refrigerated: boolean;
  allocated_quantity_kg: number;
  distance_km: number;
  estimated_transit_hours: number;
  transport_cost: number;
  expected_revenue?: number;
  net_margin: number;
  explanation: string;
  offered_price_per_kg?: number;
}

interface DistributionPlan {
  plan_id: string;
  total_allocated_kg: number;
  total_unallocated_kg: number;
  total_expected_revenue: number;
  total_transport_cost: number;
  total_net_margin: number;
  recommendations: AllocationRecommendation[];
  unallocated_batches: {
    crop_type: string;
    farmer_name: string;
    unallocated_quantity_kg: number;
    reason: string;
    recommended_action: string;
  }[];
}

interface StorageFacility {
  id: string;
  name: string;
  location: string;
  total_capacity_kg: number;
  current_utilization_kg: number;
  temperature_celsius: number;
  humidity_pct: number;
  cost_per_kg_per_day: number;
}

interface TransportVehicle {
  id: string;
  vehicle_number: string;
  driver_name: string;
  max_payload_kg: number;
  current_temp_celsius: number;
  current_humidity_pct: number;
  cost_per_km: number;
  is_refrigerated: boolean;
  status: string;
}

interface InventorySummary {
  total_produce_kg: number;
  active_batches_count: number;
  critical_batches_count: number;
  avg_remaining_shelf_life_days: number;
  storage: {
    utilization_pct: number;
    available_capacity_kg: number;
  };
  vehicles: {
    total_payload_kg: number;
    refrigerated_count: number;
    ambient_count: number;
  };
}

interface ManagerViewProps {
  summary: InventorySummary | null;
  batches: ProduceBatch[];
  distributionPlan: DistributionPlan | null;
  storages: StorageFacility[];
  vehicles: TransportVehicle[];
  onOpenRegisterModal: () => void;
  onOpenEditModal: (batch: ProduceBatch) => void;
  onRunOptimization: () => void;
  optimizing: boolean;
  onRefresh: () => void;
  loading: boolean;
  onSwitchToFarmer: () => void;
}

export function ManagerView({
  summary,
  batches,
  distributionPlan,
  storages,
  vehicles,
  onOpenRegisterModal,
  onOpenEditModal,
  onRunOptimization,
  optimizing,
  onRefresh,
  loading,
  onSwitchToFarmer,
}: ManagerViewProps) {
  const [managerTab, setManagerTab] = useState<"allocations" | "inventory" | "fleet">("allocations");
  const [cropFilter, setCropFilter] = useState<string>("all");

  const filteredBatches = batches.filter((b) => {
    return cropFilter === "all" || b.crop_type.toLowerCase() === cropFilter.toLowerCase();
  });

  const criticalBatches = batches.filter((b) => b.remaining_shelf_life_days <= 3.0);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER STRIP: 4 HIGH-IMPACT METRICS (Deck-DNA Light Theme) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Produce */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Active Inventory
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight tabular-nums text-[#1D1D1F]">
                {summary ? (summary.total_produce_kg / 1000).toFixed(1) : "--"}
              </span>
              <span className="text-xs font-semibold text-[#6E6E73]">k kg</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#6E6E73] font-medium flex items-center justify-between">
            <span>{summary ? `${summary.active_batches_count} batches logged` : "Loading..."}</span>
            <span className="text-[#107C41] font-semibold">Active</span>
          </div>
        </div>

        {/* Metric 2: Critical Spoilage Risk */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
              At-Risk Perishables
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight tabular-nums text-[#C62828]">
                {summary?.critical_batches_count ?? 0}
              </span>
              <span className="text-xs font-semibold text-[#C62828]">critical</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#6E6E73] font-medium">
            <span>&le; 3 days biological life</span>
          </div>
        </div>

        {/* Metric 3: Cold Storage Available */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Cold Storage Free
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight tabular-nums text-[#107C41]">
                {summary ? (summary.storage.available_capacity_kg / 1000).toFixed(1) : "--"}
              </span>
              <span className="text-xs font-semibold text-[#6E6E73]">k kg free</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#6E6E73] font-medium">
            <span>{summary ? `${summary.storage.utilization_pct}% occupied` : "--"}</span>
          </div>
        </div>

        {/* Metric 4: Net Margins Generated */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Projected Net Yield
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight tabular-nums text-[#107C41]">
                ₹{distributionPlan ? Math.round(distributionPlan.total_net_margin / 1000) : "--"}
              </span>
              <span className="text-xs font-semibold text-[#107C41]">k net</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#6E6E73] font-medium">
            <span>Optimal route allocation</span>
          </div>
        </div>
      </section>

      {/* 2. OPTIMIZATION & NAVIGATION CONTROL BAR */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3">
        {/* Simple 3-Tab Segmented Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F5F5F7] p-1.5 rounded-2xl border border-neutral-200">
          <button
            onClick={() => setManagerTab("allocations")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              managerTab === "allocations"
                ? "bg-[#107C41] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#1D1D1F] hover:bg-white"
            }`}
          >
            💰 Dispatches ({distributionPlan?.recommendations.length ?? 0})
          </button>
          <button
            onClick={() => setManagerTab("inventory")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              managerTab === "inventory"
                ? "bg-[#107C41] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#1D1D1F] hover:bg-white"
            }`}
          >
            📦 Batches ({batches.length})
          </button>
          <button
            onClick={() => setManagerTab("fleet")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              managerTab === "fleet"
                ? "bg-[#107C41] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#1D1D1F] hover:bg-white"
            }`}
          >
            🚚 Fleet & Cold Rooms
          </button>
        </div>

        {/* 1-Click Optimization Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunOptimization}
            disabled={optimizing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#107C41] hover:bg-[#0D6535] text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Zap className={`w-4 h-4 ${optimizing ? "animate-spin text-amber-300" : ""}`} />
            <span>{optimizing ? "Optimizing Routes..." : "Re-Run Optimization"}</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] border border-neutral-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Batch</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE TAB CONTENT */}

      {/* TAB A: RECOMMENDED DISPATCHES & CASH (Allocations) */}
      {managerTab === "allocations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Optimal Farmer-to-Buyer Dispatches
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Prioritized by shortest biological life and highest net margin
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#107C41]">
              ₹{distributionPlan?.total_net_margin.toLocaleString()} Total Margin
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {distributionPlan?.recommendations.map((rec) => {
              const isPrimary = rec.buyer_type === "primary_retail";
              const unitPrice =
                rec.offered_price_per_kg ??
                (rec.allocated_quantity_kg > 0
                  ? (
                      (rec.expected_revenue ?? rec.net_margin) /
                      rec.allocated_quantity_kg
                    ).toFixed(1)
                  : "40");

              return (
                <div
                  key={rec.allocation_id}
                  className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3.5 hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-[#1D1D1F]">
                        {rec.crop_type}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41] border border-[#C8E6C9] tabular-nums">
                        {rec.allocated_quantity_kg.toLocaleString()} kg
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        isPrimary
                          ? "bg-[#E8F5E9] text-[#107C41] border-[#C8E6C9]"
                          : "bg-[#FFF4E5] text-[#B76E00] border-[#FFE0B2]"
                      }`}
                    >
                      {isPrimary ? "Primary Retail" : "Secondary Processor"}
                    </span>
                  </div>

                  {/* Route description */}
                  <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/70 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">Farmer Producer:</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {rec.farmer_name} ({rec.origin_location})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">Destination Buyer:</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {rec.buyer_name} ({rec.destination_location})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">Assigned Vehicle:</span>
                      <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#107C41]" />
                        <span>{rec.vehicle_number}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200">
                          {rec.is_refrigerated ? "Refrig" : "Ambient"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Financials Strip */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 border-y border-neutral-100">
                    <div>
                      <div className="text-[10px] text-[#6E6E73]">Distance</div>
                      <div className="font-bold text-[#1D1D1F] tabular-nums">{rec.distance_km} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6E6E73]">Transit</div>
                      <div className="font-bold text-[#1D1D1F] tabular-nums">{rec.estimated_transit_hours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6E6E73]">Freight</div>
                      <div className="font-bold text-[#C62828] tabular-nums">₹{rec.transport_cost.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6E6E73]">Net Margin</div>
                      <div className="font-bold text-[#107C41] tabular-nums">₹{rec.net_margin.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="p-3 rounded-xl bg-[#F5F5F7] text-xs text-[#4B5563] font-medium leading-relaxed">
                    <span className="font-bold text-[#1D1D1F]">Allocation Reason: </span>
                    {rec.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB B: BATCH INVENTORY & QUALITY (Batches) */}
      {managerTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D1D1F]">
              <Filter className="w-4 h-4 text-[#107C41]" />
              <span>Filter Produce:</span>
            </div>
            <div className="flex items-center gap-2">
              {["all", "tomato", "potato", "onion", "mango"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCropFilter(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    cropFilter === c
                      ? "bg-[#107C41] text-white"
                      : "bg-[#F5F5F7] text-[#4B5563] hover:bg-neutral-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-extrabold text-[#1D1D1F]">
                      {b.crop_type}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41] border border-[#C8E6C9] tabular-nums">
                      {b.quantity_kg.toLocaleString()} kg
                    </span>
                  </div>

                  <div className="text-xs text-[#6E6E73] space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Producer:</span>
                      <span className="font-semibold text-[#1D1D1F]">{b.farmers?.name || "Smallholder"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cluster:</span>
                      <span>{b.farmers?.location || "Regional Cluster"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span className="font-semibold text-[#1D1D1F] capitalize">{b.storage_condition.replace("_", " ")}</span>
                    </div>
                  </div>

                  <ShelfLifeBadge
                    remainingDays={b.remaining_shelf_life_days}
                    initialDays={b.initial_shelf_life_days}
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#6E6E73]">Harvest: {b.harvest_date}</span>
                  <button
                    onClick={() => onOpenEditModal(b)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] border border-neutral-200 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: FLEET & COLD STORAGE (Readiness) */}
      {managerTab === "fleet" && (
        <div className="space-y-6">
          {/* Storage facilities */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-[#107C41]" />
              <span>Cold Storage Facilities ({storages.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storages.map((s) => {
                const utilPct = Math.round((s.current_utilization_kg / s.total_capacity_kg) * 100);
                const free = s.total_capacity_kg - s.current_utilization_kg;
                return (
                  <div key={s.id} className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-base text-[#1D1D1F] block">{s.name}</span>
                        <span className="text-xs text-[#6E6E73]">{s.location}</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#107C41]">
                        {utilPct}% Utilized
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[#6E6E73]">
                        <span>{s.current_utilization_kg.toLocaleString()} kg occupied</span>
                        <span className="font-bold text-[#107C41]">{(free / 1000).toFixed(1)}k kg free</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                        <div className="h-full bg-[#107C41] rounded-full" style={{ width: `${utilPct}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-[#4B5563] pt-2 border-t border-neutral-100 font-medium">
                      <span>Temp: {s.temperature_celsius}°C</span>
                      <span>RH: {s.humidity_pct}%</span>
                      <span>Tariff: ₹{s.cost_per_kg_per_day}/kg/d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport vehicles */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#107C41]" />
              <span>Active Transport Fleet ({vehicles.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div key={v.id} className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-[#1D1D1F]">{v.vehicle_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41]">
                      {v.is_refrigerated ? "Refrig" : "Ambient"}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-[#6E6E73]">
                    <div className="flex justify-between">
                      <span>Driver:</span>
                      <span className="font-semibold text-[#1D1D1F]">{v.driver_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="tabular-nums font-semibold text-[#1D1D1F]">{v.max_payload_kg.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temp / RH:</span>
                      <span className="tabular-nums font-semibold text-[#1D1D1F]">{v.current_temp_celsius}°C / {v.current_humidity_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SWITCH BACK TO FARMER VIEW */}
      <div className="pt-8 text-center">
        <button
          onClick={onSwitchToFarmer}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#107C41] hover:text-[#0D6535] transition-colors py-2.5 px-4 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] cursor-pointer shadow-xs"
        >
          <span>🌾 किसान साथी (Return to Farmer Mode)</span>
        </button>
      </div>
    </div>
  );
}
