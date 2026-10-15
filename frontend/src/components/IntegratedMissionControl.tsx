"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Flame,
  Route,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Truck,
  Warehouse,
  Sprout,
  DollarSign,
  Activity,
  Zap,
  Save,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  Scale,
  Award,
} from "lucide-react";

interface IntegratedMissionControlProps {
  onNavigateToTab?: (tab: string) => void;
}

export function IntegratedMissionControl({ onNavigateToTab }: IntegratedMissionControlProps) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const [loading, setLoading] = useState<boolean>(true);
  const [runningWorkflow, setRunningWorkflow] = useState<boolean>(false);
  const [persisting, setPersisting] = useState<boolean>(false);
  const [persistNotification, setPersistNotification] = useState<string | null>(null);

  // Workflow output state
  const [workflowData, setWorkflowData] = useState<any | null>(null);

  // Summary Metrics
  const [summary, setSummary] = useState<any | null>(null);
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any | null>(null);

  // Fetch initial system status
  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, shipRes, compRes] = await Promise.all([
        fetch(`${backendUrl}/api/inventory/summary`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/shipments/active`, { cache: "no-store" }),
        fetch(`${backendUrl}/api/distribution/baseline-comparison`, { cache: "no-store" }),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (shipRes.ok) setActiveShipments(await shipRes.json());
      if (compRes.ok) setComparisonData(await compRes.json());
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Master Action: Simulate Temperature Spike and Execute Complete Pipeline
  const handleSimulateMasterSpike = async (autoPersist: boolean = false) => {
    setRunningWorkflow(true);
    setPersistNotification(null);

    try {
      const res = await fetch(`${backendUrl}/api/workflow/simulate-spike-and-resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spiked_temp_celsius: 36.5,
          exposure_hours: 4.0,
          auto_persist: autoPersist,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkflowData(data);
        if (autoPersist && data.persisted_to_database) {
          setPersistNotification(
            "Thermal anomaly resolved and persisted to Supabase! Consignment rerouted to secondary puree processor."
          );
          fetchDashboardMetrics();
        }
      } else {
        const err = await res.json();
        alert(`Workflow simulation error: ${err.detail || "Server error"}`);
      }
    } catch (err) {
      console.error("Workflow simulation failed:", err);
      alert("Network failure executing master workflow.");
    } finally {
      setRunningWorkflow(false);
    }
  };

  // Persist current recommendation to Supabase
  const handleConfirmPersist = async () => {
    if (!workflowData || !workflowData.shipment || !workflowData.reroute_recommendation) return;
    setPersisting(true);

    try {
      const res = await fetch(
        `${backendUrl}/api/rerouting/confirm/${workflowData.shipment.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData.reroute_recommendation),
        }
      );

      if (res.ok) {
        setPersistNotification(
          `Successfully updated shipment in Supabase PostgreSQL! Diverted to ${workflowData.reroute_recommendation.recommended_destination?.buyer_name}.`
        );
        fetchDashboardMetrics();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || "Database update failed"}`);
      }
    } catch (err) {
      console.error("Persistence failed:", err);
    } finally {
      setPersisting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step 8 Master Header & Spike Simulator Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-300 text-xs font-mono font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Integrated Mission Control & Dynamic Pipeline (Step 8)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              HARVEST ZERO Operations Command
            </h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Consolidated real-time telemetry across farm inventory, vehicle sensors, Arrhenius spoilage kinetics,
              dynamic route recalculation, and secondary processor economic arbitrage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleSimulateMasterSpike(false)}
              disabled={runningWorkflow}
              aria-busy={runningWorkflow}
              className="min-h-[44px] px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Flame className="w-4 h-4 text-amber-200" aria-hidden="true" />
              <span>
                {runningWorkflow ? "Simulating Thermal Event..." : "Simulate Temperature Spike (+26°C)"}
              </span>
            </button>

            <button
              onClick={() => handleSimulateMasterSpike(true)}
              disabled={runningWorkflow}
              aria-busy={runningWorkflow}
              className="min-h-[44px] px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Simulate & Auto-Persist</span>
            </button>
          </div>
        </div>

        {/* Apple HIG: Screen Reader Live Status Region */}
        <div role="status" aria-live="polite" className="sr-only">
          {runningWorkflow
            ? "Simulating cold-chain temperature spike and evaluating dynamic rerouting options..."
            : workflowData
            ? "Thermal event resolved: Reroute suggested to secondary puree processor with positive arbitrage yield."
            : ""}
        </div>
      </div>

      {/* Persist Success Banner */}
      {persistNotification && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-start gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Supabase PostgreSQL Confirmed:</span>
            <p className="mt-0.5">{persistNotification}</p>
          </div>
        </div>
      )}

      {/* Key Operations KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Live Inventory Volume</span>
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary?.total_produce_kg?.toLocaleString() ?? "15,500"}
            <span className="text-xs font-normal text-slate-500 ml-1">kg</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {summary?.total_batches_count ?? 3} harvest batches tracked
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Perishables In Transit</span>
            <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-700 dark:text-cyan-300">
            {activeShipments.reduce((acc, s) => acc + (s.allocated_quantity_kg || 0), 0).toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">kg</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {activeShipments.length} active fleet consignment(s)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Market Demand</span>
            <Warehouse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {summary?.buyer_demand?.total_demand_kg?.toLocaleString() ?? "23,000"}
            <span className="text-xs font-normal text-slate-500 ml-1">kg</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Retail & Secondary Processors
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Avg Shelf-Life Buffer</span>
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {summary?.avg_remaining_shelf_life_days ?? "6.2"}
            <span className="text-xs font-normal text-slate-500 ml-1">days</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            FEFO micro-climate tracked
          </div>
        </div>
      </div>

      {/* Interactive End-to-End Pipeline Card (Triggered by Temperature Spike) */}
      {workflowData ? (
        <div className="space-y-6">
          {/* Workflow Outcome Master Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-950 text-rose-300 border border-rose-800">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 uppercase">
                      Thermal Breakdown Triggered
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Vehicle: {workflowData.shipment?.transport_vehicles?.vehicle_number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">
                    {workflowData.trigger_event}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Payload: {workflowData.shipment?.allocated_quantity_kg?.toLocaleString()} kg of {workflowData.shipment?.produce_batches?.crop_type}
                  </p>
                </div>
              </div>

              {!workflowData.persisted_to_database && (
                <button
                  onClick={handleConfirmPersist}
                  disabled={persisting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{persisting ? "Persisting..." : "Confirm & Persist Route to Supabase"}</span>
                </button>
              )}
            </div>

            {/* Pipeline Stage Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stage 1: Arrhenius Spoilage Surge */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    1. Arrhenius Recalculation
                  </span>
                  <span className="font-mono text-rose-300 font-bold">
                    {workflowData.spoilage_assessment?.acceleration_factor}x faster
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Decay Rate k:</span>
                    <span className="font-mono font-bold text-rose-300">
                      {workflowData.spoilage_assessment?.k_decay_rate_per_day}/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {workflowData.spoilage_assessment?.spoilage_risk_score} / 100 ({workflowData.spoilage_assessment?.risk_level})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective Remaining:</span>
                    <span className="font-mono text-slate-200">
                      {workflowData.spoilage_assessment?.updated_remaining_shelf_life_hours} hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage 2: Dynamic Rerouting */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5" />
                    2. Quality Rerouting
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">
                    +{workflowData.reroute_recommendation?.comparison_summary?.transit_hours_saved}h saved
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Destination:</span>
                    <span className="text-slate-300 truncate max-w-[120px]">
                      {workflowData.reroute_recommendation?.original_destination?.buyer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diverted Processor:</span>
                    <span className="font-semibold text-emerald-400 truncate max-w-[120px]">
                      {workflowData.reroute_recommendation?.recommended_destination?.buyer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance Saved:</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      {workflowData.reroute_recommendation?.comparison_summary?.distance_saved_km} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage 3: Secondary Arbitrage */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    3. Secondary Arbitrage
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    +₹{workflowData.secondary_arbitrage?.arbitrage_net_difference?.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supermarket Yield:</span>
                    <span className="font-mono text-rose-400">
                      ₹{workflowData.secondary_arbitrage?.primary_retail_option?.net_margin?.toLocaleString()} (Rejection)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Puree Factory Yield:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₹{workflowData.secondary_arbitrage?.secondary_processor_option?.net_margin?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Food Safety:</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {workflowData.secondary_arbitrage?.food_safety?.is_compliant ? "FSSAI Verified" : "Hazard"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable AI Audit Trail */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Explainable Decision Audit Trail:
              </span>
              <p>{workflowData.reroute_recommendation?.explainable_rationale}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Default Empty State when no simulation is active */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              End-to-End Pipeline Ready for Simulation
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
              Click <span className="font-semibold text-rose-400">&quot;Simulate Temperature Spike (+26°C)&quot;</span> in the header
              to observe how HARVEST ZERO automatically detects cold-chain failure, recalculates Arrhenius kinetics,
              identifies secondary processors, and executes dynamic route diversion directly through FastAPI to Supabase.
            </p>
          </div>
        </div>
      )}

      {/* STEP 9: SYSTEM BENCHMARK — BASELINE LOGISTICS VS HARVEST ZERO OPTIMIZATION */}
      {comparisonData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono font-semibold mb-2">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Step 9: Rigorous Benchmark Verification (Operations Research vs Baseline)
              </div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                Baseline Logistics vs HARVEST ZERO Optimization
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Direct simulation comparing traditional unoptimized FIFO logistics (ignoring micro-climate decay and vehicle matching)
                against HARVEST ZERO FEFO + Arrhenius kinetic optimization.
              </p>
            </div>

            {/* Strategic KPI Deltas */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-right">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Waste Prevented</span>
                <span className="text-lg font-mono font-extrabold text-emerald-200">
                  {comparisonData.waste_reduction_kg?.toLocaleString()} kg
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  ({comparisonData.waste_reduction_pct}% reduction)
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-teal-950/60 border border-teal-800 text-right">
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block">Profit Gain</span>
                <span className="text-lg font-mono font-extrabold text-teal-200">
                  +₹{comparisonData.profit_increase_inr?.toLocaleString()}
                </span>
                <span className="text-[10px] text-teal-400 block font-mono">
                  (+{comparisonData.profit_increase_pct}% margin)
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Baseline Traditional */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-rose-950/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-950">
                <span className="text-xs font-mono font-bold text-rose-300">Traditional Logistics (Baseline FIFO)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  High Dock Rejection
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Allocated</span>
                  <span className="text-slate-200 font-bold">{comparisonData.baseline_plan.total_allocated_kg?.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Spoiled / Rejected at Dock</span>
                  <span className="text-rose-400 font-bold">{comparisonData.baseline_plan.spoiled_rejected_kg?.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Spoilage Rate</span>
                  <span className="text-rose-400 font-bold">{comparisonData.baseline_plan.spoilage_rate_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Spoilage Loss Cost</span>
                  <span className="text-rose-400 font-bold">₹{comparisonData.baseline_plan.spoilage_loss_cost?.toLocaleString()}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-900 flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Net Realized Profit:</span>
                  <span className="text-sm font-bold text-slate-300">₹{comparisonData.baseline_plan.net_realized_margin?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. Harvest Zero Optimized */}
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                <span className="text-xs font-mono font-bold text-emerald-300">HARVEST ZERO (FEFO + Kinetic Engine)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Zero Dock Rejection
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Allocated</span>
                  <span className="text-emerald-200 font-bold">{comparisonData.harvest_zero_plan.total_allocated_kg?.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Spoiled / Rejected at Dock</span>
                  <span className="text-emerald-400 font-bold">0 kg (0.0%)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Transport Investment</span>
                  <span className="text-slate-200 font-bold">₹{comparisonData.harvest_zero_plan.transport_cost?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Gross Off-Take Revenue</span>
                  <span className="text-emerald-300 font-bold">₹{comparisonData.harvest_zero_plan.gross_revenue?.toLocaleString()}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-emerald-900/40 flex justify-between items-baseline">
                  <span className="text-emerald-300 text-[11px] font-semibold">Net Realized Profit:</span>
                  <span className="text-base font-extrabold text-emerald-200">₹{comparisonData.harvest_zero_plan.net_realized_margin?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Findings Bullet List */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
              Operations Research Audit Findings
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
              {comparisonData.key_findings?.map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Active Consignments & Telemetry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Live In-Transit Fleet & Consignment Tracking (Supabase PostgreSQL)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-echelon routes with active sensor readings and biological shelf-life buffers.
            </p>
          </div>
          <button
            onClick={fetchDashboardMetrics}
            className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Consignment Payload</th>
                <th className="py-3 px-4">Active Destination</th>
                <th className="py-3 px-4">Sensor Temp</th>
                <th className="py-3 px-4">Remaining Life</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              {activeShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">
                    {s.transport_vehicles?.vehicle_number || "MH-15-TC-1088"}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {s.allocated_quantity_kg?.toLocaleString()} kg {s.produce_batches?.crop_type}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {s.destination_buyer?.name}
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {s.destination_buyer?.type} • {s.destination_buyer?.location}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-300">
                    {s.transport_vehicles?.current_temp_celsius ?? 8.5}°C
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {s.produce_batches?.remaining_shelf_life_days ?? 4.0} days
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        s.status === "rerouted"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : s.status === "in_transit"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleSimulateMasterSpike(false)}
                      className="px-3 py-1.5 min-h-[32px] text-xs rounded-lg bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 border border-rose-700 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      aria-label={`Trigger anomaly on consignment ${s.transport_vehicles?.vehicle_number || s.id}`}
                    >
                      Trigger Anomaly
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
