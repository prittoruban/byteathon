"use client";

import React, { useCallback, useMemo } from "react";
import {
  Truck,
  Warehouse,
  Sprout,
  ThermometerSnowflake,
  AlertTriangle,
  CheckCircle,
  Flame,
  Scale,
  DollarSign,
  Clock,
  Route,
  Navigation,
  Save,
  ArrowRight,
} from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { KPICard } from "@/components/ui/KPICard";
import { DataCard } from "@/components/ui/DataCard";
import { DataCardHeader } from "@/components/ui/DataCard";

/* ------------------------------------------------------------------ */
/* Client-side Arrhenius kinetic data (mirrors backend spoilage engine) */
/* ------------------------------------------------------------------ */

const R_GAS_CONSTANT = 8.314462618;

const CROP_KINETICS: Record<string, any> = {
  tomato: {
    crop_name: "Tomato",
    reference_temp_celsius: 10.0,
    activation_energy_j_mol: 58000.0,
    base_decay_rate_per_day: 0.0714,
    typical_shelf_life_days: 14.0,
  },
  potato: {
    crop_name: "Potato",
    reference_temp_celsius: 8.0,
    activation_energy_j_mol: 45000.0,
    base_decay_rate_per_day: 0.0111,
    typical_shelf_life_days: 90.0,
  },
  onion: {
    crop_name: "Onion",
    reference_temp_celsius: 4.0,
    activation_energy_j_mol: 42000.0,
    base_decay_rate_per_day: 0.0167,
    typical_shelf_life_days: 60.0,
  },
  mango: {
    crop_name: "Mango",
    reference_temp_celsius: 12.0,
    activation_energy_j_mol: 68000.0,
    base_decay_rate_per_day: 0.0625,
    typical_shelf_life_days: 16.0,
  },
  cabbage: {
    crop_name: "Cabbage",
    reference_temp_celsius: 2.0,
    activation_energy_j_mol: 62000.0,
    base_decay_rate_per_day: 0.05,
    typical_shelf_life_days: 20.0,
  },
};

