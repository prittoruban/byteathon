"use client";

import React from "react";
import { BuyerTypeBadge } from "@/components/ui/StatusBadge";

interface BuyerCardProps {
  buyer: {
    id: string;
    name: string;
    type: string;
    location: string;
    demand_crop: string;
    demand_kg: number;
    offered_price_per_kg: number;
    quality_threshold_min_shelf_life_hours: number;
  };
}

export function BuyerCard({ buyer }: BuyerCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-[#14532D] font-mono tracking-tight">
            {buyer.name}
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{buyer.location}</p>
        </div>
        <BuyerTypeBadge type={buyer.type} />
      </div>

      <div className="grid grid-cols-3 gap-3 py-3 border-t border-[#BBF7D0]/50 border-b border-[#BBF7D0]/50 text-xs font-mono">
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Crop Demand</div>
          <div className="font-semibold text-[#14532D] mt-0.5">{buyer.demand_crop}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Volume (kg)</div>
          <div className="font-semibold text-[#14532D] mt-0.5">{buyer.demand_kg.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] text-[10px]">Offered Price</div>
          <div className="font-semibold text-[#15803D] mt-0.5">₹{buyer.offered_price_per_kg}/kg</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#6B7280]">
        <span>Min Arrival Shelf Life:</span>
        <span className="font-semibold text-[#14532D]">≥ {buyer.quality_threshold_min_shelf_life_hours} hours</span>
      </div>
    </div>
  );
}
