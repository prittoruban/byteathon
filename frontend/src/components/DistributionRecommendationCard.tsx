"use client";

import React from "react";
import { Scale } from "lucide-react";
import { BuyerTypeBadge } from "@/components/ui/StatusBadge";

interface DistributionRecommendationCardProps {
  rec: {
    allocation_id: string;
    crop_type: string;
    farmer_name: string;
    origin_location: string;
    buyer_name: string;
    buyer_type: string;
    destination_location: string;
    vehicle_number: string;
    is_refrigerated: boolean;
    allocated_quantity_kg: number;
    distance_km: number;
    estimated_transit_hours: number;
    transport_cost: number;
    expected_revenue: number;
    net_margin: number;
    shelf_life_margin_hours: number;
    explanation: string;
  };
}

export function DistributionRecommendationCard({ rec }: DistributionRecommendationCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#14532D] font-mono">{rec.crop_type}</span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
            {rec.allocated_quantity_kg.toLocaleString()} kg
          </span>
        </div>
        <BuyerTypeBadge type={rec.buyer_type} />
      </div>

      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between text-[#6B7280]">
          <span className="text-[#9CA3AF]">Origin:</span>
          <span className="font-semibold text-[#14532D]">{rec.farmer_name} ({rec.origin_location})</span>
        </div>
        <div className="flex items-center justify-between text-[#6B7280]">
          <span className="text-[#9CA3AF]">Destination:</span>
          <span className="font-semibold text-[#14532D]">{rec.buyer_name} ({rec.destination_location})</span>
        </div>
        <div className="flex items-center justify-between text-[#6B7280]">
          <span className="text-[#9CA3AF]">Assigned Truck:</span>
          <span>{rec.vehicle_number} ({rec.is_refrigerated ? "Refrigerated" : "Ambient"})</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono py-3 border-t border-[#BBF7D0]/50 border-b border-[#BBF7D0]/50">
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Distance</div>
          <div className="font-bold text-[#14532D]">{rec.distance_km} km</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Transit</div>
          <div className="font-bold text-[#14532D]">{rec.estimated_transit_hours}h</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Freight Cost</div>
          <div className="font-bold text-[#DC2626]">₹{rec.transport_cost.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Net Profit</div>
          <div className="font-bold text-[#15803D]">₹{rec.net_margin.toLocaleString()}</div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-mono text-[#065F46]">
        <div className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider mb-1 flex items-center gap-1">
          <Scale className="w-3 h-3" />
          Optimization Rationale:
        </div>
        {rec.explanation}
      </div>
    </div>
  );
}

interface UnallocatedItemProps {
  item: {
    crop_type: string;
    farmer_name: string;
    unallocated_quantity_kg: number;
    reason: string;
    recommended_action: string;
  };
}

export function UnallocatedItem({ item }: UnallocatedItemProps) {
  return (
    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono space-y-1">
      <div className="flex justify-between font-bold text-[#14532D]">
        <span>{item.crop_type} ({item.farmer_name})</span>
        <span className="text-[#92400E]">{item.unallocated_quantity_kg.toLocaleString()} kg</span>
      </div>
      <div className="text-[#6B7280] text-[11px]">{item.reason}</div>
      <div className="text-[#15803D] text-[11px] font-semibold">Action: {item.recommended_action}</div>
    </div>
  );
}

interface UnfulfilledItemProps {
  item: {
    buyer_name: string;
    crop_type: string;
    unfulfilled_demand_kg: number;
    reason: string;
  };
}

export function UnfulfilledItem({ item }: UnfulfilledItemProps) {
  return (
    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono space-y-1">
      <div className="flex justify-between font-bold text-[#14532D]">
        <span>{item.buyer_name} ({item.crop_type})</span>
        <span className="text-[#DC2626]">{item.unfulfilled_demand_kg.toLocaleString()} kg short</span>
      </div>
      <div className="text-[#6B7280] text-[11px]">{item.reason}</div>
    </div>
  );
}
