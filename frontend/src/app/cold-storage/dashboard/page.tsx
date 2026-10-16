"use client";

import React, { useState, useEffect } from "react";
import { useLanguage, getCropDisplayName } from "@/lib/i18n";

interface BookingRequest {
  id: string;
  batch_id: string;
  crop_type: string;
  quantity_kg: number;
  duration_days: number;
  inbound_eta: string;
  storage_fee_per_day: number;
  status: string;
}

interface StoredInventory {
  id: string;
  batch_id: string;
  crop_type: string;
  quantity_kg: number;
  check_in_date: string;
  temperature_c: number;
  preservation_multiplier: string;
  storage_fee_accumulated: number;
}

export default function ColdStorageDashboardPage() {
  const [capacityTotal] = useState<number>(25000); // 25 MT
  const [capacityUsed, setCapacityUsed] = useState<number>(0);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [inventory, setInventory] = useState<StoredInventory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/plan", { cache: "no-store" });
      if (res.ok) {
        const plans = await res.json();
        const incomingReqs: BookingRequest[] = [];
        (plans || []).forEach((p: any) => {
          if (p.store_quantity_kg && p.store_quantity_kg > 0 && p.status !== "declined") {
            incomingReqs.push({
              id: `req-${p.id}`,
              batch_id: p.batch_id,
              crop_type: p.crop_type || "Produce Lot",
              quantity_kg: p.store_quantity_kg,
              duration_days: 3,
              inbound_eta: "Today 14:30",
              storage_fee_per_day: Math.round(p.store_quantity_kg * 0.75),
              status: "pending",
            });
          }
        });

        setRequests(incomingReqs);
      }
    } catch {
      // Keep existing
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (req: BookingRequest) => {
    try {
      await fetch("http://localhost:8000/api/storage/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: req.id }),
      });
    } catch {
      // offline fallback
    }

    setCapacityUsed((prev) => Math.min(capacityTotal, prev + req.quantity_kg));
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setInventory((prev) => [
      {
        id: `inv-${Date.now()}`,
        batch_id: req.batch_id,
        crop_type: req.crop_type,
        quantity_kg: req.quantity_kg,
        check_in_date: "Just now",
        temperature_c: 3.8,
        preservation_multiplier: "3.5x",
        storage_fee_accumulated: req.storage_fee_per_day,
      },
      ...prev,
    ]);
    setActionSuccess(`Slot confirmed for ${req.quantity_kg.toLocaleString()} kg of ${req.crop_type}.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleDecline = async (reqId: string) => {
    try {
      await fetch("http://localhost:8000/api/storage/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: reqId, reason: "Full" }),
      });
    } catch {
      // offline fallback
    }
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setActionSuccess("Booking request declined.");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {t("storage.title", "Cold Storage Vault Operations")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("storage.sub", "Chamber temperature telemetry, slot bookings, and kinetic shelf-life extension.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchData()}
          disabled={loading}
          className="self-start sm:self-auto h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer touch-manipulation"
        >
          {loading ? t("nav.refreshing", "Refreshing...") : t("nav.refresh", "Refresh")}
        </button>
      </div>

      {actionSuccess && (
        <div className="border border-slate-200 rounded-md bg-white p-3 text-xs text-slate-700">
          {actionSuccess}
        </div>
      )}

      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">
            {(capacityUsed / 1000).toFixed(1)} MT
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("storage.occupied_capacity", "Occupied Capacity")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">
            {((capacityTotal - capacityUsed) / 1000).toFixed(1)} MT
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("storage.available_capacity", "Available Capacity")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">3.8°C</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("storage.chamber_temp", "Chamber Temp")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">92%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("truck.humidity", "Relative Humidity")}
          </div>
        </div>
      </div>

      {/* Section 1: Inbound Booking Requests Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("storage.inbound_slot_requests", "Inbound Slot Requests")} ({requests.length})
          </div>
          <span className="text-[10px] text-slate-400 sm:hidden">
            {t("nav.scroll_hint", "Scroll horizontally →")}
          </span>
        </div>

        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-300">
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.lot_ref", "Lot Ref")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.crop", "Crop")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.quantity", "Quantity")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("storage.duration", "Duration")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("storage.inbound_eta", "Inbound ETA")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("storage.rate", "Rate")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right whitespace-nowrap">
                    {t("batches.action", "Action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-16 px-3 text-center text-xs text-slate-400">
                      {t("storage.no_requests", "No inbound storage requests pending.")}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 text-[10px] font-mono uppercase tracking-wide text-slate-400 whitespace-nowrap">
                        {req.batch_id}
                      </td>
                      <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {getCropDisplayName(req.crop_type, language)}
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {req.quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {req.duration_days} {t("storage.days", "days")}
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {req.inbound_eta}
                      </td>
                      <td className="px-3 text-sm font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                        +₹{req.storage_fee_per_day}/day
                      </td>
                      <td className="px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecline(req.id)}
                            className="h-7 px-3 text-xs font-medium rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer touch-manipulation"
                          >
                            {t("storage.decline", "Decline")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirm(req)}
                            className="h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation"
                          >
                            {t("storage.confirm", "Confirm")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Active Inventory Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("storage.active_stored_inventory", "Active Stored Inventory")} ({inventory.length})
          </div>
          <span className="text-[10px] text-slate-400 sm:hidden">{t("nav.scroll_hint", "Scroll horizontally →")}</span>
        </div>

        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-300">
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.lot_ref", "Lot Ref")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.crop", "Crop")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.quantity", "Quantity")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("storage.checked_in", "Checked In")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("storage.chamber_temp", "Chamber Temp")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("storage.preservation", "Preservation")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right whitespace-nowrap">{t("storage.fee_accrued", "Fee Accrued")}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => (
                  <tr key={inv.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 text-[10px] font-mono uppercase tracking-wide text-slate-400 whitespace-nowrap">
                      {inv.batch_id}
                    </td>
                    <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {getCropDisplayName(inv.crop_type, language)}
                    </td>
                    <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {inv.quantity_kg.toLocaleString()} kg
                    </td>
                    <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                      {inv.check_in_date}
                    </td>
                    <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {inv.temperature_c}°C
                    </td>
                    <td className="px-3 text-xs text-slate-600 whitespace-nowrap">
                      {inv.preservation_multiplier}
                    </td>
                    <td className="px-3 text-sm font-bold tabular-nums text-emerald-700 text-right whitespace-nowrap">
                      ₹{inv.storage_fee_accumulated.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
