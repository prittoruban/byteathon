"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scale,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Warehouse,
  Factory,
  RefreshCw,
  Info,
  Clock,
  Thermometer,
} from "lucide-react";

interface SecondaryBuyerItem {
  id: string;
  name: string;
  type: string;
  demand_crop: string;
  demand_kg: number;
  offered_price_per_kg: number;
  location: string;
  latitude: number;
  longitude: number;
}

interface BuyerOptionEconomics {
  buyer_id: string;
  buyer_name: string;
  buyer_type: string;
  location: string;
  distance_km: number;
  estimated_transit_hours: number;
  transport_freight_cost: number;
  contract_price_per_kg: number;
  quality_penalty_pct: number;
  realized_price_per_kg: number;
  expected_gross_revenue: number;
  net_margin: number;
  arrival_shelf_life_hours: number;
  safety_buffer_hours: number;
  arrival_quality_grade: string;
  is_marketable: boolean;
  rejection_reason: string | null;
}

interface FoodSafetyCompliance {
  is_compliant: boolean;
  status: string;
  microbial_risk_index: string;
  regulatory_standard: string;
  certification_rationale: string;
}

interface ArbitrageResult {
  scenario_id: string;
  crop_type: string;
  consignment_quantity_kg: number;
  current_temp_celsius: number;
  current_humidity_pct: number;
  acceleration_factor: number;
  food_safety: FoodSafetyCompliance;
  primary_retail_option: BuyerOptionEconomics;
  secondary_processor_option: BuyerOptionEconomics;
  is_diversion_beneficial: boolean;
  arbitrage_net_difference: number;
  recommended_action: string;
  economic_salvage_percentage: number;
  decision_rationale: string;
}

