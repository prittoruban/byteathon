"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Route,
  Truck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Clock,
  RefreshCw,
  Warehouse,
  Check,
  Save,
  ShieldCheck,
  Navigation,
} from "lucide-react";

interface ShipmentItem {
  id: string;
  batch_id: string;
  vehicle_id: string;
  origin_type: string;
  origin_id: string;
  destination_buyer_id: string;
  original_buyer_id: string | null;
  allocated_quantity_kg: number;
  transit_distance_km: number;
  estimated_transit_hours: number;
  current_spoilage_risk_score: number;
  status: string;
  reroute_reason: string | null;
  created_at: string;
  produce_batches?: {
    id: string;
    crop_type: string;
    quantity_kg: number;
    initial_shelf_life_days: number;
    remaining_shelf_life_days: number;
  };
  transport_vehicles?: {
    id: string;
    vehicle_number: string;
    is_refrigerated: boolean;
    current_temp_celsius: number;
    current_humidity_pct: number;
    current_latitude: number;
    current_longitude: number;
    cost_per_km: number;
  };
  destination_buyer?: {
    id: string;
    name: string;
    type: string;
    location: string;
    latitude: number;
    longitude: number;
    offered_price_per_kg: number;
    demand_crop: string;
    demand_kg: number;
  };
  original_buyer?: {
    id: string;
    name: string;
    type: string;
    location: string;
  };
}

interface CandidateBuyerEvaluation {
  buyer_id: string;
  buyer_name: string;
  buyer_type: string;
  location: string;
  offered_price_per_kg: number;
  demand_kg: number;
  distance_km: number;
  estimated_transit_hours: number;
  transport_cost: number;
  expected_gross_revenue: number;
  net_margin: number;
  remaining_shelf_life_hours_at_arrival: number;
  safety_margin_hours: number;
  is_viable: boolean;
  viability_reason: string;
}

interface OriginalDestinationEvaluation {
  buyer_id: string;
  buyer_name: string;
  buyer_type: string;
  location: string;
  distance_km: number;
  estimated_transit_hours: number;
  current_spoilage_risk_score: number;
  risk_level: string;
  remaining_shelf_life_hours_at_arrival: number;
  safety_margin_hours: number;
  will_spoil_in_transit: boolean;
  is_sustainable: boolean;
  transport_cost: number;
  expected_gross_revenue: number;
  net_margin: number;
  status_explanation: string;
}

interface RerouteRecommendation {
  recommendation_id: string;
  shipment_id: string;
  batch_id: string;
  crop_type: string;
  quantity_kg: number;
  vehicle_id: string;
  vehicle_number: string;
  current_temp_celsius: number;
  current_humidity_pct: number;
  trigger_event: string;
  action_recommended: string;
  original_destination: OriginalDestinationEvaluation;
  recommended_destination: CandidateBuyerEvaluation | null;
  candidate_evaluations: CandidateBuyerEvaluation[];
  comparison_summary: {
    original_distance_km: number;
    recommended_distance_km: number;
    distance_saved_km: number;
    transit_hours_saved: number;
    original_net_margin: number;
    salvaged_net_margin: number;
    economic_value_preserved: number;
    risk_level_at_decision: string;
  };
  explainable_rationale: string;
  created_at: string;
}

