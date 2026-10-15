"use client";

import React from "react";
import { Truck, Thermometer } from "lucide-react";

interface VehicleCardProps {
  vehicle: {
    id: string;
    vehicle_number: string;
    driver_name: string;
    driver_phone: string;
    max_payload_kg: number;
    is_refrigerated: boolean;
    current_temp_celsius: number;
    current_humidity_pct: number;
    cost_per_km: number;
    status: string;
  };
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const isCold = vehicle.is_refrigerated;

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#15803D]" />
          <span className="font-mono font-bold text-sm text-[#14532D]">{vehicle.vehicle_number}</span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
            vehicle.status === "in_transit"
              ? "bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]"
              : "bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]"
          }`}
        >
          {vehicle.status}
        </span>
      </div>

      <div className="text-xs text-[#6B7280] font-mono space-y-1.5">
        <div className="flex justify-between">
          <span className="text-[#9CA3AF]">Driver:</span>
          <span className="font-semibold text-[#14532D]">{vehicle.driver_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9CA3AF]">Max Payload:</span>
          <span>{vehicle.max_payload_kg.toLocaleString()} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9CA3AF]">Cooling:</span>
          <span className={`font-semibold ${isCold ? "text-[#15803D]" : "text-[#D97706]"}`}>
            {isCold ? "Active Refrigeration" : "Ambient Ventilation"}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          <span>Temp: {vehicle.current_temp_celsius}°C</span>
        </div>
        <span className="text-[#9CA3AF]">|</span>
        <span>RH: {vehicle.current_humidity_pct}%</span>
        <span className="text-[#9CA3AF]">|</span>
        <span>₹{vehicle.cost_per_km}/km</span>
      </div>
    </div>
  );
}
