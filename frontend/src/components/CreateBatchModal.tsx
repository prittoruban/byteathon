"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface FarmerOption {
  id: string;
  name: string;
  location: string;
  storage_type: string;
}

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBatchId?: string) => void;
  backendUrl: string;
  currentFarmer?: {
    id: string;
    name: string;
    pmKisanId?: string;
    location?: string;
  } | null;
}

const CROP_PRESETS: Record<string, { shelfLife: number; defaultStorage: string }> = {
  Tomato: { shelfLife: 10, defaultStorage: "ambient_heap" },
  Potato: { shelfLife: 60, defaultStorage: "cold_storage" },
  Onion: { shelfLife: 45, defaultStorage: "ventilated_shed" },
  Mango: { shelfLife: 12, defaultStorage: "ventilated_shed" },
  Apple: { shelfLife: 30, defaultStorage: "cold_storage" },
};

export function CreateBatchModal({
  isOpen,
  onClose,
  onSuccess,
  backendUrl,
  currentFarmer,
}: CreateBatchModalProps) {
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmerId, setFarmerId] = useState<string>("");
  const [cropType, setCropType] = useState<string>("Tomato");
  const [quantityKg, setQuantityKg] = useState<string>("3000");
  const [harvestDate, setHarvestDate] = useState<string>("");

  useEffect(() => {
    if (isOpen && !harvestDate) {
      setHarvestDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, harvestDate]);
  const [initialShelfLifeDays, setInitialShelfLifeDays] = useState<string>("10");
  const [storageCondition, setStorageCondition] = useState<string>("ambient_heap");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentFarmer?.id) {
        setFarmerId(currentFarmer.id);
      }
      // Fetch available farmers
      fetch(`${backendUrl}/api/farmers`)
        .then((res) => res.json())
        .then((data: FarmerOption[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setFarmers(data);
            if (!currentFarmer?.id) {
              setFarmerId(data[0].id);
            }
          }
        })
        .catch((err) => console.error("Failed to load farmers:", err));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, backendUrl, onClose]);

  const handleCropChange = (crop: string) => {
    setCropType(crop);
    if (CROP_PRESETS[crop]) {
      setInitialShelfLifeDays(CROP_PRESETS[crop].shelfLife.toString());
      setStorageCondition(CROP_PRESETS[crop].defaultStorage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const qty = parseFloat(quantityKg);
    const shelfLife = parseFloat(initialShelfLifeDays);

    if (!farmerId) {
      setError("Please select a farmer producer.");
      setLoading(false);
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity in kg.");
      setLoading(false);
      return;
    }
    if (isNaN(shelfLife) || shelfLife <= 0) {
      setError("Please enter a valid shelf life in days.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/produce-batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: farmerId,
          crop_type: cropType,
          quantity_kg: qty,
          harvest_date: harvestDate,
          initial_shelf_life_days: shelfLife,
          remaining_shelf_life_days: shelfLife,
          storage_condition: storageCondition,
          basal_degradation_score:
            storageCondition === "ambient_heap"
              ? 18.5
              : storageCondition === "ventilated_shed"
              ? 8.0
              : 2.0,
          status: "harvested",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to register batch");
      }

      const createdData = await res.json();
      onSuccess(createdData?.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error connecting to server");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white border-t sm:border border-neutral-200/90 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-[#1D1D1F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Sheet Grabber Handle */}
        <div className="w-10 h-1.5 rounded-full bg-neutral-300 mx-auto mb-3 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h2 id="modal-title" className="text-base sm:text-lg font-bold text-[#1D1D1F] tracking-tight">
              फसल दर्ज करें (Register Produce)
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Create new harvest batch with biological shelf-life tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-xs text-[#C62828] font-bold"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm font-sans">
          {/* Farmer */}
          {currentFarmer ? (
            <div className="p-3.5 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">👨‍🌾</span>
                <div>
                  <div className="text-xs font-bold text-[#107C41]">
                    प्रमाणित किसान: {currentFarmer.name}
                  </div>
                  <div className="text-[11px] text-[#4B5563]">
                    PM-KISAN ID: <span className="font-mono font-bold">{currentFarmer.pmKisanId || "PMK-9876543210"}</span> • {currentFarmer.location || "Nashik Cluster North"}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#107C41] text-white">
                सत्यापित
              </span>
            </div>
          ) : (
            <div>
              <label
                htmlFor="create-batch-farmer"
                className="block text-[#1D1D1F] font-semibold mb-1 text-xs"
              >
                किसान का नाम (Farmer Producer)
              </label>
              <select
                id="create-batch-farmer"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#F8F9FA] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41] cursor-pointer text-sm"
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location}, {f.storage_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Visual Crop Selection (One-tap for farmers) */}
          <div>
            <label className="block text-[#1D1D1F] font-bold mb-2 text-xs">
              फसल चुनें (Pick Your Crop)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { crop: "Tomato", label: "टमाटर", emoji: "🍅" },
                { crop: "Potato", label: "आलू", emoji: "🥔" },
                { crop: "Onion", label: "प्याज", emoji: "🧅" },
                { crop: "Mango", label: "आम", emoji: "🥭" },
              ].map((item) => (
                <button
                  key={item.crop}
                  type="button"
                  onClick={() => handleCropChange(item.crop)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    cropType === item.crop
                      ? "bg-[#E8F5E9] border-[#107C41] text-[#107C41] shadow-xs ring-2 ring-[#107C41]/30 font-bold"
                      : "bg-[#F8F9FA] border-neutral-200 text-[#4B5563] hover:border-neutral-300"
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-[#6E6E73]">{item.crop}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quantity Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[#1D1D1F] font-bold text-xs">
                कुल वजन (Total Weight)
              </label>
              <span className="text-xs text-[#107C41] font-bold tabular-nums">
                {Number(quantityKg || 0).toLocaleString()} kg
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { kg: "500", label: "10 बोरी (500 kg)" },
                { kg: "1500", label: "30 बोरी (1500 kg)" },
                { kg: "3000", label: "60 बोरी (3000 kg)" },
              ].map((preset) => (
                <button
                  key={preset.kg}
                  type="button"
                  onClick={() => setQuantityKg(preset.kg)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    quantityKg === preset.kg
                      ? "bg-[#107C41] text-white border-[#107C41] shadow-xs"
                      : "bg-[#F8F9FA] text-[#4B5563] border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              id="create-batch-qty"
              type="number"
              min="100"
              step="50"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              placeholder="या खुद वजन लिखें (in kg)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#F8F9FA] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41] text-sm"
            />
          </div>

          {/* Harvest Date & Initial Shelf Life */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-batch-date"
                className="block text-[#1D1D1F] font-semibold mb-1 text-xs"
              >
                कटाई की तारीख (Harvest Date)
              </label>
              <input
                id="create-batch-date"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#F8F9FA] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41] text-xs sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="create-batch-shelflife"
                className="block text-[#1D1D1F] font-semibold mb-1 text-xs"
              >
                जीवनकाल (Shelf Life Days)
              </label>
              <input
                id="create-batch-shelflife"
                type="number"
                min="1"
                step="0.5"
                value={initialShelfLifeDays}
                onChange={(e) => setInitialShelfLifeDays(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#F8F9FA] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41] text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Farm Storage Condition */}
          <div>
            <label
              htmlFor="create-batch-storage"
              className="block text-[#1D1D1F] font-semibold mb-1 text-xs"
            >
              रखने का स्थान (Storage Environment)
            </label>
            <select
              id="create-batch-storage"
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#F8F9FA] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#107C41] cursor-pointer text-xs sm:text-sm"
            >
              <option value="ambient_heap">
                ☀️ खुले खेत में / ढेर (Ambient Heap - High Risk)
              </option>
              <option value="ventilated_shed">
                🏠 छायादार शेड में (Ventilated Shed - Medium Risk)
              </option>
              <option value="cold_storage">
                ❄️ कोल्ड स्टोरेज में (Cold Room - Safe)
              </option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl min-h-[44px] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] font-semibold transition-colors cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl min-h-[44px] bg-[#107C41] hover:bg-[#0D6535] active:scale-[0.98] text-white font-bold transition-all cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>दर्ज हो रहा है...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>फसल जोड़ें (Save Produce)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