export function SecondaryRecoveryView() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // State
  const [secondaryBuyers, setSecondaryBuyers] = useState<SecondaryBuyerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tuner inputs
  const [cropType, setCropType] = useState<string>("Tomato");
  const [quantityKg, setQuantityKg] = useState<number>(4000);
  const [temperature, setTemperature] = useState<number>(36.0);
  const [remainingShelfLifeDays, setRemainingShelfLifeDays] = useState<number>(2.5);

  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageResult | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Fetch secondary buyers from Supabase
  const fetchSecondaryBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/secondary/buyers`);
      if (res.ok) {
        const data = await res.json();
        setSecondaryBuyers(data);
      }
    } catch (err) {
      console.error("Failed to load secondary buyers:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchSecondaryBuyers();
  }, [fetchSecondaryBuyers]);

  // Evaluate dynamic arbitrage
  const runArbitrageEvaluation = useCallback(
    async (
      tempToUse?: number,
      slDaysToUse?: number,
      cropToUse?: string
    ) => {
      setEvaluating(true);
      const crop = cropToUse || cropType;
      const temp = tempToUse !== undefined ? tempToUse : temperature;
      const slDays = slDaysToUse !== undefined ? slDaysToUse : remainingShelfLifeDays;

      try {
        const res = await fetch(`${backendUrl}/api/secondary/arbitrage-evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_type: crop,
            quantity_kg: Number(quantityKg),
            initial_shelf_life_days: 14.0,
            remaining_shelf_life_days: Number(slDays),
            current_temp_celsius: Number(temp),
            current_humidity_pct: 70.0,
            vehicle_lat: 19.98,
            vehicle_lon: 73.79,
            cost_per_km: 15.0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setArbitrageResult(data);
        }
      } catch (err) {
        console.error("Failed to evaluate secondary arbitrage:", err);
      } finally {
        setEvaluating(false);
      }
    },
    [backendUrl, cropType, quantityKg, temperature, remainingShelfLifeDays]
  );

  useEffect(() => {
    runArbitrageEvaluation();
  }, [runArbitrageEvaluation]);

  // Benchmark preset handlers
  const loadScenarioBeneficial = () => {
    setCropType("Tomato");
    setQuantityKg(4000);
    setTemperature(36.0);
    setRemainingShelfLifeDays(2.0);
    runArbitrageEvaluation(36.0, 2.0, "Tomato");
  };

  const loadScenarioNotBeneficial = () => {
    setCropType("Tomato");
    setQuantityKg(4000);
    setTemperature(8.0);
    setRemainingShelfLifeDays(9.0);
    runArbitrageEvaluation(8.0, 9.0, "Tomato");
  };

  const loadScenarioFoodSafetyHazard = () => {
    setCropType("Tomato");
    setQuantityKg(4000);
    setTemperature(40.0);
    setRemainingShelfLifeDays(0.15); // ~3.6 hours left
    runArbitrageEvaluation(40.0, 0.15, "Tomato");
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-mono font-medium mb-3">
              <Scale className="w-3.5 h-3.5" />
              Secondary-Market Recovery & Arbitrage Protocol
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Continuous Quality-Penalty Arbitrage
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Dynamically monetizes degrading agricultural produce by comparing primary retail contracts
              (with tiered quality penalty deductions) against secondary food processing markets (puree, paste,
              juice, dehydration) while enforcing strict FSSAI food-safety compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadScenarioBeneficial}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow border border-emerald-500"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
              <span>Scenario A: Diversion Beneficial</span>
            </button>
            <button
              onClick={loadScenarioNotBeneficial}
              className="px-3.5 py-2 rounded-lg bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-700/60"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Scenario B: Maintain Retail</span>
            </button>
            <button
              onClick={loadScenarioFoodSafetyHazard}
              className="px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-800/60"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Hazard Test (&lt;4h Life)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tuner Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Arbitrage Simulation Inputs
              </h3>
              <span className="text-xs font-mono text-slate-400">Step 7 Protocol</span>
            </div>

            {/* Commodity Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Commodity Crop
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Tomato", "Potato", "Onion", "Mango"].map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setCropType(crop)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${
                      cropType === crop
                        ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{crop}</span>
                    {cropType === crop && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Consignment Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Consignment Payload (kg)
                </label>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {quantityKg.toLocaleString()} kg
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={quantityKg}
                onChange={(e) => setQuantityKg(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* In-Transit Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  In-Transit Temperature
                </label>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    temperature <= 10
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                      : temperature <= 25
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {temperature.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="44"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>4°C (Cold Chain)</span>
                <span>24°C (Ambient)</span>
                <span>44°C (Heatwave)</span>
              </div>
            </div>

            {/* Remaining Shelf Life */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Remaining Biological Life
                </label>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {remainingShelfLifeDays.toFixed(1)} days ({Math.round(remainingShelfLifeDays * 24)}h)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="12"
                step="0.1"
                value={remainingShelfLifeDays}
                onChange={(e) => setRemainingShelfLifeDays(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={() => runArbitrageEvaluation()}
              disabled={evaluating}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
              <span>{evaluating ? "Calculating Arbitrage..." : "Re-Calculate Arbitrage"}</span>
            </button>
          </div>

          {/* Quality Degradation Pricing Tiers Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Contracted Quality Penalty Tiers
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-emerald-400 block">Grade A (Prime Fresh)</span>
                  <span className="text-[10px] text-slate-400">Shelf life &ge; 48h buffer</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-emerald-300 font-bold">0% Penalty</span>
                  <span className="text-[10px] text-slate-400 block">100% contract rate</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-amber-400 block">Grade B (Commercial)</span>
                  <span className="text-[10px] text-slate-400">Shelf life 24h - 47h buffer</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-amber-300 font-bold">-25% Discount</span>
                  <span className="text-[10px] text-slate-400 block">Quick-sale markdown</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-cyan-400 block">Grade C (Processing Only)</span>
                  <span className="text-[10px] text-slate-400">Shelf life 4h - 23h buffer</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-cyan-300 font-bold">Processor: 0%</span>
                  <span className="text-[10px] text-rose-400 block">Supermarket: -80% / Reject</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-rose-400 block">Grade D (FSSAI Spoilage)</span>
                  <span className="text-[10px] text-slate-400">Shelf life &lt; 4h (Active Rot)</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-rose-400 font-bold">100% Loss</span>
                  <span className="text-[10px] text-slate-400 block">Biogas / Compost only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Arbitrage Results (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {arbitrageResult && (
            <>
              {/* Arbitrage Decision Banner */}
              <div
                className={`p-6 rounded-xl border transition-all ${
                  arbitrageResult.is_diversion_beneficial
                    ? "bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/60 border-emerald-700/80"
                    : !arbitrageResult.food_safety.is_compliant
                    ? "bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-rose-800/80"
                    : "bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border-cyan-800/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {arbitrageResult.is_diversion_beneficial ? (
                      <div className="p-3 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    ) : !arbitrageResult.food_safety.is_compliant ? (
                      <div className="p-3 rounded-xl bg-rose-900/60 text-rose-300 border border-rose-700">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase mb-1">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            arbitrageResult.is_diversion_beneficial
                              ? "bg-emerald-900 text-emerald-200"
                              : !arbitrageResult.food_safety.is_compliant
                              ? "bg-rose-900 text-rose-200"
                              : "bg-cyan-900 text-cyan-200"
                          }`}
                        >
                          {arbitrageResult.recommended_action.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {arbitrageResult.is_diversion_beneficial
                          ? `Arbitrage Gain: +₹${arbitrageResult.arbitrage_net_difference.toLocaleString()} via Secondary Diversion`
                          : !arbitrageResult.food_safety.is_compliant
                          ? "Food-Safety Violation: Total Spoilage Rejection"
                          : `Maintain Primary Contract (Preserves ₹${Math.abs(arbitrageResult.arbitrage_net_difference).toLocaleString()} Premium)`}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {arbitrageResult.decision_rationale}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Net Economic Spread
                    </span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        arbitrageResult.arbitrage_net_difference > 0
                          ? "text-emerald-400"
                          : "text-slate-200"
                      }`}
                    >
                      {arbitrageResult.arbitrage_net_difference > 0 ? "+" : ""}
                      ₹{arbitrageResult.arbitrage_net_difference.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Secondary vs Primary Net
                    </span>
                  </div>
                </div>
              </div>

              {/* FSSAI Food-Safety Certification Card */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  arbitrageResult.food_safety.is_compliant
                    ? "bg-emerald-950/30 border-emerald-800/60"
                    : "bg-rose-950/40 border-rose-800/80"
                }`}
              >
                {arbitrageResult.food_safety.is_compliant ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-semibold text-slate-100">
                      Food Safety Compliance Status:
                    </h5>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        arbitrageResult.food_safety.is_compliant
                          ? "bg-emerald-900/80 text-emerald-200 border border-emerald-700"
                          : "bg-rose-900/80 text-rose-200 border border-rose-700"
                      }`}
                    >
                      {arbitrageResult.food_safety.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {arbitrageResult.food_safety.certification_rationale}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Standard: {arbitrageResult.food_safety.regulatory_standard}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Economic Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Supermarket Option */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                      Option A: Primary Retail Supermarket
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        arbitrageResult.primary_retail_option.is_marketable
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {arbitrageResult.primary_retail_option.arrival_quality_grade}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {arbitrageResult.primary_retail_option.buyer_name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {arbitrageResult.primary_retail_option.location} • {arbitrageResult.primary_retail_option.distance_km} km
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contract Base Price:</span>
                      <span className="font-mono">₹{arbitrageResult.primary_retail_option.contract_price_per_kg}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quality Penalty Docked:</span>
                      <span
                        className={`font-mono font-bold ${
                          arbitrageResult.primary_retail_option.quality_penalty_pct > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        -{arbitrageResult.primary_retail_option.quality_penalty_pct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Realized Price/kg:</span>
                      <span className="font-mono font-bold text-slate-100">
                        ₹{arbitrageResult.primary_retail_option.realized_price_per_kg}/kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transit Freight Cost:</span>
                      <span className="font-mono text-slate-400">
                        -₹{arbitrageResult.primary_retail_option.transport_freight_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-slate-200">Expected Net Margin:</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          arbitrageResult.primary_retail_option.net_margin > 0
                            ? "text-slate-100"
                            : "text-rose-400"
                        }`}
                      >
                        ₹{arbitrageResult.primary_retail_option.net_margin.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {arbitrageResult.primary_retail_option.rejection_reason && (
                    <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300 leading-tight">
                      <span className="font-semibold block mb-0.5">Retail Markdown / Rejection:</span>
                      {arbitrageResult.primary_retail_option.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Secondary Industrial Processor Option */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Factory className="w-3.5 h-3.5 text-emerald-400" />
                      Option B: Secondary Industrial Processor
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        arbitrageResult.secondary_processor_option.is_marketable
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {arbitrageResult.secondary_processor_option.is_marketable
                        ? "100% SALVAGE FIT"
                        : "HAZARD REJECTED"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {arbitrageResult.secondary_processor_option.buyer_name}
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {arbitrageResult.secondary_processor_option.location} • {arbitrageResult.secondary_processor_option.distance_km} km
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contract Base Price:</span>
                      <span className="font-mono">₹{arbitrageResult.secondary_processor_option.contract_price_per_kg}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cosmetic Quality Penalty:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        0% (Puree/Paste Tolerant)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Realized Price/kg:</span>
                      <span className="font-mono font-bold text-slate-100">
                        ₹{arbitrageResult.secondary_processor_option.realized_price_per_kg}/kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transit Freight Cost:</span>
                      <span className="font-mono text-slate-400">
                        -₹{arbitrageResult.secondary_processor_option.transport_freight_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-emerald-300">Expected Net Margin:</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          arbitrageResult.secondary_processor_option.net_margin > 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        ₹{arbitrageResult.secondary_processor_option.net_margin.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {arbitrageResult.secondary_processor_option.rejection_reason && (
                    <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300 leading-tight">
                      <span className="font-semibold block mb-0.5">Processor Rejection:</span>
                      {arbitrageResult.secondary_processor_option.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Registered Secondary Buyers Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-emerald-400" />
                  Registered Secondary Industrial Buyers (Supabase PostgreSQL Network)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-cleared agro-processing off-takers with contracted industrial floor pricing.
                </p>
              </div>
              <button
                onClick={fetchSecondaryBuyers}
                className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <th className="py-3 px-4">Processing Facility</th>
                    <th className="py-3 px-4">Crop Intake</th>
                    <th className="py-3 px-4">Absorption Capacity</th>
                    <th className="py-3 px-4">Floor Price/kg</th>
                    <th className="py-3 px-4">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                  {secondaryBuyers.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-100 flex items-center gap-2">
                        <Factory className="w-3.5 h-3.5 text-slate-400" />
                        {b.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{b.demand_crop}</td>
                      <td className="py-3 px-4 font-mono">{b.demand_kg.toLocaleString()} kg</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        ₹{b.offered_price_per_kg.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{b.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
