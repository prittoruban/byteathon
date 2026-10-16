"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FreshnessGauge, UrgencyLevel } from "@/components/FreshnessGauge";
import { useLanguage, getCropDisplayName } from "@/lib/i18n";

interface BatchItem {
  id: string;
  crop_type: string;
  quantity_kg: number;
  harvest_date: string;
  status: string;
  remaining_shelf_life_hours?: number;
  urgency?: UrgencyLevel;
  storage_condition?: string;
  farm_location_name?: string;
  confirmed_plan_id?: string;
}

export default function FarmerBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { t, language } = useLanguage();

  const fetchBatches = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/produce-batches", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const mapped: BatchItem[] = (data || []).map((b: any) => {
          const hours = b.remaining_shelf_life_hours || (b.remaining_shelf_life_days ? b.remaining_shelf_life_days * 24 : 84);
          const safeHours = isNaN(Number(hours)) ? 84 : Math.round(Number(hours));
          return {
            id: b.id,
            crop_type: b.crop_name || b.crop_type || "Produce Lot",
            quantity_kg: b.quantity_kg || 2500,
            harvest_date: b.harvest_date || new Date().toISOString(),
            status: b.status || "confirmed",
            remaining_shelf_life_hours: safeHours,
            urgency: safeHours < 48 ? "critical" : "medium",
            farm_location_name: b.farm_location_name || "Registered Farm Plot",
          };
        });
        setBatches(mapped);
      }
    } catch {
      // Keep existing
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(() => {
      fetchBatches(true);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderBadge = (status: string) => {
    switch (status) {
      case "in_transit":
        return <span className="bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">in_transit</span>;
      case "planned":
        return <span className="bg-blue-50 text-blue-600 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">planned</span>;
      case "confirmed":
      case "plan_confirmed":
        return <span className="bg-emerald-50 text-emerald-700 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">confirmed</span>;
      case "delivered":
        return <span className="bg-slate-100 text-slate-400 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">delivered</span>;
      case "rejected":
        return <span className="bg-red-50 text-red-600 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">rejected</span>;
      case "critical":
        return <span className="bg-red-100 text-red-700 rounded px-2 py-0.5 animate-pulse text-[10px] uppercase tracking-wide font-semibold">critical</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Level 1: Page Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0f172a] tracking-[-0.3px]">
            {t("batches.title", "Produce Batches")}
          </h1>
          <p className="text-[11px] font-normal text-[#94a3b8] mt-0.5">
            {t("batches.sub", "Registered harvest lots and active logistics status across distribution channels.")}
          </p>
        </div>

        <Link
          href="/farmer/dashboard"
          className="self-start sm:self-auto h-9 sm:h-10 px-4 sm:px-5 text-[13px] font-semibold rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center transition-colors touch-manipulation shadow-sm"
        >
          {t("farmer.new_intake", "New Intake")}
        </Link>
      </div>

      {/* Batches Data Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("batches.title", "Registered Lots")} ({batches.length})
          </span>
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
                    {t("batches.shelf_life", "Shelf Life Remaining")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.harvested", "Harvested")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.status", "Status")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right whitespace-nowrap">
                    {t("batches.action", "Action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-16 px-3 text-center text-xs text-slate-400">
                      {loading ? t("nav.refreshing", "Loading batches...") : t("batches.no_batches", "No produce batches found.")}
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="h-11 border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap">
                        {batch.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {getCropDisplayName(batch.crop_type, language)}
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {batch.quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        <FreshnessGauge
                          hoursRemaining={batch.remaining_shelf_life_hours || 72}
                          size={28}
                        />
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(batch.harvest_date).toLocaleDateString(language === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        {renderBadge(batch.status)}
                      </td>
                      <td className="px-3 text-right whitespace-nowrap">
                        <Link
                          href="/farmer/dashboard"
                          className="h-8 sm:h-7 px-3 inline-flex items-center text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 touch-manipulation"
                        >
                          {t("farmer.new_intake", "Intake")}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
