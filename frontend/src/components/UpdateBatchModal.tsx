"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

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
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [batch, isOpen, onClose]);

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-[#18181A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Sheet Grabber Handle */}
        <div className="w-10 h-1.5 rounded-full bg-neutral-700 mx-auto mb-3 sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2
              id="update-modal-title"
              className="text-base font-semibold text-white tracking-tight"
            >
              Update Batch: {batch.crop_type} ({batch.quantity_kg.toLocaleString()} kg)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Adjust inventory status, remaining shelf life, and storage method
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
            className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-xs text-rose-300 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm font-sans">
          <div>
            <label
              htmlFor="update-batch-status"
              className="block text-neutral-300 font-medium mb-1 text-xs"
            >
              Consignment Status
            </label>
            <select
              id="update-batch-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-sm"
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
            <label
              htmlFor="update-batch-shelflife"
              className="block text-neutral-300 font-medium mb-1 text-xs"
            >
              Remaining Shelf Life (days)
            </label>
            <input
              id="update-batch-shelflife"
              type="number"
              min="0"
              max={batch.initial_shelf_life_days}
              step="0.1"
              value={remainingShelfLife}
              onChange={(e) => setRemainingShelfLife(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm"
            />
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Initial: {batch.initial_shelf_life_days} days
            </p>
          </div>

          <div>
            <label
              htmlFor="update-batch-storage"
              className="block text-neutral-300 font-medium mb-1 text-xs"
            >
              Storage Condition
            </label>
            <select
              id="update-batch-storage"
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#242426] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-sm"
            >
              <option value="ambient_heap">Ambient Heap</option>
              <option value="ventilated_shed">Ventilated Shed</option>
              <option value="cold_storage">Cold Storage</option>
            </select>
          </div>

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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl min-h-[44px] bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-semibold transition-all cursor-pointer shadow-sm"
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