function getCropKinetic(cropType: string) {
  const key = cropType.trim().toLowerCase();
  for (const [k, v] of Object.entries(CROP_KINETICS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return CROP_KINETICS.tomato;
}

function computeRouteSpoilageRisk(
  cropType: string,
  currentTempCelsius: number,
  transitHours: number,
  remainingShelfLifeDays: number,
  humidityPct: number = 70
) {
  const params = getCropKinetic(cropType);
  const tKelvin = currentTempCelsius + 273.15;
  const tRefKelvin = params.reference_temp_celsius + 273.15;
  const exponent =
    (-params.activation_energy_j_mol / R_GAS_CONSTANT) *
    ((1 / tKelvin) - (1 / tRefKelvin));
  const cappedExponent = Math.max(-15, Math.min(15, exponent));
  const accelerationFactor = Math.exp(cappedExponent);
  const slConsumedDays = (transitHours / 24) * accelerationFactor;
  const updatedRemainingSL = Math.max(0, remainingShelfLifeDays - slConsumedDays);
  const updatedRemainingSLHours = updatedRemainingSL * 24;

  const depletionFraction = 1 - updatedRemainingSL / Math.max(0.1, params.typical_shelf_life_days);
  const baseRisk = Math.max(0, Math.min(1, depletionFraction)) * 70;
  const thermalStressPts = accelerationFactor > 1 ? Math.min(30, (accelerationFactor - 1) * 8) : 0;
  let riskScore = Math.round(Math.min(100, baseRisk + thermalStressPts));

  let riskLevel: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
  let isReroute = false;

  if (updatedRemainingSLHours <= transitHours) {
    riskScore = Math.max(riskScore, 88);
    riskLevel = "CRITICAL";
    isReroute = true;
  } else if (riskScore >= 70) {
    riskLevel = "CRITICAL";
    isReroute = true;
  } else if (riskScore >= 40) {
    riskLevel = "WARNING";
  }

  return {
    riskLevel,
    riskScore,
    accelerationFactor,
    updatedRemainingShelfLifeHours: Math.round(updatedRemainingSLHours * 10) / 10,
    isReroute,
    willSurviveTransit: updatedRemainingSLHours > transitHours,
    safetyMarginHours: Math.round((updatedRemainingSLHours - transitHours) * 10) / 10,
  };
}

function str(val: any): string {
  return String(val ?? "");
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

interface LogisticsMapViewProps {
  recommendations: any[];
  batches: any[];
  buyers: any[];
  vehicles: any[];
  storages: any[];
  workflowData: any | null;
  onNavigateToTab?: (tab: string) => void;
}

export function LogisticsMapView({
  recommendations,
  batches,
  buyers,
  vehicles,
  storages,
  workflowData,
  onNavigateToTab,
}: LogisticsMapViewProps) {
  /* -------- Build coordinate lookup maps -------- */
  const farmerCoords = useMemo(
    () => {
      const map: Record<string, { lat: number; lng: number }> = {};
      batches.forEach((b: any) => {
        const farmers = b.farmers || {};
        map[str(b.id)] = {
          lat: Number(b.latitude ?? farmers.latitude ?? 19.9975),
          lng: Number(b.longitude ?? farmers.longitude ?? 73.7898),
        };
      });
      return map;
    },
    [batches]
  );

  const buyerCoords = useMemo(
    () => {
      const map: Record<string, { lat: number; lng: number }> = {};
      buyers.forEach((b: any) => {
        map[str(b.id)] = {
          lat: Number(b.latitude ?? 19.076),
          lng: Number(b.longitude ?? 72.8777),
        };
      });
      return map;
    },
    [buyers]
  );

  const vehicleCoords = useMemo(
    () => {
      const map: Record<string, { lat: number; lng: number }> = {};
      vehicles.forEach((v: any) => {
        map[str(v.id)] = {
          lat: Number(v.current_latitude ?? 19.98),
          lng: Number(v.current_longitude ?? 73.79),
        };
      });
      return map;
    },
    [vehicles]
  );

  const batchLookup = useMemo(
    () => {
      const map: Record<string, any> = {};
      batches.forEach((b: any) => (map[str(b.id)] = b));
      return map;
    },
    [batches]
  );

  /* -------- Build markers from raw entity data -------- */
  const markers = useMemo(() => {
    const markerList: any[] = [];

    batches.forEach((b: any) => {
      const farmers = b.farmers || {};
      const lat = b.latitude ?? farmers.latitude ?? 19.9975;
      const lng = b.longitude ?? farmers.longitude ?? 73.7898;
      markerList.push({
        id: `farmer-${b.id}`,
        lat: Number(lat) || 19.9975,
        lng: Number(lng) || 73.7898,
        label: farmers.name || "Regional Farmer",
        type: "farmer",
        crop: b.crop_type,
        status: b.status,
      });
    });

    buyers.forEach((b: any) => {
      const lat = b.latitude ?? 19.076;
      const lng = b.longitude ?? 72.8777;
      markerList.push({
        id: `buyer-${b.id}`,
        lat: Number(lat) || 19.076,
        lng: Number(lng) || 72.8777,
        label: b.name,
        type: "buyer",
        crop: b.demand_crop,
      });
    });

    storages.forEach((s: any) => {
      const lat = s.latitude ?? 20.001;
      const lng = s.longitude ?? 73.81;
      markerList.push({
        id: `storage-${s.id}`,
        lat: Number(lat) || 20.001,
        lng: Number(lng) || 73.81,
        label: s.name,
        type: "storage",
        status: `${Math.round((s.current_utilization_kg / s.total_capacity_kg) * 100)}% utilized`,
      });
    });

    vehicles.forEach((v: any) => {
      const lat = v.current_latitude ?? 19.98;
      const lng = v.current_longitude ?? 73.79;
      markerList.push({
        id: `vehicle-${v.id}`,
        lat: Number(lat) || 19.98,
        lng: Number(lng) || 73.79,
        label: v.vehicle_number,
        type: "vehicle",
        status: v.status,
        isRefrigerated: v.is_refrigerated,
        currentTemp: v.current_temp_celsius,
      });
    });

    return markerList;
  }, [batches, buyers, storages, vehicles]);

  /* -------- Transform recommendations into MapRoute objects with spoilage risk -------- */
  const mapRoutes = useMemo(() => {
    const workflowRerouteBuyerId = workflowData?.reroute_recommendation?.recommended_destination?.buyer_id;

    return recommendations.map((rec: any) => {
      const originCoord = farmerCoords[rec.farmer_id] || { lat: 19.9975, lng: 73.7898 };
      const destCoord = buyerCoords[rec.buyer_id] || { lat: 19.076, lng: 72.8777 };
      const vehicleCoord = vehicleCoords[rec.vehicle_id] || { lat: 19.98, lng: 73.79 };
      const batch = batchLookup[rec.batch_id];

      const remainingShelfLifeDays = batch
        ? Number(batch.remaining_shelf_life_days || 5)
        : 5;
      const currentTemp = vehicleCoord ? (batch ? 8.5 : 24) : 24;

      const spoilage = computeRouteSpoilageRisk(
        rec.crop_type,
        currentTemp,
        rec.estimated_transit_hours,
        remainingShelfLifeDays
      );

      const isWorkflowReroute =
        workflowData?.reroute_recommendation &&
        str(rec.buyer_id) === str(workflowRerouteBuyerId);

      return {
        id: rec.allocation_id,
        origin: {
          lat: originCoord.lat,
          lng: originCoord.lng,
          name: rec.farmer_name,
        },
        destination: {
          lat: destCoord.lat,
          lng: destCoord.lng,
          name: rec.buyer_name,
        },
        cropType: rec.crop_type,
        quantityKg: rec.allocated_quantity_kg,
        distanceKm: rec.distance_km,
        transitHours: rec.estimated_transit_hours,
        netMargin: rec.net_margin,
        shelfLifeMarginHours: rec.shelf_life_margin_hours,
        buyerType: rec.buyer_type,
        vehicleNumber: rec.vehicle_number,
        isRefrigerated: rec.is_refrigerated,
        spoilageRiskScore: spoilage.riskScore,
        riskLevel: spoilage.riskLevel,
        isReroute: spoilage.isReroute || isWorkflowReroute,
        explanation: rec.explanation || "",
        accelerationFactor: spoilage.accelerationFactor,
        updatedRemainingShelfLifeHours: spoilage.updatedRemainingShelfLifeHours,
      };
    });
  }, [recommendations, farmerCoords, buyerCoords, vehicleCoords, batchLookup, workflowData]);

  /* -------- Summary stats -------- */
  const totalRoutes = mapRoutes.length;
  const criticalRoutes = mapRoutes.filter((r) => r.riskLevel === "CRITICAL").length;
  const warningRoutes = mapRoutes.filter((r) => r.riskLevel === "WARNING").length;
  const safeRoutes = mapRoutes.filter((r) => r.riskLevel === "SAFE").length;
  const rerouteRoutes = mapRoutes.filter((r) => r.isReroute).length;
  const totalDistance = mapRoutes.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalMargin = mapRoutes.reduce((sum, r) => sum + r.netMargin, 0);

  /* -------- Handle route click -------- */
  const handleRouteClick = useCallback((route: any) => {
    console.log("Route clicked:", route);
  }, []);

  const riskColors: Record<string, string> = {
    SAFE: "#15803D",
    WARNING: "#D97706",
    CRITICAL: "#DC2626",
  };

  return (
    <div className="space-y-6">
      {/* Map Header with KPI strip */}
      <DataCardHeader
        title="Logistics Route Map"
        description="Real-time geospatial visualization of distribution routes with Arrhenius-based spoilage risk coloring. Routes are color-coded: green = safe, amber = warning, red = critical (reroute recommended)."
        icon={Route}
        badge={
          <div className="flex gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]">
              {totalRoutes} Active Routes
            </span>
            {rerouteRoutes > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]">
                {rerouteRoutes} Reroute(s)
              </span>
            )}
          </div>
        }
      />

      {/* Route KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard
          title="Total Routes"
          value={totalRoutes.toString()}
          unit="allocations"
          icon={Route}
        />
        <KPICard
          title="Safe Routes"
          value={safeRoutes.toString()}
          trend={{
            label: "of total",
            value: (totalRoutes > 0 ? Math.round((safeRoutes / totalRoutes) * 100) : 0).toString(),
            positive: true,
          }}
        />
        <KPICard
          title="Warning Routes"
          value={warningRoutes.toString()}
          trend={{
            label: "review needed",
            value: warningRoutes.toString(),
            positive: false,
          }}
        />
        <KPICard
          title="Critical Routes"
          value={criticalRoutes.toString()}
          trend={{
            label: "reroute required",
            value: criticalRoutes.toString(),
            positive: false,
          }}
        />
        <KPICard
          title="Total Distance"
          value={totalDistance.toLocaleString()}
          unit="km across fleet"
          icon={Truck}
        />
      </div>

      {/* Map + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
        {/* Map (8 columns) */}
        <div className="lg:col-span-8">
          <RouteMap
            recommendations={mapRoutes}
            markers={markers}
            workflowData={workflowData}
            onRouteClick={handleRouteClick}
            className="h-[650px]"
          />
        </div>

        {/* Route Details Panel (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Spoilage Legend */}
          <DataCard padding="md" hover={false}>
            <DataCardHeader
              title="Spoilage Risk Legend"
              description="Routes colored by Arrhenius degradation risk at current vehicle temperature."
              icon={Flame}
            />
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#D1FAE5] border border-[#A7F3D0]">
                <span className="w-3 h-3 rounded-full bg-[#15803D]" />
                <span>SAFE — Shelf life exceeds transit + buffer</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A]">
                <span className="w-3 h-3 rounded-full bg-[#D97706]" />
                <span>WARNING — Tight margin, monitor closely</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FEE2E2] border border-[#FECACA]">
                <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                <span>CRITICAL — Will expire in transit, reroute</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FDF4E3] border border-[#FDE68A]">
                <span className="w-3 h-3 rounded-full bg-[#A16207]" />
                <span>REROUTE — Dynamic diversion active</span>
              </div>
            </div>
          </DataCard>

          {/* Active Routes List */}
          <DataCard padding="none">
            <DataCardHeader
              title="Active Distribution Routes"
              description={
                mapRoutes.length === 0
                  ? "No routes available. Run distribution optimization first."
                  : `Click any route on the map for details.`
              }
              icon={Navigation}
            />
            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {mapRoutes.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#9CA3AF] font-mono">
                  No active distribution routes.
                </div>
              ) : (
                mapRoutes.map((route) => {
                  const riskColor = riskColors[route.riskLevel];
                  return (
                    <div
                      key={route.id}
                      className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all duration-200 ${
                        route.isReroute
                          ? "bg-[#FDF4E3] border-[#A16207]/50"
                          : route.riskLevel === "CRITICAL"
                          ? "bg-[#FEE2E2] border-[#DC2626]/50"
                          : route.riskLevel === "WARNING"
                          ? "bg-[#FEF3C7] border-[#D97706]/50"
                          : "bg-[#F0FDF4] border-[#15803D]/50"
                      }`}
                      onClick={() => handleRouteClick(route)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#14532D] font-mono">
                            {route.cropType}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            route.buyerType === "primary_retail"
                              ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                              : "bg-[#FDF4E3] text-[#92400E] border-[#FDE68A]"
                          }`}>
                            {route.buyerType === "primary_retail" ? "Primary" : "Secondary"}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${riskColor}`}>
                          {route.riskLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono text-[#6B7280] mb-1">
                        <span>{route.origin.name}</span>
                        <ArrowRight className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{route.destination.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div>
                          <div className="text-[#9CA3AF]">Distance</div>
                          <div className="font-bold text-[#14532D]">{route.distanceKm} km</div>
                        </div>
                        <div>
                          <div className="text-[#9CA3AF]">Transit</div>
                          <div className="font-bold text-[#14532D]">{route.transitHours}h</div>
                        </div>
                        <div>
                          <div className="text-[#9CA3AF]">Margin</div>
                          <div className="font-bold text-[#15803D]">₹{route.netMargin.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className={`text-[10px] font-mono font-bold ${riskColor}`}>
                          Spoilage: {route.spoilageRiskScore}/100
                        </span>
                        {route.accelerationFactor && (
                          <span className="text-[10px] text-[#6B7280]">
                            • {route.accelerationFactor}x decay
                          </span>
                        )}
                        {route.isReroute && (
                          <span className="text-[10px] font-mono font-bold text-[#A16207]">
                            • REROUTE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DataCard>

          {/* Quick Actions */}
          <DataCard padding="md" hover={false}>
            <DataCardHeader
              title="Map Actions"
              description="Interact with the logistics map and distribution engine."
              icon={Save}
            />
            <div className="p-4 space-y-3">
              <button
                onClick={() => onNavigateToTab?.("distribution")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] font-semibold text-xs hover:bg-[#DCFCE7] transition-colors cursor-pointer"
              >
                <Route className="w-4 h-4" />
                View Distribution Engine
              </button>
              <button
                onClick={() => onNavigateToTab?.("rerouting")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] font-semibold text-xs hover:bg-[#DCFCE7] transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                Dynamic Rerouting
              </button>
              {workflowData && (
                <button
                  onClick={() => onNavigateToTab?.("overview")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] font-semibold text-xs hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  View Mission Control
                </button>
              )}
            </div>
          </DataCard>
        </div>
      </div>
    </div>
  );
}
