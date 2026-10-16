"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Thermometer, Activity, Check, ArrowRight } from "lucide-react";
import { PlanCard, DispatchPlanItem } from "@/components/PlanCard";
import { FreshnessGauge } from "@/components/FreshnessGauge";
import { FarmLandLocationPicker } from "@/components/FarmLandLocationPicker";
import { getStoredUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

interface CropInfo {
  name: string;
  shelfLifeDays: number;
  optimumTemp: string;
  priceEstimate: number;
}

const CROPS: CropInfo[] = [
  { name: "Tomato", shelfLifeDays: 7, optimumTemp: "12°C – 15°C", priceEstimate: 32 },
  { name: "Strawberry", shelfLifeDays: 3, optimumTemp: "0°C – 2°C", priceEstimate: 140 },
  { name: "Spinach", shelfLifeDays: 4, optimumTemp: "2°C – 4°C", priceEstimate: 22 },
  { name: "Banana", shelfLifeDays: 6, optimumTemp: "13°C – 14°C", priceEstimate: 28 },
  { name: "Bell Pepper", shelfLifeDays: 9, optimumTemp: "7°C – 10°C", priceEstimate: 45 },
  { name: "Grapes", shelfLifeDays: 12, optimumTemp: "-0.5°C – 0°C", priceEstimate: 65 },
  { name: "Mango", shelfLifeDays: 8, optimumTemp: "10°C – 13°C", priceEstimate: 85 },
  { name: "Papaya", shelfLifeDays: 6, optimumTemp: "10°C – 12°C", priceEstimate: 30 },
  { name: "Guava", shelfLifeDays: 5, optimumTemp: "8°C – 10°C", priceEstimate: 38 },
  { name: "Apple", shelfLifeDays: 30, optimumTemp: "-1°C – 4°C", priceEstimate: 110 },
  { name: "Cabbage", shelfLifeDays: 14, optimumTemp: "0°C – 2°C", priceEstimate: 18 },
  { name: "Cauliflower", shelfLifeDays: 10, optimumTemp: "0°C – 2°C", priceEstimate: 24 },
  { name: "Carrot", shelfLifeDays: 20, optimumTemp: "0°C – 1°C", priceEstimate: 35 },
  { name: "Onion", shelfLifeDays: 45, optimumTemp: "0°C – 2°C", priceEstimate: 26 },
  { name: "Potato", shelfLifeDays: 60, optimumTemp: "8°C – 10°C", priceEstimate: 20 },
  { name: "Orange", shelfLifeDays: 15, optimumTemp: "4°C – 7°C", priceEstimate: 50 },
  { name: "Pomegranate", shelfLifeDays: 28, optimumTemp: "5°C – 7°C", priceEstimate: 95 },
  { name: "Green Chili", shelfLifeDays: 10, optimumTemp: "7°C – 10°C", priceEstimate: 55 },
  { name: "Cucumber", shelfLifeDays: 7, optimumTemp: "10°C – 12°C", priceEstimate: 22 },
  { name: "Watermelon", shelfLifeDays: 14, optimumTemp: "10°C – 15°C", priceEstimate: 16 },
];

export default function FarmerDashboard() {
  const { t, language } = useLanguage();
  const [crop, setCrop] = useState<string>("Tomato");
  const [quantityKg, setQuantityKg] = useState<number>(2500);
  const [storageCondition, setStorageCondition] = useState<string>("ambient");
  const [harvestDate, setHarvestDate] = useState<string>("");
  const [latitude, setLatitude] = useState<number>(19.9975);
  const [longitude, setLongitude] = useState<number>(73.7898);
  const [locationName, setLocationName] = useState<string>("Deola Taluka, Nashik, Maharashtra 423102");

  const getCropDisplayName = (cropName: string) => {
    if (language === "ta") {
      switch (cropName) {
        case "Tomato": return "தக்காளி (Tomato)";
        case "Strawberry": return "ஸ்ட்ராபெரி (Strawberry)";
        case "Spinach": return "கீரை (Spinach)";
        case "Banana": return "வாழைப்பழம் (Banana)";
        case "Bell Pepper": return "குடைமிளகாய் (Capsicum)";
        case "Grapes": return "திராட்சை (Grapes)";
        case "Mango": return "மாம்பழம் (Mango)";
        case "Papaya": return "பப்பாளி (Papaya)";
        case "Guava": return "கொய்யா (Guava)";
        case "Apple": return "ஆப்பிள் (Apple)";
        case "Cabbage": return "முட்டைக்கோஸ் (Cabbage)";
        case "Cauliflower": return "காலிஃபிளவர் (Cauliflower)";
        case "Carrot": return "கேரட் (Carrot)";
        case "Onion": return "வெங்காயம் (Onion)";
        case "Potato": return "உருளைக்கிழங்கு (Potato)";
        case "Orange": return "ஆரஞ்சு (Orange)";
        case "Pomegranate": return "மாதுளை (Pomegranate)";
        case "Green Chili": return "பச்சை மிளகாய் (Green Chili)";
        case "Cucumber": return "வெள்ளரிக்காய் (Cucumber)";
        case "Watermelon": return "தர்பூசணி (Watermelon)";
        default: return cropName;
      }
    }
    return cropName;
  };

  // Flow states
  const [step, setStep] = useState<"form" | "plans">("form");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const [plans, setPlans] = useState<DispatchPlanItem[]>([]);
  const [confirmedPlanId, setConfirmedPlanId] = useState<string | null>(null);
  const [biologicalMetrics, setBiologicalMetrics] = useState<{
    shelfLifeHours: number;
    decayMultiplier: number;
    microclimateTemp: number;
    relativeHumidity: number;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setHarvestDate(formatted);
  }, []);

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoadingPhase(1);

    const phaseTimer = setTimeout(() => {
      setLoadingPhase(2);
    }, 800);

    try {
      const user = getStoredUser();
      const farmerId = user?.user_id || "farmer-demo-01";

      const payload = {
        farmer_id: farmerId,
        crop_type: crop,
        quantity_kg: Number(quantityKg),
        harvest_date: harvestDate ? new Date(harvestDate).toISOString() : new Date().toISOString(),
        farm_latitude: latitude,
        farm_longitude: longitude,
        farm_location_name: locationName,
        current_storage_condition: storageCondition,
      };

      const res = await fetch("http://localhost:8000/api/lots/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      const data = await res.json();
      const hours = data.biological_shelf_life_hours ?? data.adjusted_shelf_life_hours ?? 84;
      const hoursNum = isNaN(Number(hours)) ? 84 : Math.round(Number(hours));

      setBiologicalMetrics({
        shelfLifeHours: hoursNum,
        decayMultiplier: data.decay_acceleration_factor || 1.4,
        microclimateTemp: data.microclimate?.temperature_c || 29.4,
        relativeHumidity: data.microclimate?.relative_humidity || 62,
      });

      if (data.recommended_plans && data.recommended_plans.length > 0) {
        setPlans(data.recommended_plans);
      } else {
        const pRes = await fetch("http://localhost:8000/api/plan");
        if (pRes.ok) {
          const allPlans = await pRes.json();
          if (allPlans && allPlans.length > 0) {
            setPlans(allPlans.slice(0, 3));
          }
        }
      }

      setTimeout(() => {
        setSubmitting(false);
        setStep("plans");
      }, 1200);
    } catch {
      clearTimeout(phaseTimer);
      const cropData = CROPS.find((c) => c.name === crop) || CROPS[0];
      const hoursRemaining = cropData.shelfLifeDays * 24;

      setBiologicalMetrics({
        shelfLifeHours: hoursRemaining,
        decayMultiplier: storageCondition === "ambient" ? 1.72 : 0.42,
        microclimateTemp: 28.5,
        relativeHumidity: 65,
      });

      const fallbackPlans: DispatchPlanItem[] = [
        {
          id: `plan-rec-${Date.now()}`,
          plan_code: "HZ-DIR-01",
          strategy_name: "DIRECT COLD CHAIN",
          batch_id: `batch-${Date.now()}`,
          buyer_id: "buyer-01",
          buyer_name: "FreshMart Prime Retail (Navi Mumbai)",
          buyer_type: "Supermarket / Direct Cold Chain",
          vehicle_id: "veh-01",
          vehicle_number: "MH-15-AG-4021",
          is_refrigerated: true,
          storage_name: "Direct Route",
          dispatch_quantity_kg: quantityKg,
          store_quantity_kg: 0,
          estimated_price_inr: Math.round(cropData.priceEstimate * 1.15),
          net_delta_inr: Math.round(quantityKg * 4.5),
          shelf_life_hours_remaining: Math.round(hoursRemaining - 8),
          urgency: "medium",
          status: "proposed",
          crop_type: crop,
          origin_location: locationName,
          distance_km: 165,
        },
        {
          id: `plan-buf-${Date.now()}`,
          plan_code: "HZ-BUF-02",
          strategy_name: "BUFFERED REGIONAL",
          batch_id: `batch-${Date.now()}`,
          buyer_id: "buyer-02",
          buyer_name: "Apex HyperMarket (Pune Central)",
          buyer_type: "Regional Hub",
          vehicle_id: "veh-02",
          vehicle_number: "MH-14-BT-9902",
          is_refrigerated: false,
          storage_name: "MahaAgro Vault 04",
          dispatch_quantity_kg: Math.round(quantityKg * 0.6),
          store_quantity_kg: Math.round(quantityKg * 0.4),
          estimated_price_inr: Math.round(cropData.priceEstimate),
          net_delta_inr: Math.round(quantityKg * 2.2),
          shelf_life_hours_remaining: Math.round(hoursRemaining * 2.8),
          urgency: "low",
          status: "proposed",
          crop_type: crop,
          origin_location: locationName,
          distance_km: 195,
        },
        {
          id: `plan-arb-${Date.now()}`,
          plan_code: "HZ-ARB-03",
          strategy_name: "SECONDARY ARBITRAGE",
          batch_id: `batch-${Date.now()}`,
          buyer_id: "buyer-03",
          buyer_name: "Nashik APMC Secondary Hub",
          buyer_type: "Secondary Recovery",
          vehicle_id: "veh-03",
          vehicle_number: "MH-15-DD-3030",
          is_refrigerated: false,
          storage_name: "Direct Mandi",
          dispatch_quantity_kg: quantityKg,
          store_quantity_kg: 0,
          estimated_price_inr: Math.round(cropData.priceEstimate * 0.88),
          net_delta_inr: -Math.round(quantityKg * 1.5),
          shelf_life_hours_remaining: Math.round(hoursRemaining * 0.6),
          urgency: "critical",
          status: "proposed",
          crop_type: crop,
          origin_location: locationName,
          distance_km: 38,
        },
      ];

      setPlans(fallbackPlans);
      setTimeout(() => {
        setSubmitting(false);
        setStep("plans");
      }, 1000);
    }
  };

  const selectedCropData = CROPS.find((c) => c.name === crop) || CROPS[0];

  return (
    <div className="space-y-6">
      {/* Level 1: Page Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a] tracking-[-0.3px]">
            {t("farmer.title", "Harvest Lot Intake")}
          </h1>
          <p className="text-[11px] font-normal text-[#94a3b8] mt-0.5">
            {t("farmer.desc", "Register harvest to evaluate Arrhenius degradation rate and receive coordinated dispatch plans.")}
          </p>
        </div>

        {step === "plans" && (
          <button
            type="button"
            onClick={() => setStep("form")}
            className="h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer touch-manipulation"
          >
            {t("farmer.new_intake", "New Intake")}
          </button>
        )}
      </div>

      {/* STEP 1: REGISTRATION FORM & LIVE INSTRUMENT */}
      {step === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Intake Form Container */}
          <div className="lg:col-span-2 border border-[#e2e8f0] rounded-md bg-white p-4 sm:p-6 space-y-5">
            <form onSubmit={handleRegisterBatch} className="space-y-5">
              {/* Crop Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#475569]">
                    {t("farmer.crop", "Crop")}
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-normal text-[#94a3b8]">
                    <Thermometer className="w-3.5 h-3.5 text-slate-300" />
                    <span>{t("farmer.optimum", "Optimum")}: {selectedCropData.optimumTemp}</span>
                  </div>
                </div>

                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#cbd5e1] text-[14px] text-[#1e293b] bg-white focus:border-[#16a34a] focus:ring-4 focus:ring-emerald-600/10 outline-none cursor-pointer transition-all"
                >
                  {CROPS.map((c) => (
                    <option key={c.name} value={c.name} className="py-1">
                      {getCropDisplayName(c.name)} · {c.shelfLifeDays}d {language === "ta" ? "ஆயுள்" : "shelf life"} · ₹{c.priceEstimate}/kg
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Field: Input + Quick-Select sitting in a single visual unit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#475569]">
                    {t("farmer.quantity", "Quantity (kg)")}
                  </label>
                  <span className="text-[11px] font-normal text-[#94a3b8]">
                    {Math.round(quantityKg / 25)} {t("farmer.crates", "crates")}
                  </span>
                </div>

                <div className="border border-[#cbd5e1] rounded-md flex bg-white h-10 items-center overflow-hidden focus-within:border-[#16a34a] focus-within:ring-4 focus-within:ring-emerald-600/10 transition-all">
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    step={50}
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    required
                    className="min-w-0 flex-1 px-3 text-[14px] font-semibold text-[#0f172a] border-none outline-none bg-transparent tabular-nums"
                  />
                  <div className="w-[1px] h-full bg-[#e2e8f0] shrink-0" />
                  <div className="flex h-full items-center shrink-0 overflow-x-auto no-scrollbar">
                    {[
                      { label: "500kg", val: 500 },
                      { label: "1T", val: 1000 },
                      { label: "2.5T", val: 2500 },
                      { label: "5T", val: 5000 },
                    ].map((btn) => {
                      const isSelected = quantityKg === btn.val;
                      return (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => setQuantityKg(btn.val)}
                          className={`px-2.5 sm:px-3 h-full text-[11px] font-semibold flex items-center cursor-pointer transition-colors touch-manipulation ${
                            isSelected
                              ? "bg-[#16a34a] text-white"
                              : "text-[#64748b] hover:bg-slate-50 hover:text-[#0f172a]"
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Storage Condition Cards */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#475569]">
                  {t("farmer.storage_condition", "Current On-Farm Storage Condition")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "ambient", label: t("farmer.ambient", "Ambient"), desc: t("farmer.ambient_desc", "Field air (28–35°C)") },
                    { id: "shaded", label: t("farmer.shaded", "Covered Shed"), desc: t("farmer.shaded_desc", "Shaded (22–25°C)") },
                    { id: "cold_store", label: t("farmer.precooled", "Pre-cooled"), desc: t("farmer.precooled_desc", "Farm buffer (4–8°C)") },
                  ].map((cond) => {
                    const active = storageCondition === cond.id;
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setStorageCondition(cond.id)}
                        className={`h-[72px] px-4 py-3 border rounded-lg cursor-pointer transition-all relative flex flex-col justify-center text-left ${
                          active
                            ? "bg-white border-[1.5px] border-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.08)]"
                            : "bg-[#f8fafc] border-[#e2e8f0] hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`text-[13px] ${
                            active
                              ? "font-bold text-[#16a34a]"
                              : "font-semibold text-[#1e293b]"
                          }`}
                        >
                          {cond.label}
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">
                          {cond.desc}
                        </div>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#16a34a] absolute top-2.5 right-2.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Harvest Date & Time */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#475569]">
                  {t("farmer.harvest_datetime", "Harvest Date & Time")}
                </label>
                <input
                  type="datetime-local"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                  className="w-full sm:w-72 h-10 px-3 rounded-md border border-[#cbd5e1] text-[14px] text-[#1e293b] bg-white focus:border-[#16a34a] focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all"
                />
              </div>

              {/* Interactive Farmland Location & GPS (FarmLandLocationPicker) */}
              <FarmLandLocationPicker
                locationName={locationName}
                latitude={latitude}
                longitude={longitude}
                onChange={(loc) => {
                  setLocationName(loc.locationName);
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                }}
              />

              {/* Generate Plans Button (Right-aligned on desktop, full-width on mobile) */}
              <div className="pt-2 flex flex-col items-stretch sm:items-end gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 sm:h-10 w-full sm:w-auto min-w-[160px] px-6 bg-[#16a34a] hover:bg-[#15803d] rounded-md text-[14px] sm:text-[13px] font-semibold text-white tracking-[0.1px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-80 touch-manipulation"
                >
                  <span>{t("farmer.generate_plans", "Generate Plans")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {submitting && (
                  <div className="w-full sm:w-[160px] flex flex-col items-start gap-1">
                    <div className="w-full h-[2px] bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] w-full animate-pulse" />
                    </div>
                    <div className="text-[11px] text-[#94a3b8] leading-tight mt-1">
                      <div>{t("farmer.calc_freshness", "① Calculating freshness clock...")}</div>
                      {loadingPhase >= 2 && (
                        <div className="mt-0.5">{t("farmer.matching_buyers", "② Matching buyers & fleet...")}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right Panel: Live Instrument */}
          <div className="bg-white border border-[#e2e8f0] border-l-4 border-l-[#16a34a] rounded-lg sm:rounded-r-lg sm:rounded-l-none p-4 sm:p-5 space-y-5">
            {/* Live Instrument: Arrhenius Valuation */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748b] uppercase tracking-[1.2px]">
                <Activity className="w-3 h-3 text-[#16a34a] animate-pulse" />
                <span>{t("farmer.arrhenius_valuation", "ARRHENIUS VALUATION")}</span>
              </div>

              <div className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.5px] text-[#0f172a] tabular-nums leading-tight pt-1">
                ₹{(quantityKg * selectedCropData.priceEstimate).toLocaleString("en-IN")}
              </div>

              <div className="text-[12px] text-slate-400 font-medium">
                {quantityKg.toLocaleString()} kg · {getCropDisplayName(crop)}
              </div>

              <div className="text-[11px] text-[#94a3b8] leading-[1.5] pt-1">
                <div>{t("farmer.baseline_valuation_sub", "Baseline farmgate valuation before kinetic shelf-life decay adjustments")}</div>
              </div>
            </div>

            <div className="border-b border-[#f1f5f9]" />

            {/* Kinetic Model Monospace Block */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-[1.2px]">
                {t("farmer.kinetic_model", "KINETIC MODEL")}
              </div>

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-2.5 font-mono text-[13px] text-[#0f172a]">
                k(T) = A · exp(-Ea / RT)
              </div>

              <p className="text-[11px] text-[#94a3b8] leading-normal">
                {t("farmer.kinetic_sub", "Respiration rate computed dynamically from farm microclimate kinetics.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PLANS VIEW */}
      {step === "plans" && (
        <div className="space-y-4">
          {/* Biological Metric Banner */}
          {biologicalMetrics && (
            <div className="border border-[#e2e8f0] rounded-md bg-white p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <FreshnessGauge
                  hoursRemaining={biologicalMetrics.shelfLifeHours}
                  urgency={biologicalMetrics.shelfLifeHours < 48 ? "critical" : "medium"}
                  size={48}
                />
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">
                    {biologicalMetrics.shelfLifeHours} {t("farmer.hours_remaining", "Hours Remaining")}
                  </div>
                  <div className="text-[11px] text-[#94a3b8]">
                    {t("farmer.decay_factor", "Decay factor")} {biologicalMetrics.decayMultiplier}x · Farm temp {biologicalMetrics.microclimateTemp}°C ({biologicalMetrics.relativeHumidity}% RH)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide font-semibold rounded px-2.5 py-1 bg-emerald-50 text-emerald-700">
                  {t("farmer.plans_generated", "3 Coordinated Plans Generated")}
                </span>
              </div>
            </div>
          )}

          {confirmedPlanId && (
            <div className="border border-[#e2e8f0] rounded-md bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[13px] text-slate-700">
                Plan <span className="font-mono font-semibold text-[#0f172a]">{confirmedPlanId}</span> - {t("farmer.plan_confirmed_banner", "Plan confirmed. Notifications dispatched to commercial buyer and transportation fleet.")}
              </div>
              <Link
                href="/farmer/batches"
                className="h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center shrink-0 touch-manipulation"
              >
                {t("farmer.view_batches", "View Batches")}
              </Link>
            </div>
          )}

          {/* 3 Decision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={idx === 0}
                onPlanConfirmed={(planId) => setConfirmedPlanId(planId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
