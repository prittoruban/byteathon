"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Route,
  Navigation,
  Scale,
  Flame,
  Warehouse,
  ThermometerSnowflake,
  Truck,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { TabBar } from "@/components/ui/TabBar";
import { KPICard } from "@/components/ui/KPICard";
import { DataCard, DataCardHeader } from "@/components/ui/DataCard";
import { BatchCard } from "@/components/BatchCard";
import { BuyerCard } from "@/components/BuyerCard";
import { StorageCard } from "@/components/StorageCard";
import { VehicleCard } from "@/components/VehicleCard";
import {
  DistributionRecommendationCard,
  UnallocatedItem,
  UnfulfilledItem,
} from "@/components/DistributionRecommendationCard";
import { CreateBatchModal } from "@/components/CreateBatchModal";
import { UpdateBatchModal } from "@/components/UpdateBatchModal";
import { SpoilageSimulator } from "@/components/SpoilageSimulator";
import { DynamicReroutingView } from "@/components/DynamicReroutingView";
import { SecondaryRecoveryView } from "@/components/SecondaryRecoveryView";
import { IntegratedMissionControl } from "@/components/IntegratedMissionControl";
import { LogisticsMapView } from "@/components/LogisticsMapView";

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
  farmers?: { name: string; location: string };
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

