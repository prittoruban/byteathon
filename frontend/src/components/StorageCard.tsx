"use client";

import React from "react";

interface StorageCardProps {
  facility: {
    id: string;
    name: string;
    location: string;
    total_capacity_kg: number;
    current_utilization_kg: number;
    temperature_celsius: number;
    humidity_pct: number;
    cost_per_kg_per_day: number;
  };
}

export function StorageCard({ facility }: StorageCardProps) {
  const utilPct = Math.round((facility.current_utilization_kg / facility.total_capacity_kg) * 100);
  const available = facility.total_capacity_kg - facility.current_utilization_kg;

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-[#14532D] font-mono tracking-tight">{facility.name}</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{facility.location}</p>
        </div>
        <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
          {utilPct}% Utilized
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#9CA3AF]">{facility.current_utilization_kg.toLocaleString()} kg used</span>
          <span className="font-semibold text-[#15803D]">{available.toLocaleString()} kg free</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div className="h-full bg-[#6B7280] rounded-full transition-all duration-300" style={{ width: `${utilPct}%` }} />
        </div>
        <div className="text-right text-[10px] font-mono text-[#9CA3AF]">
          Total Capacity: {facility.total_capacity_kg.toLocaleString()} kg
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#BBF7D0]/50 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-center">
          <div className="text-[#9CA3AF] text-[10px]">Temperature</div>
          <div className="font-bold text-[#15803D] mt-0.5">{facility.temperature_celsius}°C</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-center">
          <div className="text-[#9CA3AF] text-[10px]">Humidity</div>
          <div className="font-bold text-[#2563EB] mt-0.5">{facility.humidity_pct}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-center">
          <div className="text-[#9CA3AF] text-[10px]">Holding Tariff</div>
          <div className="font-bold text-[#475569] mt-0.5">₹{facility.cost_per_kg_per_day}/kg/d</div>
        </div>
      </div>
    </div>
  );
}
