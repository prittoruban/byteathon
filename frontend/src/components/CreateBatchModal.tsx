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
  onSuccess: () => void;
  backendUrl: string;
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
      // Fetch available farmers
      fetch(`${backendUrl}/api/farmers`)
        .then((res) => res.json())
        .then((data: FarmerOption[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setFarmers(data);
            setFarmerId(data[0].id);
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

      onSuccess();
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
        className="bg-[#18181A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Sheet Grabber Handle */}
        <div className="w-10 h-1.5 rounded-full bg-neutral-700 mx-auto mb-3 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-white tracking-tight">
              Register Produce Batch
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Create new harvest inventory with biological shelf-life tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/20 text-xs text-[#FF453A] font-medium"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm font-sans">
          {/* Farmer */}
          <div>
            <label
              htmlFor="create-batch-farmer"
              className="block text-neutral-300 font-medium mb-1 text-xs"
            >
              किसान का नाम (Farmer)
            </label>
            <select
              id="create-batch-farmer"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-sm"
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location}, {f.storage_type})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Visual Crop Selection (One-tap for farmers) */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-2 text-xs">
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
                      ? "bg-[#30D158]/20 border-[#30D158] text-white scale-[1.02] shadow-md ring-2 ring-[#30D158]/40"
                      : "bg-[#242426] border-white/10 text-neutral-300 hover:border-white/25"
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-neutral-400">{item.crop}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quantity Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-neutral-300 font-semibold text-xs">
                कुल वजन (Total Weight)
              </label>
              <span className="text-xs text-[#30D158] font-bold tabular-nums">
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
                      ? "bg-white text-black border-white"
                      : "bg-[#242426] text-neutral-300 border-white/10 hover:border-white/20"
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
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm"
            />
          </div>

          {/* Harvest Date & Initial Shelf Life */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-batch-date"
                className="block text-neutral-300 font-medium mb-1 text-xs"
              >
                Harvest Date
              </label>
              <input
                id="create-batch-date"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="create-batch-shelflife"
                className="block text-neutral-300 font-medium mb-1 text-xs"
              >
                Initial Shelf Life (days)
              </label>
              <input
                id="create-batch-shelflife"
                type="number"
                min="1"
                step="0.5"
                value={initialShelfLifeDays}
                onChange={(e) => setInitialShelfLifeDays(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Farm Storage Condition */}
          <div>
            <label
              htmlFor="create-batch-storage"
              className="block text-neutral-300 font-medium mb-1 text-xs"
            >
              Farm Storage Condition (FEFO Matrix)
            </label>
            <select
              id="create-batch-storage"
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            >
              <option value="ambient_heap">
                Ambient Heap Storage (High Decay Risk: +18.5/day)
              </option>
              <option value="ventilated_shed">
                Ventilated Shaded Shed (Medium Decay Risk: +8.0/day)
              </option>
              <option value="cold_storage">
                Farm Pre-Cold Room (Low Decay Risk: +2.0/day)
              </option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl min-h-[44px] text-neutral-400 hover:text-white hover:bg-white/10 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold transition-all cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Register Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
