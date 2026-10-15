"use client";

import React, { useState, useEffect } from "react";
import { X, Sprout, Plus, Loader2 } from "lucide-react";

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
  const [initialShelfLifeDays, setInitialShelfLifeDays] = useState<string>("10");
  const [storageCondition, setStorageCondition] = useState<string>("ambient_heap");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHarvestDate(new Date().toISOString().split("T")[0]);
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
        className="bg-white dark:bg-[#1C1C1E] border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Sheet Grabber Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Register Produce Batch
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Create new harvest inventory with biological shelf-life tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium"
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
              className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
            >
              Select Farmer Producer
            </label>
            <select
              id="create-batch-farmer"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-sm"
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location}, {f.storage_type})
                </option>
              ))}
            </select>
          </div>

          {/* Crop Type & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-batch-crop"
                className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
              >
                Crop Commodity
              </label>
              <select
                id="create-batch-crop"
                value={cropType}
                onChange={(e) => handleCropChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                {Object.keys(CROP_PRESETS).map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="create-batch-qty"
                className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
              >
                Quantity (kg)
              </label>
              <input
                id="create-batch-qty"
                type="number"
                min="100"
                step="50"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Harvest Date & Initial Shelf Life */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-batch-date"
                className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
              >
                Harvest Date
              </label>
              <input
                id="create-batch-date"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="create-batch-shelflife"
                className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Farm Storage Condition */}
          <div>
            <label
              htmlFor="create-batch-storage"
              className="block text-slate-800 dark:text-slate-200 font-semibold mb-1"
            >
              Farm Storage Condition (FEFO Matrix)
            </label>
            <select
              id="create-batch-storage"
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
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
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl min-h-[44px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors cursor-pointer"
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
