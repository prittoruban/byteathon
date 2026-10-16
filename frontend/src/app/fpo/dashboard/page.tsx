"use client";

import React, { useState, useEffect } from "react";
import { FreshnessGauge } from "@/components/FreshnessGauge";
import { LogisticsMapView } from "@/components/LogisticsMapView";
import { SpoilageSimulator } from "@/components/SpoilageSimulator";
import { DynamicReroutingView } from "@/components/DynamicReroutingView";
import { SecondaryRecoveryView } from "@/components/SecondaryRecoveryView";
import { useLanguage, getCropDisplayName } from "@/lib/i18n";

interface BatchRow {
  id: string;
  farmer_name: string;
  crop_type: string;
  quantity_kg: number;
  harvest_date: string;
  status: string;
  remaining_shelf_life_hours: number;
  urgency: "low" | "medium" | "critical";
  current_plan_id: string;
  buyer_name: string;
}

export default function FPODashboardPage() {
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [showAdvancedEngines, setShowAdvancedEngines] = useState<boolean>(false);
  const [activeEngineTab, setActiveEngineTab] = useState<"spoilage" | "rerouting" | "arbitrage">("spoilage");
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [overrideModalBatch, setOverrideModalBatch] = useState<BatchRow | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideTargetBuyer, setOverrideTargetBuyer] = useState<string>("Apex HyperMarket (Cold Buffered)");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const fetchBatches = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/produce-batches", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const mapped: BatchRow[] = (data || []).map((b: any, idx: number) => {
          const hours = b.remaining_shelf_life_hours || (b.remaining_shelf_life_days ? b.remaining_shelf_life_days * 24 : 84);
          const safeHours = isNaN(Number(hours)) ? 84 : Math.round(Number(hours));
          return {
            id: b.id,
            farmer_name: b.farmer_name || `Farmer (${(b.farm_location_name || "Regional Cluster").split(",")[0]})`,
            crop_type: b.crop_name || b.crop_type || "Produce Lot",
            quantity_kg: b.quantity_kg || 2500,
            harvest_date: b.harvest_date || new Date().toISOString(),
            status: b.status || "confirmed",
            remaining_shelf_life_hours: safeHours,
            urgency: safeHours < 48 ? "critical" : "medium",
            current_plan_id: b.confirmed_plan_id || b.plan_code || `lot-${b.id.slice(-6)}`,
            buyer_name: b.buyer_name || "Awaiting Buyer PO Allocation",
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

  const handleApplyOverride = async () => {
    if (!overrideModalBatch) return;

    try {
      await fetch(`http://localhost:8000/api/plan/${overrideModalBatch.current_plan_id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: overrideModalBatch.current_plan_id,
          override_reason: overrideReason || "FPO cluster coordinator adjustment",
          new_destination: overrideTargetBuyer,
        }),
      });
    } catch {
      // offline fallback
    }

    setBatches((prev) =>
      prev.map((b) =>
        b.id === overrideModalBatch.id
          ? { ...b, buyer_name: overrideTargetBuyer, status: "planned" }
          : b
      )
    );

    setActionSuccess(
      `Plan for lot ${overrideModalBatch.id} overridden. Re-routed to ${overrideTargetBuyer}.`
    );
    setOverrideModalBatch(null);
    setOverrideReason("");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const totalVolumeKg = batches.reduce((acc, b) => acc + b.quantity_kg, 0);
  const criticalBatches = batches.filter((b) => b.remaining_shelf_life_hours < 48);
  const inTransitCount = batches.filter((b) => b.status === "in_transit").length;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {t("fpo.title", "Cluster Mission Control")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("fpo.sub", "Cluster-wide aggregation, kinetic spoilage supervision, dynamic truck rerouting, and administrative plan overrides.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table vs Map Toggle */}
          <div className="flex items-center border border-slate-200 rounded p-0.5 bg-white text-xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`h-7 sm:h-6 px-3 sm:px-2.5 rounded text-xs font-medium cursor-pointer touch-manipulation ${
                viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t("nav.table_view", "Table View")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`h-7 sm:h-6 px-3 sm:px-2.5 rounded text-xs font-medium cursor-pointer touch-manipulation ${
                viewMode === "map" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t("nav.map_view", "Map View")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchBatches()}
            disabled={loading}
            className="h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer touch-manipulation"
          >
            {loading ? t("nav.refreshing", "Refreshing...") : t("nav.refresh", "Refresh")}
          </button>
        </div>
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
            {(totalVolumeKg / 1000).toFixed(1)} MT
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("fpo.cluster_volume", "Cluster Volume")}
          </div>
        </div>

        <div className={`bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between ${
          criticalBatches.length > 0 ? "border-l-2 border-amber-400" : ""
        }`}>
          <div className="text-xl font-bold tabular-nums text-slate-900">
            {criticalBatches.length} Lots
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("fpo.urgent_lots", "Urgency < 48h")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">
            {inTransitCount}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("fpo.active_reefer_trips", "Active Reefer Trips")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-emerald-700">
            ₹{(totalVolumeKg * 34).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("fpo.realized_value", "Realized Value")}
          </div>
        </div>
      </div>

      {/* Table or Map View */}
      {viewMode === "table" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {t("batches.title", "Cluster Batches")} ({batches.length})
            </div>
            <span className="text-[10px] text-slate-400 font-normal sm:hidden">
              {t("nav.scroll_hint", "Scroll horizontally →")}
            </span>
          </div>

          <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-300">
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.lot_ref", "Lot Ref")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("role.farmer", "Farmer")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.crop", "Crop")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.quantity", "Quantity")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.shelf_life", "Shelf Life Remaining")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.assigned_buyer", "Assigned Target")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">
                      {t("batches.status", "Status")}
                    </th>
                    <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right">
                      {t("batches.action", "Action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-16 px-3 text-center text-xs text-slate-400">
                        {t("fpo.no_cluster_batches", "No cluster batches registered.")}
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 text-[10px] font-mono uppercase tracking-wide text-slate-400">
                          {batch.id}
                        </td>
                        <td className="px-3 text-xs text-slate-900 font-medium">
                          {batch.farmer_name}
                        </td>
                        <td className="px-3 text-sm font-semibold text-slate-900">
                          {getCropDisplayName(batch.crop_type, language)}
                        </td>
                        <td className="px-3 text-xs text-slate-600 tabular-nums">
                          {batch.quantity_kg.toLocaleString()} kg
                        </td>
                        <td className="px-3">
                          <FreshnessGauge
                            hoursRemaining={batch.remaining_shelf_life_hours}
                            size={28}
                          />
                        </td>
                        <td className="px-3 text-xs text-slate-700 font-medium">
                          {batch.buyer_name}
                        </td>
                        <td className="px-3">
                          {renderBadge(batch.status)}
                        </td>
                        <td className="px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setOverrideModalBatch(batch)}
                            className="h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer touch-manipulation"
                          >
                            {t("fpo.override", "Override")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden p-2">
          <LogisticsMapView />
        </div>
      )}

      {/* Override Modal */}
      {overrideModalBatch && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t("fpo.override_plan", "Override Plan")}: {overrideModalBatch.id}
              </h3>
              <button
                type="button"
                onClick={() => setOverrideModalBatch(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {t("fpo.close", "Close")}
              </button>
            </div>

            <div className="border border-slate-200 rounded p-2.5 text-xs text-slate-600 space-y-1 bg-slate-50">
              <div><strong>{t("role.farmer", "Farmer")}:</strong> {overrideModalBatch.farmer_name}</div>
              <div><strong>{t("farmer.crop", "Crop")}:</strong> {getCropDisplayName(overrideModalBatch.crop_type, language)} ({overrideModalBatch.quantity_kg.toLocaleString()} kg)</div>
              <div><strong>{t("fpo.current_destination", "Current Destination")}:</strong> {overrideModalBatch.buyer_name}</div>
              <div><strong>{t("batches.shelf_life", "Shelf Life")}:</strong> {overrideModalBatch.remaining_shelf_life_hours}h {t("fpo.remaining", "remaining")}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                {t("fpo.new_destination", "New Target Destination")}
              </label>
              <select
                value={overrideTargetBuyer}
                onChange={(e) => setOverrideTargetBuyer(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none cursor-pointer"
              >
                <option value="Apex HyperMarket (Cold Buffered)">Apex HyperMarket (Pune Central)</option>
                <option value="MahaAgro Cold Vault 04 (3 Days Holding)">MahaAgro Cold Vault 04</option>
                <option value="Nashik APMC Secondary Hub">Nashik APMC Secondary Hub</option>
                <option value="FreshMart Prime Retail (Navi Mumbai)">FreshMart Prime Retail</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                {t("fpo.override_reason", "Override Reason")}
              </label>
              <input
                type="text"
                placeholder="e.g. Traffic mitigation or priority buffer"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalBatch(null)}
                className="h-9 sm:h-7 px-4 sm:px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer touch-manipulation"
              >
                {t("fpo.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                className="h-9 sm:h-7 px-4 sm:px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation"
              >
                {t("fpo.confirm_override", "Confirm Override")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Engines Accordion */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedEngines(!showAdvancedEngines)}
          className="w-full p-3 sm:p-4 flex items-center justify-between text-left hover:bg-slate-50 cursor-pointer touch-manipulation"
        >
          <div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900">
              {t("fpo.engine_diagnostics", "Algorithmic Engine Diagnostics")}
            </div>
            <div className="text-[11px] text-slate-500">
              {t("fpo.engine_sub", "Arrhenius Spoilage Simulator · Dynamic Rerouting Engine · Secondary Arbitrage")}
            </div>
          </div>
          <span className="text-xs text-slate-600 font-medium shrink-0 ml-2">
            {showAdvancedEngines ? t("fpo.hide", "Hide") : t("fpo.inspect", "Inspect")}
          </span>
        </button>

        {showAdvancedEngines && (
          <div className="border-t border-slate-200 p-3 sm:p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto -webkit-overflow-scrolling-touch no-scrollbar">
              {[
                { id: "spoilage", label: t("fpo.spoilage_simulator", "Spoilage Simulator") },
                { id: "rerouting", label: t("fpo.rerouting_engine", "Rerouting Engine") },
                { id: "arbitrage", label: t("fpo.secondary_arbitrage", "Secondary Arbitrage") },
              ].map((tab) => {
                const active = activeEngineTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEngineTab(tab.id as any)}
                    className={`h-8 sm:h-7 px-3 text-xs font-medium rounded border cursor-pointer whitespace-nowrap shrink-0 touch-manipulation ${
                      active
                        ? "border-emerald-600 bg-emerald-50/40 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              {activeEngineTab === "spoilage" && <SpoilageSimulator />}
              {activeEngineTab === "rerouting" && <DynamicReroutingView />}
              {activeEngineTab === "arbitrage" && <SecondaryRecoveryView />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