type TabId =
  | "overview"
  | "distribution"
  | "rerouting"
  | "secondary"
  | "spoilage"
  | "batches"
  | "buyers"
  | "storage"
  | "vehicles"
  | "logistics-map";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Mission Control", icon: Route },
  { id: "distribution", label: "Distribution Engine", icon: Route },
  { id: "rerouting", label: "Dynamic Rerouting", icon: Navigation },
  { id: "secondary", label: "Secondary Arbitrage", icon: Scale },
  { id: "spoilage", label: "Arrhenius Spoilage", icon: Flame },
  { id: "logistics-map", label: "Logistics Map", icon: MapPin },
  { id: "batches", label: "Produce Batches", icon: Truck },
  { id: "buyers", label: "Buyer Demand", icon: Warehouse },
  { id: "storage", label: "Cold Storage", icon: ThermometerSnowflake },
  { id: "vehicles", label: "Vehicle Fleet", icon: Truck },
];

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [batches, setBatches] = useState<ProduceBatchItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerItem[]>([]);
  const [storages, setStorages] = useState<StorageFacilityItem[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicleItem[]>([]);
  const [distributionPlan, setDistributionPlan] = useState<DistributionPlan | null>(null);
  const [workflowData, setWorkflowData] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [latency, setLatency] = useState<number | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] =
    useState<ProduceBatchItem | null>(null);

  const [cropFilter, setCropFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchAllData = useCallback(async () => {
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

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchAllData();
  }, [fetchAllData]);

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

  const tabsWithCounts = TABS.map((t) => {
    let label = t.label;
    if (t.id === "distribution") {
      label = `Distribution Engine (${distributionPlan?.recommendations.length ?? 0})`;
    } else if (t.id === "batches") {
      label = `Produce Batches (${batches.length})`;
    } else if (t.id === "buyers") {
      label = `Buyer Demand (${buyers.length})`;
    } else if (t.id === "storage") {
      label = `Cold Storage (${storages.length})`;
    } else if (t.id === "vehicles") {
      label = `Vehicle Fleet (${vehicles.length})`;
    }
    return { ...t, label };
  });

  return (
    <div className="min-h-screen bg-[#F0FDF4] text-[#14532D]">
      {/* Header */}
      <DashboardHeader
        onRefresh={handleRefresh}
        onRegisterBatch={() => setCreateModalOpen(true)}
        systemStatus={{ status: health?.status ?? null, latency, loading }}
      />

      <div className="border-t border-[#BBF7D0]/60 bg-white/40 backdrop-blur-sm supports-[backdrop-filter]:bg-white/20">
        <TabBar
          tabs={tabsWithCounts as never}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Active Produce"
            value={summary ? `${(summary.total_produce_kg / 1000).toFixed(1)}k` : "--"}
            unit="kg total"
            icon={Truck}
            subtitle={`${summary?.active_batches_count ?? 0} batches logged`}
          />
          <KPICard
            title="Avg Shelf Life"
            value={summary ? `${summary.avg_remaining_shelf_life_days}d` : "--"}
            unit="average"
            trend={{
              label: "critical (<3 days)",
              value: `${summary?.critical_batches_count ?? 0}`,
              positive: false,
            }}
          />
          <KPICard
            title="Buyer Demand"
            value={summary ? `${(summary.buyer_demand.total_demand_kg / 1000).toFixed(1)}k` : "--"}
            unit="kg demand"
            icon={Warehouse}
            subtitle={`${(summary?.buyer_demand.primary_demand_kg ?? 0) / 1000}k retail / ${(summary?.buyer_demand.secondary_demand_kg ?? 0) / 1000}k puree`}
          />
          <KPICard
            title="Cold Storage"
            value={summary ? `${summary.storage.utilization_pct}%` : "--"}
            unit="utilized"
            icon={ThermometerSnowflake}
            subtitle={`${(summary?.storage.available_capacity_kg ?? 0) / 1000}k kg available`}
          />
          <KPICard
            title="Vehicle Fleet"
            value={summary ? `${(summary.vehicles.total_payload_kg / 1000).toFixed(1)}k` : "--"}
            unit="kg payload"
            icon={Truck}
            subtitle={`${summary?.vehicles.refrigerated_count} cold / ${summary?.vehicles.ambient_count} ambient`}
          />
        </section>

        {/* TAB: MISSION CONTROL OVERVIEW */}
        {activeTab === "overview" && (
          <IntegratedMissionControl
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {/* TAB: DYNAMIC REROUTING */}
        {activeTab === "rerouting" && <DynamicReroutingView />}

        {/* TAB: SECONDARY-MARKET RECOVERY */}
        {activeTab === "secondary" && <SecondaryRecoveryView />}

        {/* TAB: SPOILAGE-RISK ENGINE */}
        {activeTab === "spoilage" && <SpoilageSimulator />}

        {/* TAB: DISTRIBUTION ENGINE */}
        {activeTab === "distribution" && (
          <DataCard padding="lg" hover={false}>
            {distributionPlan && (
              <>
                <DataCardHeader
                  title="FEFO-Optimized Allocation Plan"
                  description="Multi-echelon allocation and transportation economics prioritized by basal decay rate and maximum net margin."
                  icon={Route}
                  badge={
                    <div className="flex gap-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        Demand Limits Respected
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        Vehicle Payload Checked
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        Shelf Life Safe
                      </span>
                    </div>
                  }
                />

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 text-xs font-mono border-t border-[#BBF7D0]/50">
                  <div className="text-center">
                    <div className="text-[#9CA3AF] text-[10px]">Allocated Volume</div>
                    <div className="text-lg font-extrabold font-mono text-[#15803D] mt-0.5">
                      {distributionPlan.total_allocated_kg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] text-[10px]">Unallocated Volume</div>
                    <div className="text-lg font-extrabold font-mono text-[#D97706] mt-0.5">
                      {distributionPlan.total_unallocated_kg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] text-[10px]">Expected Gross Revenue</div>
                    <div className="text-lg font-extrabold font-mono text-[#14532D] mt-0.5">
                      ₹{distributionPlan.total_expected_revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] text-[10px]">Transport Cost</div>
                    <div className="text-lg font-extrabold font-mono text-[#DC2626] mt-0.5">
                      ₹{distributionPlan.total_transport_cost.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] text-[10px]">Net Economic Yield</div>
                    <div className="text-lg font-extrabold font-mono text-[#15803D] mt-0.5">
                      ₹{distributionPlan.total_net_margin.toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#14532D] font-mono flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#15803D]" />
                  Recommended Produce Allocations (
                  {distributionPlan?.recommendations.length ?? 0})
                </h3>
                <span className="text-xs font-mono text-[#6B7280]">
                  Prioritized by basal decay rate & maximum net margin
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {distributionPlan?.recommendations.map((rec) => (
                  <DistributionRecommendationCard
                    key={rec.allocation_id}
                    rec={rec}
                  />
                ))}
                {distributionPlan?.recommendations.length === 0 && (
                  <div className="col-span-2 p-8 text-center text-[#6B7280] text-xs font-mono">
                    No distribution recommendations available.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#14532D] font-mono flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#D97706]" />
                      Unallocated Produce Inventory ({distributionPlan?.unallocated_batches.length ?? 0})
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      Buffer Stock
                    </span>
                  </div>
                  <div className="space-y-2">
                    {distributionPlan?.unallocated_batches.map((ub, idx) => (
                      <UnallocatedItem key={idx} item={ub} />
                    ))}
                    {distributionPlan?.unallocated_batches.length === 0 && (
                      <div className="text-xs font-mono text-[#9CA3AF] py-4 text-center">
                        All produce batches fully allocated.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#14532D] font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      Unfulfilled Buyer Demand ({distributionPlan?.unfulfilled_demands.length ?? 0})
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                      Demand Deficit
                    </span>
                  </div>
                  <div className="space-y-2">
                    {distributionPlan?.unfulfilled_demands.map((ud, idx) => (
                      <UnfulfilledItem key={idx} item={ud} />
                    ))}
                    {distributionPlan?.unfulfilled_demands.length === 0 && (
                      <div className="text-xs font-mono text-[#9CA3AF] py-4 text-center">
                        All buyer demand completely fulfilled.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DataCard>
        )}

        {/* TAB: PRODUCE INVENTORY & BATCHES */}
        {activeTab === "batches" && (
          <DataCard padding="none">
            <DataCardHeader
              title="Produce Inventory"
              description="Filter and manage harvested crop batches across the supply chain."
              icon={Truck}
            />

            <div className="p-6 border-b border-[#BBF7D0]/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#9CA3AF]">Filters:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9CA3AF] text-[11px]">Crop:</span>
                    <select
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-[#14532D] text-xs font-mono cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    >
                      <option value="all">All Crops</option>
                      <option value="tomato">Tomato</option>
                      <option value="potato">Potato</option>
                      <option value="onion">Onion</option>
                      <option value="mango">Mango</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9CA3AF] text-[11px]">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-[#14532D] text-xs font-mono cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#15803D]"
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
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onUpdate={(b) => setSelectedBatchForEdit(b)}
                />
              ))}
              {filteredBatches.length === 0 && (
                <div className="col-span-3 p-12 text-center text-[#9CA3AF] text-xs font-mono">
                  No produce batches match the selected filters.
                </div>
              )}
            </div>
          </DataCard>
        )}

        {/* TAB: BUYER DEMAND MATRIX */}
        {activeTab === "buyers" && (
          <DataCard padding="none">
            <DataCardHeader
              title="Buyer Demand Matrix"
              description="Dual-tier arbitrage demand architecture connecting primary retail buyers with secondary processors."
              icon={Warehouse}
            />

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyers.map((b) => (
                <BuyerCard key={b.id} buyer={b} />
              ))}
              {buyers.length === 0 && (
                <div className="col-span-2 p-12 text-center text-[#9CA3AF] text-xs font-mono">
                  No buyer records available.
                </div>
              )}
            </div>
          </DataCard>
        )}

        {/* TAB: COLD STORAGE CAPACITY */}
        {activeTab === "storage" && (
          <DataCard padding="none">
            <DataCardHeader
              title="Cold Storage Facilities"
              description="Cold chain hubs and warehouses with real-time temperature and humidity telemetry."
              icon={ThermometerSnowflake}
            />

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {storages.map((s) => (
                <StorageCard key={s.id} facility={s} />
              ))}
              {storages.length === 0 && (
                <div className="col-span-2 p-12 text-center text-[#9CA3AF] text-xs font-mono">
                  No storage facilities available.
                </div>
              )}
            </div>
          </DataCard>
        )}

        {/* TAB: VEHICLE FLEET & TELEMETRY */}
        {activeTab === "vehicles" && (
          <DataCard padding="none">
            <DataCardHeader
              title="Vehicle Fleet"
              description="Logistics fleet with IoT telemetry, refrigeration specs, and real-time sensor metrics."
              icon={Truck}
            />

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
              {vehicles.length === 0 && (
                <div className="col-span-3 p-12 text-center text-[#9CA3AF] text-xs font-mono">
                  No vehicles available.
                </div>
              )}
            </div>
          </DataCard>
        )}

        {/* TAB: LOGISTICS MAP WITH ARRHENIUS SPOILAGE ROUTING */}
        {activeTab === "logistics-map" && (
          <LogisticsMapView
            recommendations={distributionPlan?.recommendations ?? []}
            batches={batches}
            buyers={buyers}
            vehicles={vehicles}
            storages={storages}
            workflowData={workflowData}
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
          />
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
      <footer className="mt-16 border-t border-[#BBF7D0]/60 py-6 text-center text-xs text-[#6B7280] font-mono">
        <p>HARVEST ZERO © 2026 — Intelligent Post-Harvest Loss Prevention & Kinetic Cold-Chain Logistics</p>
        <p className="mt-1 text-[11px] text-[#9CA3AF]">
          Decision Support Platform for Farmers, Transport Fleets & Multi-Tier Agro Buyers
        </p>
      </footer>
    </div>
  );
}
