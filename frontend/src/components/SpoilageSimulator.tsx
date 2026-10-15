"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Thermometer,
  Flame,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
  Zap,
  RotateCcw,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface CropKineticData {
  key: string;
  crop_name: string;
  optimal_temp_celsius: number;
  reference_temp_celsius: number;
  activation_energy_j_mol: number;
  activation_energy_kj_mol: number;
  base_decay_rate_per_day: number;
  optimal_humidity_min: number;
  optimal_humidity_max: number;
  chilling_injury_threshold_celsius: number | null;
  typical_shelf_life_days: number;
  literature_source: string;
}

interface SpoilageAssessment {
  crop_type: string;
  current_temp_celsius: number;
  current_humidity_pct: number | null;
  k_decay_rate_per_day: number;
  base_decay_rate_per_day: number;
  acceleration_factor: number;
  q10_equivalent: number;
  exposure_hours: number;
  shelf_life_consumed_days: number;
  updated_remaining_shelf_life_days: number;
  updated_remaining_shelf_life_hours: number;
  spoilage_risk_score: number;
  risk_level: string;
  chilling_injury_active: boolean;
  transit_viability: {
    transit_hours_remaining: number;
    shelf_life_remaining_hours: number;
    safety_margin_hours: number;
    will_survive_transit: boolean;
    transit_health_status: string;
  } | null;
  is_reroute_recommended: boolean;
  rationale: string;
  demonstration_assumptions: {
    model_type: string;
    gas_constant_R_j_mol_k: number;
    crop_kinetic_profile: Record<string, any>;
    demonstration_note: string;
  };
}

interface SpikeSimulationResult {
  simulation_parameters: {
    crop_type: string;
    baseline_temp_celsius: number;
    elevated_temp_celsius: number;
    temperature_delta_celsius: number;
    spike_duration_hours: number;
    transit_hours_remaining: number;
  };
  impact_comparison: {
    decay_rate_multiplier: string;
    risk_score_delta: string;
    shelf_life_lost_hours: number;
    baseline_risk_level: string;
    spiked_risk_level: string;
    reroute_triggered: boolean;
  };
  baseline_cold_chain: SpoilageAssessment;
  spiked_condition: SpoilageAssessment;
  scientific_summary: string;
}

