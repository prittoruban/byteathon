"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Loader2 } from "lucide-react";

interface BatchItem {
  id: string;
  crop_type: string;
  quantity_kg: number;
  remaining_shelf_life_days: number;
  initial_shelf_life_days: number;
  status: string;
  storage_condition: string;
}

interface UpdateBatchModalProps {
  batch: BatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  backendUrl: string;
}

export function UpdateBatchModal({
  batch,
  isOpen,
  onClose,
  onSuccess,
  backendUrl,
}: UpdateBatchModalProps) {
  const [status, setStatus] = useState<string>("harvested");
  const [remainingShelfLife, setRemainingShelfLife] = useState<string>("8.5");
  const [storageCondition, setStorageCondition] = useState<string>("ambient_heap");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setStatus(batch.status);
      setRemainingShelfLife(batch.remaining_shelf_life_days.toString());
      setStorageCondition(batch.storage_condition);
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const shelfLife = parseFloat(remainingShelfLife);
    if (isNaN(shelfLife) || shelfLife < 0) {
      setError("Please enter a valid non-negative shelf life in days.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/produce-batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status,
          remaining_shelf_life_days: shelfLife,
          storage_condition: storageCondition,
          basal_degradation_score:
            storageCondition === "ambient_heap"
              ? 18.5
              : storageCondition === "ventilated_shed"
              ? 8.0
              : 2.0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update batch");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="bg-white dark:bg-[#0f1b14] border border-slate-200 dark:border-emerald-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="update-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Update Batch: {batch.crop_type} ({batch.quantity_kg.toLocaleString()} kg)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust inventory status, remaining shelf life, and storage method
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Consignment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="harvested">Harvested (Ready at farm)</option>
              <option value="in_storage">In Storage (Buffer facility)</option>
              <option value="in_transit">In Transit (Dispatched in truck)</option>
              <option value="delivered">Delivered (Successfully fulfilled)</option>
              <option value="diverted">Diverted (Secondary processor)</option>
              <option value="spoiled">Spoiled (Write-off)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Remaining Shelf Life (days)
            </label>
            <input
              type="number"
              min="0"
              max={batch.initial_shelf_life_days}
              step="0.1"
              value={remainingShelfLife}
              onChange={(e) => setRemainingShelfLife(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Initial: {batch.initial_shelf_life_days} days
            </p>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Storage Condition
            </label>
            <select
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ambient_heap">Ambient Heap</option>
              <option value="ventilated_shed">Ventilated Shed</option>
              <option value="cold_storage">Cold Storage</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Batch</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
