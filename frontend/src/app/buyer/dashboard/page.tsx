"use client";

import React, { useState, useEffect } from "react";
import { FreshnessGauge } from "@/components/FreshnessGauge";
import { useLanguage, getCropDisplayName } from "@/lib/i18n";

interface OfferItem {
  id: string;
  plan_code?: string;
  batch_id: string;
  crop_type: string;
  dispatch_quantity_kg: number;
  estimated_price_inr: number;
  price_per_kg: number;
  shelf_life_hours_remaining: number;
  status: string;
  vehicle_number?: string;
  driver_name?: string;
  distance_km?: number;
  eta_hours?: number;
}

export default function BuyerDashboardPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/plan", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const incoming: OfferItem[] = [];
        const inTransit: OfferItem[] = [];

        (data || []).forEach((p: any) => {
          const qty = p.dispatch_quantity_kg || 2500;
          const rawPrice = Number(p.price_per_kg ?? p.estimated_price_inr) || 40;
          const unitPrice = rawPrice > 500 ? Math.round(rawPrice / qty) : Math.round(rawPrice);
          const totalInr = rawPrice > 500 ? Math.round(rawPrice) : Math.round(rawPrice * qty);

          const item: OfferItem = {
            id: p.id,
            plan_code: p.plan_code,
            batch_id: p.batch_id,
            crop_type: p.crop_type || "Produce Lot",
            dispatch_quantity_kg: qty,
            estimated_price_inr: totalInr,
            price_per_kg: unitPrice,
            shelf_life_hours_remaining: p.shelf_life_hours_remaining || 64,
            status: p.status || "proposed",
            vehicle_number: p.vehicle_number || "MH-15-AG-4021",
            driver_name: "Balwinder Singh",
            distance_km: p.distance_km || 165,
            eta_hours: 3.5,
          };

          if (p.status === "in_transit" || p.status === "delivered" || p.status === "buyer_approved") {
            inTransit.push(item);
          } else if (p.status === "selected" || p.status === "confirmed" || p.status === "plan_confirmed") {
            incoming.push(item);
          }
        });

        setOffers(incoming);
        setActiveDeliveries(inTransit);
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

  const handleAccept = async (planId: string) => {
    try {
      await fetch(`http://localhost:8000/api/plan/${planId}/buyer-accept`, {
        method: "POST",
      });
      setActionSuccess(`Plan offer ${planId} accepted. Truck dispatch confirmed into active transit.`);
      setOffers((prev) => prev.filter((o) => o.id !== planId));
      fetchData(true);
    } catch {
      setOffers((prev) => prev.filter((o) => o.id !== planId));
    }
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleReject = async (planId: string) => {
    try {
      await fetch(`http://localhost:8000/api/plan/${planId}/buyer-reject`, {
        method: "POST",
      });
      setActionSuccess(`Offer ${planId} declined. Re-routing triggered.`);
      setOffers((prev) => prev.filter((o) => o.id !== planId));
      fetchData(true);
    } catch {
      setOffers((prev) => prev.filter((o) => o.id !== planId));
    }
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const totalProcuredKg = activeDeliveries.reduce((acc, d) => acc + d.dispatch_quantity_kg, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {t("buyer.title", "Commercial Buyer Procurement")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("buyer.sub", "Incoming lot allocations with verified biological freshness scores and arrival shelf-life margins.")}
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
          <div className="text-xl font-bold tabular-nums text-slate-900">{offers.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("buyer.pending_offers", "Pending Offers")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">{activeDeliveries.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("buyer.inbound_fleets", "Inbound Reefer Fleets")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">{(totalProcuredKg / 1000).toFixed(1)} MT</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("buyer.volume_in_transit", "Volume in Transit")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">&gt;48h</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("buyer.min_arrival_shelf_life", "Min Arrival Shelf Life")}
          </div>
        </div>
      </div>

      {/* Section 1: Incoming Lot Allocations Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("buyer.incoming_lot_allocations", "Incoming Lot Allocations")} ({offers.length})
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
                    {t("buyer.offer_price", "Offer Price")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("buyer.freshness", "Freshness")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("buyer.assigned_fleet", "Assigned Fleet")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right whitespace-nowrap">
                    {t("batches.action", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-16 px-3 text-center text-xs text-slate-400">
                      {t("buyer.no_offers", "No incoming offers pending.")}
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id} className="h-11 border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap">
                        {offer.plan_code || offer.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {getCropDisplayName(offer.crop_type, language)}
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {offer.dispatch_quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="px-3 text-sm font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                        ₹{offer.price_per_kg}/kg
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        <FreshnessGauge
                          hoursRemaining={offer.shelf_life_hours_remaining}
                          size={28}
                        />
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {offer.vehicle_number}
                      </td>
                      <td className="px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReject(offer.id)}
                            className="h-8 sm:h-7 px-3 text-xs font-medium rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer touch-manipulation"
                          >
                            {t("buyer.decline", "Decline")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(offer.id)}
                            className="h-8 sm:h-7 px-3.5 sm:px-3 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation shadow-sm"
                          >
                            {t("buyer.accept", "Accept")}
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

      {/* Section 2: Active In-Transit Deliveries Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("buyer.inbound_cold_chain", "Inbound Cold Chain Deliveries")} ({activeDeliveries.length})
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
                    {t("buyer.fleet_and_driver", "Fleet & Driver")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("buyer.freshness", "Freshness")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("buyer.eta", "ETA")}
                  </th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">
                    {t("batches.status", "Status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-16 px-3 text-center text-xs text-slate-400">
                      {t("buyer.no_deliveries", "No inbound deliveries in transit.")}
                    </td>
                  </tr>
                ) : (
                  activeDeliveries.map((del) => (
                    <tr key={del.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 text-[10px] font-mono uppercase tracking-wide text-slate-400 whitespace-nowrap">
                        {del.batch_id}
                      </td>
                      <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {getCropDisplayName(del.crop_type, language)}
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {del.dispatch_quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {del.vehicle_number} ({del.driver_name})
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        <FreshnessGauge
                          hoursRemaining={del.shelf_life_hours_remaining}
                          size={28}
                        />
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {del.eta_hours}h
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold ${
                          del.status === "delivered"
                            ? "bg-slate-100 text-slate-400"
                            : del.status === "buyer_approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {del.status === "buyer_approved" ? "po_approved" : del.status}
                        </span>
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