export function SpoilageSimulator() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // State
  const [crops, setCrops] = useState<CropKineticData[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [temperature, setTemperature] = useState<number>(24.0);
  const [humidity, setHumidity] = useState<number>(75.0);
  const [remainingShelfLifeDays, setRemainingShelfLifeDays] = useState<number>(5.0);
  const [transitHours, setTransitHours] = useState<number>(8.0);
  const [exposureHours, setExposureHours] = useState<number>(4.0);

  const [assessment, setAssessment] = useState<SpoilageAssessment | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Temperature Spike Simulation state
  const [spikeResult, setSpikeResult] = useState<SpikeSimulationResult | null>(null);
  const [simulatingSpike, setSimulatingSpike] = useState<boolean>(false);
  const [showSpikeModal, setShowSpikeModal] = useState<boolean>(false);

  // Fetch crops catalog on mount
  useEffect(() => {
    async function loadCrops() {
      try {
        const res = await fetch(`${backendUrl}/api/spoilage/crops`);
        if (res.ok) {
          const data = await res.json();
          setCrops(data);
        }
      } catch (err) {
        console.error("Failed to load crop kinetics database:", err);
      }
    }
    loadCrops();
  }, [backendUrl]);

  // Recalculate Arrhenius decay on parameter changes
  const evaluateKinetics = useCallback(async () => {
    setEvaluating(true);
    try {
      const res = await fetch(`${backendUrl}/api/spoilage/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_type: selectedCrop,
          remaining_shelf_life_days: Number(remainingShelfLifeDays),
          initial_shelf_life_days: 14.0,
          current_temp_celsius: Number(temperature),
          current_humidity_pct: Number(humidity),
          exposure_hours: Number(exposureHours),
          transit_hours_remaining: Number(transitHours),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
      }
    } catch (err) {
      console.error("Failed to evaluate Arrhenius kinetics:", err);
    } finally {
      setEvaluating(false);
    }
  }, [
    backendUrl,
    selectedCrop,
    remainingShelfLifeDays,
    temperature,
    humidity,
    exposureHours,
    transitHours,
  ]);

  useEffect(() => {
    evaluateKinetics();
  }, [evaluateKinetics]);

  // Trigger temperature spike simulation
  const handleSimulateTemperatureSpike = async () => {
    setSimulatingSpike(true);
    try {
      const cropData = crops.find(
        (c) => c.crop_name.toLowerCase() === selectedCrop.toLowerCase()
      );
      const baselineTemp = cropData ? cropData.optimal_temp_celsius : 6.0;

      const res = await fetch(
        `${backendUrl}/api/spoilage/simulate-temperature-spike`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_type: selectedCrop,
            remaining_shelf_life_days: Number(remainingShelfLifeDays),
            initial_shelf_life_days: 14.0,
            baseline_temp_celsius: baselineTemp,
            elevated_temp_celsius: 36.0, // Ambient summer heat breakdown
            spike_duration_hours: 6.0,
            humidity_pct: Number(humidity),
            transit_hours_remaining: Number(transitHours),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSpikeResult(data);
        setShowSpikeModal(true);
      }
    } catch (err) {
      console.error("Failed to simulate thermal spike:", err);
    } finally {
      setSimulatingSpike(false);
    }
  };

  const currentCropMeta = crops.find(
    (c) => c.crop_name.toLowerCase() === selectedCrop.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-mono font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Arrhenius Biochemical Degradation Engine
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Dynamic Produce Spoilage Kinetics
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Eliminating deterministic linear decay models. Predicts real-time non-linear biological deterioration
              using the empirical Arrhenius equation:{" "}
              <span className="font-mono text-emerald-400 font-semibold">
                k(T) = k_ref · exp[(-E_a/R) · (1/T - 1/T_ref)]
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateTemperatureSpike}
              disabled={simulatingSpike}
              className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98] border border-rose-500"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Simulate AC Failure (+26°C Spike)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Thermal Telemetry Inputs
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Live Parameter Tuning
            </span>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Crop Commodity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Tomato", "Potato", "Onion", "Mango", "Cabbage"].map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${
                    selectedCrop === crop
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span>{crop}</span>
                  {selectedCrop === crop && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
            {currentCropMeta && (
              <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-2">
                <span>Optimal: {currentCropMeta.optimal_temp_celsius}°C</span>
                <span>•</span>
                <span>Ea: {currentCropMeta.activation_energy_kj_mol} kJ/mol</span>
                <span>•</span>
                <span>RH: {currentCropMeta.optimal_humidity_min}-{currentCropMeta.optimal_humidity_max}%</span>
              </p>
            )}
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                Vehicle / Storage Temperature
              </label>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  temperature <= 8
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : temperature <= 15
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
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
              min="-2"
              max="45"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>-2°C (Freezing)</span>
              <span>4°C (Cold Chain)</span>
              <span>24°C (Ambient)</span>
              <span>45°C (Extreme)</span>
            </div>
          </div>

          {/* Relative Humidity Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Relative Humidity (% RH)
              </label>
              <span className="text-xs font-mono font-bold text-slate-200">
                {humidity.toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>40% (Desiccation)</span>
              <span>85% (Optimal)</span>
              <span>100% (Mold Hazard)</span>
            </div>
          </div>

          {/* Remaining Shelf Life & Transit Hours */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Remaining Shelf Life
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="60"
                  step="0.5"
                  value={remainingShelfLifeDays}
                  onChange={(e) =>
                    setRemainingShelfLifeDays(
                      Math.max(0.1, parseFloat(e.target.value) || 1.0)
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:border-emerald-500 outline-none"
                />
                <span className="text-xs text-slate-400">days</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Transit Time to Buyer
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="72"
                  step="1"
                  value={transitHours}
                  onChange={(e) =>
                    setTransitHours(
                      Math.max(1, parseFloat(e.target.value) || 1)
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:border-emerald-500 outline-none"
                />
                <span className="text-xs text-slate-400">hours</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-2 font-mono">
              Telemetry Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemperature(4.0);
                  setHumidity(90.0);
                }}
                className="px-2.5 py-1 text-[11px] rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
              >
                Optimal Cold Chain (4°C)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemperature(24.0);
                  setHumidity(65.0);
                }}
                className="px-2.5 py-1 text-[11px] rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 transition-colors"
              >
                Ambient Non-AC (24°C)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemperature(38.0);
                  setHumidity(55.0);
                }}
                className="px-2.5 py-1 text-[11px] rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition-colors"
              >
                Heatwave Stress (38°C)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Arrhenius Scientific Output (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {assessment ? (
            <>
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Acceleration Factor */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Acceleration Factor α(T)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        assessment.acceleration_factor > 4.0
                          ? "text-rose-400"
                          : assessment.acceleration_factor > 1.8
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {assessment.acceleration_factor.toFixed(2)}x
                    </span>
                    <span className="text-[10px] text-slate-400">vs k_ref</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Q10 equivalent: {assessment.q10_equivalent}
                  </span>
                </div>

                {/* Reaction Decay Rate */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Reaction Rate k(T)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {assessment.k_decay_rate_per_day.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-slate-400">/day</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Base k_ref: {assessment.base_decay_rate_per_day}/d
                  </span>
                </div>

                {/* Spoilage Risk Score */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Spoilage Risk Score
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        assessment.risk_level === "CRITICAL"
                          ? "text-rose-400"
                          : assessment.risk_level === "WARNING"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {assessment.spoilage_risk_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <span
                    className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                      assessment.risk_level === "CRITICAL"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                        : assessment.risk_level === "WARNING"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                        : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {assessment.risk_level}
                  </span>
                </div>

                {/* Remaining Shelf Life */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Effective Shelf Life
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {assessment.updated_remaining_shelf_life_hours.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400">hours</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ({assessment.updated_remaining_shelf_life_days.toFixed(1)} days)
                  </span>
                </div>
              </div>

              {/* Transit Feasibility & Reroute Alert Card */}
              {assessment.transit_viability && (
                <div
                  className={`p-5 rounded-xl border transition-all ${
                    assessment.is_reroute_recommended
                      ? "bg-rose-950/40 border-rose-800/80"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {assessment.is_reroute_recommended ? (
                        <div className="p-2.5 rounded-lg bg-rose-900/60 text-rose-300 border border-rose-700">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          {assessment.is_reroute_recommended
                            ? "DYNAMIC REROUTE MANDATORY (Thermal Breakdown Detected)"
                            : "Transit Schedule Viable"}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              assessment.is_reroute_recommended
                                ? "bg-rose-900/80 text-rose-200"
                                : "bg-emerald-900/80 text-emerald-200"
                            }`}
                          >
                            {assessment.transit_viability.transit_health_status}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Planned transit:{" "}
                          <span className="font-semibold text-slate-100 font-mono">
                            {assessment.transit_viability.transit_hours_remaining}h
                          </span>{" "}
                          • Remaining biological life:{" "}
                          <span className="font-semibold text-slate-100 font-mono">
                            {assessment.transit_viability.shelf_life_remaining_hours}h
                          </span>{" "}
                          • Safety margin:{" "}
                          <span
                            className={`font-semibold font-mono ${
                              assessment.transit_viability.safety_margin_hours < 0
                                ? "text-rose-400 font-bold"
                                : "text-emerald-400"
                            }`}
                          >
                            {assessment.transit_viability.safety_margin_hours}h
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chilling Injury Alert (if applicable) */}
              {assessment.chilling_injury_active && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80 flex items-start gap-3">
                  <Snowflake className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-semibold text-cyan-200">
                      Physiological Chilling Injury Active
                    </h5>
                    <p className="text-xs text-cyan-300/80 mt-0.5">
                      Temperature ({temperature}°C) has dropped below the {selectedCrop} chilling tolerance threshold ({currentCropMeta?.chilling_injury_threshold_celsius}°C). 
                      Metabolic membrane breakdown accelerates rot upon return to room temperature.
                    </p>
                  </div>
                </div>
              )}

              {/* Scientific Rationale Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  Kinetic Evaluation Rationale
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {assessment.rationale}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Literature: {assessment.demonstration_assumptions.crop_kinetic_profile.literature_reference}</span>
                  <span>R = 8.314 J/(mol·K)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Evaluating biochemical kinetics...
            </div>
          )}
        </div>
      </div>

      {/* Temperature Spike Simulation Modal / Card */}
      {showSpikeModal && spikeResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Refrigeration Breakdown Simulation Results
                  </h3>
                  <p className="text-xs text-slate-400">
                    Arrhenius kinetic degradation acceleration under +26°C thermal stress
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSpikeModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono px-3 py-1 rounded bg-slate-800"
              >
                Close ✕
              </button>
            </div>

            {/* Impact Metric Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <span className="text-[11px] font-mono text-rose-300">
                  Decay Acceleration
                </span>
                <p className="text-2xl font-bold font-mono text-rose-200 mt-1">
                  {spikeResult.impact_comparison.decay_rate_multiplier}
                </p>
                <span className="text-[10px] text-rose-400/80">via Arrhenius Exponential</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <span className="text-[11px] font-mono text-rose-300">
                  Shelf-Life Drained
                </span>
                <p className="text-2xl font-bold font-mono text-rose-200 mt-1">
                  -{spikeResult.impact_comparison.shelf_life_lost_hours} hrs
                </p>
                <span className="text-[10px] text-rose-400/80">Lost in 6 hours of heat</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <span className="text-[11px] font-mono text-rose-300">
                  Risk Tier Escalation
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950">
                    {spikeResult.impact_comparison.baseline_risk_level}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-mono font-bold text-rose-300 px-2 py-0.5 rounded bg-rose-950">
                    {spikeResult.impact_comparison.spiked_risk_level}
                  </span>
                </div>
                <span className="text-[10px] text-rose-400/80 mt-1 block">
                  {spikeResult.impact_comparison.risk_score_delta}
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Baseline Cold Chain */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Snowflake className="w-3.5 h-3.5" />
                    Refrigerated Baseline
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {spikeResult.simulation_parameters.baseline_temp_celsius}°C
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Decay Rate k:</span>
                    <span className="font-mono">{spikeResult.baseline_cold_chain.k_decay_rate_per_day}/d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Acceleration:</span>
                    <span className="font-mono text-cyan-400">{spikeResult.baseline_cold_chain.acceleration_factor}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Life:</span>
                    <span className="font-mono">{spikeResult.baseline_cold_chain.updated_remaining_shelf_life_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-mono text-emerald-400">{spikeResult.baseline_cold_chain.spoilage_risk_score}</span>
                  </div>
                </div>
              </div>

              {/* Elevated Thermal Spike */}
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-rose-800/40">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    Thermal Spike Breakdown
                  </span>
                  <span className="text-xs font-mono text-rose-200">
                    {spikeResult.simulation_parameters.elevated_temp_celsius}°C
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Decay Rate k:</span>
                    <span className="font-mono text-rose-300 font-bold">{spikeResult.spiked_condition.k_decay_rate_per_day}/d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Acceleration:</span>
                    <span className="font-mono text-rose-400 font-bold">{spikeResult.spiked_condition.acceleration_factor}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Life:</span>
                    <span className="font-mono text-rose-300 font-bold">{spikeResult.spiked_condition.updated_remaining_shelf_life_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-mono text-rose-400 font-bold">{spikeResult.spiked_condition.spoilage_risk_score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              <span className="font-semibold text-emerald-400 block mb-1">
                Scientific Verification Summary:
              </span>
              {spikeResult.scientific_summary}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSpikeModal(false)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibrated Crop Kinetics Database Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Calibrated Crop Kinetic Profiles (USDA Handbook 66 & Food Science Benchmarks)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirically parameterized activation energies and baseline reaction constants for multi-commodity logistics.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Optimal Temp (°C)</th>
                <th className="py-3 px-4">Activation Energy (Ea)</th>
                <th className="py-3 px-4">Basal Rate k_ref (/day)</th>
                <th className="py-3 px-4">Target Humidity</th>
                <th className="py-3 px-4">Chilling Threshold</th>
                <th className="py-3 px-4">Empirical Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              {crops.map((c) => (
                <tr key={c.key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-100">{c.crop_name}</td>
                  <td className="py-3 px-4 font-mono text-cyan-300">{c.optimal_temp_celsius}°C</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{c.activation_energy_kj_mol} kJ/mol</td>
                  <td className="py-3 px-4 font-mono">{c.base_decay_rate_per_day}/d</td>
                  <td className="py-3 px-4 font-mono">{c.optimal_humidity_min}% - {c.optimal_humidity_max}%</td>
                  <td className="py-3 px-4 font-mono text-amber-300">
                    {c.chilling_injury_threshold_celsius !== null
                      ? `< ${c.chilling_injury_threshold_celsius}°C`
                      : "None"}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={c.literature_source}>
                    {c.literature_source}
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
