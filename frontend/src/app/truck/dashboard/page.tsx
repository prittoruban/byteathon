"use client";

import React, { useState, useEffect } from "react";
import { TransitRouteMap } from "@/components/TransitRouteMap";
import { useLanguage, getCropDisplayName } from "@/lib/i18n";

interface TripAssignment {
  id: string;
  plan_code?: string;
  batch_id: string;
  crop_type: string;
  quantity_kg: number;
  origin: string;
  destination: string;
  distance_km: number;
  est_duration_hours: number;
  temperature_target: string;
  status: "proposed" | "selected" | "buyer_approved" | "in_transit" | "delivered";
  buyer_approved: boolean;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
}

export default function TruckDriverDashboardPage() {
  const [driverAvailable, setDriverAvailable] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<TripAssignment[]>([]);
  const [activeTrip, setActiveTrip] = useState<TripAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cargoTemp] = useState<number>(4.1);
  const { t, language } = useLanguage();
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const fetchTrips = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/plan", { cache: "no-store" });
      if (res.ok) {
        const plans = await res.json();
        const incoming: TripAssignment[] = [];
        let running: TripAssignment | null = null;

        (plans || []).forEach((p: any) => {
          const isApproved = Boolean(
            p.buyer_approved === true ||
            p.status === "buyer_approved" ||
            p.status === "in_transit" ||
            p.status === "delivered"
          );

          const trip: TripAssignment = {
            id: p.id,
            plan_code: p.plan_code,
            batch_id: p.batch_id,
            crop_type: p.crop_type || "Produce Lot",
            quantity_kg: p.dispatch_quantity_kg || 2500,
            origin: p.origin_location || "Farm Origin",
            destination: p.buyer_name || "Commercial Buyer Hub",
            distance_km: p.distance_km || 165,
            est_duration_hours: 3.5,
            temperature_target: p.is_refrigerated ? "+4.0°C Reefer" : "Ambient",
            status: p.status || "proposed",
            buyer_approved: isApproved,
            origin_lat: p.origin_lat,
            origin_lng: p.origin_lng,
            dest_lat: p.dest_lat,
            dest_lng: p.dest_lng,
          };

          if (p.status === "in_transit") {
            running = trip;
          } else if (
            p.status === "selected" ||
            p.status === "confirmed" ||
            p.status === "plan_confirmed" ||
            p.status === "buyer_approved"
          ) {
            incoming.push(trip);
          }
        });

        setAssignments(incoming);
        setActiveTrip(running);
      }
    } catch {
      // Keep existing
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(() => {
      fetchTrips(true);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptTrip = async (trip: TripAssignment) => {
    if (!trip.buyer_approved) {
      setStatusNotification("Cannot accept trip: Commercial buyer has not yet approved purchase order.");
      setTimeout(() => setStatusNotification(null), 4000);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/vehicle/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: trip.id, vehicle_id: "veh-01" }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setStatusNotification(errData.detail || "Failed to accept trip.");
        setTimeout(() => setStatusNotification(null), 4000);
        return;
      }
    } catch {
      // Offline fallback
    }

    const inProgress: TripAssignment = { ...trip, status: "in_transit" };
    setActiveTrip(inProgress);
    setAssignments((prev) => prev.filter((a) => a.id !== trip.id));
    setStatusNotification(`Trip accepted. Transit to ${trip.destination} initiated.`);
    setTimeout(() => {
      setStatusNotification(null);
      fetchTrips(true);
    }, 3000);
  };

  const handleDeclineTrip = async (tripId: string) => {
    try {
      await fetch("http://localhost:8000/api/vehicle/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: tripId, reason: "Off-duty" }),
      });
    } catch {
      // offline fallback
    }
    setAssignments((prev) => prev.filter((a) => a.id !== tripId));
    fetchTrips(true);
  };

  const handleMarkDelivered = async () => {
    if (!activeTrip) return;
    try {
      await fetch("http://localhost:8000/api/vehicle/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: activeTrip.id }),
      });
    } catch {
      // offline fallback
    }

    setStatusNotification(`Delivery completed for ${activeTrip.crop_type}. Receiving dock verified.`);
    setActiveTrip(null);
    setTimeout(() => {
      setStatusNotification(null);
      fetchTrips(true);
    }, 3000);
  };

  const pendingBuyerCount = assignments.filter((a) => !a.buyer_approved).length;
  const readyPickupCount = assignments.filter((a) => a.buyer_approved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {t("truck.title", "Reefer Fleet Dispatch Console")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("truck.sub", "Assigned farm pickup trips, buyer approval gating, and live highway corridor navigation.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDriverAvailable(!driverAvailable)}
          className={`self-start sm:self-auto h-8 sm:h-7 px-3 text-xs font-medium rounded border cursor-pointer touch-manipulation ${
            driverAvailable
              ? "border-emerald-600 bg-emerald-50/40 text-emerald-700 font-semibold"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {driverAvailable ? `${t("truck.vehicle_status", "Status")}: ${t("truck.ready", "Available")}` : `${t("truck.vehicle_status", "Status")}: ${t("truck.off_duty", "Off Duty")}`}
        </button>
      </div>

      {statusNotification && (
        <div className="border border-slate-200 rounded-md bg-white p-3 text-xs text-slate-700">
          {statusNotification}
        </div>
      )}

      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">
            {activeTrip ? t("truck.in_transit", "In Transit") : driverAvailable ? t("truck.ready", "Ready") : t("truck.off_duty", "Off Duty")}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("truck.vehicle_status", "Vehicle Status")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">{cargoTemp}°C</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("truck.cargo_sensor", "Cargo Sensor")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-slate-900">{readyPickupCount}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("truck.authorized_pickups", "Authorized Pickups")}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 h-16 flex flex-col justify-between">
          <div className="text-xl font-bold tabular-nums text-amber-600">{pendingBuyerCount}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {t("truck.awaiting_po", "Awaiting Buyer PO")}
          </div>
        </div>
      </div>

      {/* ACTIVE TRANSIT MISSION WITH EMBEDDED ROUTE MAP */}
      {activeTrip && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-md bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {t("truck.active_trips", "Active Transit Mission")}
              </span>
              <span className="bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">
                in_transit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-xs text-slate-500">{t("batches.crop", "Produce")}</div>
                <div className="text-sm font-semibold text-slate-900">
                  {getCropDisplayName(activeTrip.crop_type, language)} ({activeTrip.quantity_kg.toLocaleString()} kg)
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">{t("truck.route_map", "Route")}</div>
                <div className="text-xs text-slate-700">
                  {activeTrip.origin} → {activeTrip.destination}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">{t("truck.telemetry", "Telemetry")}</div>
                <div className="text-xs text-slate-700">
                  {activeTrip.distance_km} km · {activeTrip.temperature_target}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleMarkDelivered}
                className="h-8 sm:h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation"
              >
                {t("truck.mark_delivered", "Mark Delivered")}
              </button>
            </div>
          </div>

          {/* Integrated Highway Corridor Navigation Map with Dynamic Farmland Coordinates */}
          <TransitRouteMap
            origin={activeTrip.origin}
            destination={activeTrip.destination}
            cropType={activeTrip.crop_type}
            quantityKg={activeTrip.quantity_kg}
            vehicleNumber="MH-15-AG-4021"
            temperatureC={cargoTemp}
            distanceKm={activeTrip.distance_km}
            originCoords={
              activeTrip.origin_lat && activeTrip.origin_lng
                ? { lat: activeTrip.origin_lat, lng: activeTrip.origin_lng }
                : undefined
            }
            destinationCoords={
              activeTrip.dest_lat && activeTrip.dest_lng
                ? { lat: activeTrip.dest_lat, lng: activeTrip.dest_lng }
                : undefined
            }
          />
        </div>
      )}

      {/* Section 2: Incoming Pickup Assignments Table with Buyer Approval Gating */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("truck.incoming_assignments", "Incoming Pickup Assignments")} ({assignments.length})
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 sm:hidden">{t("nav.scroll_hint", "Scroll horizontally →")}</span>
            <span className="text-xs text-slate-500">
              {t("truck.pickup_requires_approval", "Pickup requires commercial buyer purchase approval")}
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-300">
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.lot_ref", "Plan Ref")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.crop", "Crop")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("batches.quantity", "Quantity")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("truck.farm_origin", "Farm Origin")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("truck.buyer_destination", "Buyer Destination")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 whitespace-nowrap">{t("truck.approval_state", "Approval State")}</th>
                  <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right whitespace-nowrap">{t("batches.action", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-16 px-3 text-center text-xs text-slate-400">
                      {t("truck.no_assignments", "No pending pickup assignments right now.")}
                    </td>
                  </tr>
                ) : (
                  assignments.map((trip) => (
                    <tr key={trip.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap">
                        {trip.plan_code || trip.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {getCropDisplayName(trip.crop_type, language)}
                      </td>
                      <td className="px-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {trip.quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="px-3 text-xs text-slate-500 whitespace-nowrap">
                        {trip.origin}
                      </td>
                      <td className="px-3 text-xs text-slate-700 font-medium whitespace-nowrap">
                        {trip.destination}
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        {trip.buyer_approved ? (
                          <span className="bg-emerald-50 text-emerald-700 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">
                            buyer_approved
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">
                            awaiting_buyer
                          </span>
                        )}
                      </td>
                      <td className="px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeclineTrip(trip.id)}
                            className="h-7 px-3 text-xs font-medium rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer touch-manipulation"
                          >
                            {t("truck.decline", "Decline")}
                          </button>
                          {trip.buyer_approved ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptTrip(trip)}
                              className="h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation"
                            >
                              {t("truck.accept_trip", "Accept Trip")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Waiting for commercial buyer to approve purchase order"
                              className="h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                            >
                              {t("truck.awaiting_po", "Awaiting Buyer PO")}
                            </button>
                          )}
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
    </div>
  );
}