export function DynamicReroutingView() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);

  // Simulation & Evaluation state
  const [recommendation, setRecommendation] = useState<RerouteRecommendation | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [persisting, setPersisting] = useState<boolean>(false);
  const [persistSuccess, setPersistSuccess] = useState<string | null>(null);

  // Simulated thermal spike input
  const [simulatedTemp, setSimulatedTemp] = useState<number>(36.5);
  const [triggerReason, setTriggerReason] = useState<string>(
    "Refrigeration compressor failure reported by IoT cabin sensor"
  );

  const fetchActiveShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/shipments/active`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
        if (data.length > 0 && !selectedShipment) {
          setSelectedShipment(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load active shipments:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, selectedShipment]);

  useEffect(() => {
    fetchActiveShipments();
  }, [fetchActiveShipments]);

  // Run dynamic rerouting evaluation
  const handleEvaluateReroute = async (overrideTemp?: number) => {
    if (!selectedShipment) return;
    setEvaluating(true);
    setPersistSuccess(null);

    const tempToUse = overrideTemp !== undefined ? overrideTemp : simulatedTemp;

    try {
      const res = await fetch(
        `${backendUrl}/api/rerouting/evaluate/${selectedShipment.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_temp_celsius: tempToUse,
            current_humidity_pct: 70.0,
            trigger_reason: triggerReason,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRecommendation(data);
      }
    } catch (err) {
      console.error("Failed to evaluate dynamic reroute:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Confirm and persist rerouting to Supabase
  const handleConfirmReroute = async () => {
    if (!selectedShipment || !recommendation) return;
    setPersisting(true);
    setPersistSuccess(null);

    try {
      const res = await fetch(
        `${backendUrl}/api/rerouting/confirm/${selectedShipment.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recommendation),
        }
      );

      if (res.ok) {
        const result = await res.json();
        setPersistSuccess(
          `Shipment status updated to 'rerouted' in Supabase! New destination: ${recommendation.recommended_destination?.buyer_name}.`
        );
        fetchActiveShipments();
      } else {
        const err = await res.json();
        alert(`Error persisting reroute: ${err.detail || "Database failure"}`);
      }
    } catch (err) {
      console.error("Failed to persist reroute:", err);
      alert("Network error persisting reroute decision.");
    } finally {
      setPersisting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-medium mb-3">
              <Route className="w-3.5 h-3.5" />
              Quality-Driven Dynamic Rerouting Engine
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              In-Transit Thermal Anomaly Mitigation
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              When in-transit refrigeration breaks down or traffic delays occur, the Arrhenius engine
              re-evaluates perishable quality, discovers closer alternative buyers (primary retail & secondary processors),
              and executes autonomous salvage rerouting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEvaluateReroute(36.5)}
              disabled={evaluating || !selectedShipment}
              className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98] border border-rose-500 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Simulate +36.5°C Compressor Breakdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Consignments & Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Active In-Transit Consignments
              </h3>
              <button
                onClick={fetchActiveShipments}
                className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {shipments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active shipments in transit.
              </div>
            ) : (
              <div className="space-y-3">
                {shipments.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  const isRerouted = s.status === "rerouted";
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedShipment(s);
                        setRecommendation(null);
                        setPersistSuccess(null);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-800/90 border-emerald-500 shadow-md"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-100">
                          {s.transport_vehicles?.vehicle_number || "MH-15-TC-1088"}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                            isRerouted
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : s.status === "in_transit"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payload:</span>
                          <span className="font-mono">
                            {s.allocated_quantity_kg.toLocaleString()} kg {s.produce_batches?.crop_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Destination:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[160px]">
                            {s.destination_buyer?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cabin Temp:</span>
                          <span className="font-mono text-cyan-300">
                            {s.transport_vehicles?.current_temp_celsius ?? 8.5}°C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Remaining Life:</span>
                          <span className="font-mono text-emerald-400">
                            {s.produce_batches?.remaining_shelf_life_days ?? 4.0} days
                          </span>
                        </div>
                      </div>

                      {s.reroute_reason && (
                        <div className="mt-2.5 p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200 leading-tight">
                          <span className="font-semibold block mb-0.5">Reroute Audit:</span>
                          {s.reroute_reason.slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Telemetry Simulator Box */}
          {selectedShipment && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Simulate In-Transit Thermal Breakdown
              </h4>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Spike Temperature:</span>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    {simulatedTemp.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="0.5"
                  value={simulatedTemp}
                  onChange={(e) => setSimulatedTemp(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>15°C (Mild Warmth)</span>
                  <span>36°C (Engine Heat)</span>
                  <span>45°C (Extreme)</span>
                </div>
              </div>

              <button
                onClick={() => handleEvaluateReroute()}
                disabled={evaluating}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
              >
                <Route className="w-3.5 h-3.5" />
                <span>
                  {evaluating ? "Evaluating Arrhenius Kinetics..." : "Evaluate Reroute Feasibility"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Rerouting Evaluation & Candidate Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {persistSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-start gap-3 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">Database Persistence Confirmed:</span>
                <p className="mt-0.5">{persistSuccess}</p>
              </div>
            </div>
          )}

          {recommendation ? (
            <div className="space-y-6">
              {/* Decision Banner */}
              <div
                className={`p-6 rounded-xl border transition-all ${
                  recommendation.action_recommended === "EXECUTE_DYNAMIC_REROUTE"
                    ? "bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/60 border-rose-800/80"
                    : "bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-800/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {recommendation.action_recommended === "EXECUTE_DYNAMIC_REROUTE" ? (
                      <div className="p-3 rounded-xl bg-rose-900/60 text-rose-300 border border-rose-700">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase mb-1">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            recommendation.action_recommended === "EXECUTE_DYNAMIC_REROUTE"
                              ? "bg-rose-900 text-rose-200"
                              : "bg-emerald-900 text-emerald-200"
                          }`}
                        >
                          {recommendation.action_recommended.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {recommendation.action_recommended === "EXECUTE_DYNAMIC_REROUTE"
                          ? `Divert to ${recommendation.recommended_destination?.buyer_name}`
                          : "Maintain Original Consignment Path"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        Trigger: {recommendation.trigger_event}
                      </p>
                    </div>
                  </div>

                  {recommendation.action_recommended === "EXECUTE_DYNAMIC_REROUTE" && (
                    <button
                      onClick={handleConfirmReroute}
                      disabled={persisting}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>{persisting ? "Persisting..." : "Confirm & Persist to Supabase"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison: Original vs Recommended */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Destination */}
                <div
                  className={`p-5 rounded-xl border space-y-3 ${
                    recommendation.original_destination.is_sustainable
                      ? "bg-slate-900 border-slate-800"
                      : "bg-rose-950/20 border-rose-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                      Original Destination
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        recommendation.original_destination.is_sustainable
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {recommendation.original_destination.is_sustainable
                        ? "SUSTAINABLE"
                        : "UNSUSTAINABLE / WRITE-OFF"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {recommendation.original_destination.buyer_name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {recommendation.original_destination.buyer_type} • {recommendation.original_destination.location}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distance & ETA:</span>
                      <span className="font-mono">
                        {recommendation.original_destination.distance_km} km ({recommendation.original_destination.estimated_transit_hours}h)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Arrival Shelf Life:</span>
                      <span
                        className={`font-mono font-bold ${
                          recommendation.original_destination.safety_margin_hours < 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {recommendation.original_destination.remaining_shelf_life_hours_at_arrival}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Net Margin:</span>
                      <span className="font-mono font-semibold">
                        ₹{recommendation.original_destination.net_margin.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 leading-relaxed">
                    {recommendation.original_destination.status_explanation}
                  </p>
                </div>

                {/* Recommended Alternative Destination */}
                {recommendation.recommended_destination ? (
                  <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-700/60 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                        Recommended Diversion Destination
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-semibold border border-emerald-700">
                        SALVAGE SECURED
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        {recommendation.recommended_destination.buyer_name}
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {recommendation.recommended_destination.buyer_type} • {recommendation.recommended_destination.location}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Distance & ETA:</span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          {recommendation.recommended_destination.distance_km} km ({recommendation.recommended_destination.estimated_transit_hours}h)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hours Saved:</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          +{recommendation.comparison_summary.transit_hours_saved}h faster
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Salvaged Net Yield:</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          ₹{recommendation.recommended_destination.net_margin.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-300/90 pt-2 border-t border-emerald-800/40 leading-relaxed">
                      {recommendation.recommended_destination.viability_reason}
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-400">
                    No viable alternative buyers discovered within reach.
                  </div>
                )}
              </div>

              {/* Explainable Decision Rationale Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Autonomous Decision Rationale (Explainable AI):
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {recommendation.explainable_rationale}
                </p>
              </div>

              {/* Candidate Buyers Matrix Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Alternative Buyers Evaluated ({recommendation.candidate_evaluations.length})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Multi-criteria evaluation: crop match, distance, transport freight, and Arrhenius quality margins.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                        <th className="py-2.5 px-3">Buyer</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Distance</th>
                        <th className="py-2.5 px-3">Transit</th>
                        <th className="py-2.5 px-3">Price/kg</th>
                        <th className="py-2.5 px-3">Net Yield</th>
                        <th className="py-2.5 px-3">Viability Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                      {recommendation.candidate_evaluations.map((c) => (
                        <tr
                          key={c.buyer_id}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            c.is_viable ? "bg-emerald-950/10" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-100">
                            {c.buyer_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {c.buyer_type}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{c.distance_km} km</td>
                          <td className="py-2.5 px-3 font-mono">{c.estimated_transit_hours}h</td>
                          <td className="py-2.5 px-3 font-mono">₹{c.offered_price_per_kg}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                            ₹{c.net_margin.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] max-w-xs truncate" title={c.viability_reason}>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono mr-1.5 ${
                                c.is_viable
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : "bg-rose-950 text-rose-300 border border-rose-800"
                              }`}
                            >
                              {c.is_viable ? "VIABLE" : "REJECTED"}
                            </span>
                            <span className="text-slate-400">{c.viability_reason}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <div className="p-3 rounded-full bg-slate-800 text-slate-400">
                <Route className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-base font-semibold text-slate-200">
                Dynamic Rerouting Engine Ready
              </h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Select an active consignment on the left and click{" "}
                <span className="font-semibold text-rose-400">
                  &quot;Simulate +36.5°C Compressor Breakdown&quot;
                </span>{" "}
                to observe autonomous quality-driven rerouting in action.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
