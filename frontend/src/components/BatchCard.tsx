"use client";

import React from "react";
import { Edit2, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface BatchCardProps {
  batch: {
    id: string;
    crop_type: string;
    quantity_kg: number;
    harvest_date: string;
    initial_shelf_life_days: number;
    remaining_shelf_life_days: number;
    storage_condition: string;
    basal_degradation_score: number;
    status: string;
    created_at: string;
    farmers?: { name: string; location: string };
  };
  onUpdate: (batch: BatchCardProps["batch"]) => void;
}

export function BatchCard({ batch, onUpdate }: BatchCardProps) {
  const isAmbient = batch.storage_condition === "ambient_heap";
  const isCold = batch.storage_condition === "cold_storage";

  const percentage = Math.max(
    0,
    Math.min(100, Math.round((batch.remaining_shelf_life_days / Math.max(1, batch.initial_shelf_life_days)) * 100))
  );

  const isCritical = batch.remaining_shelf_life_days <= 3.0;
  const isWarning = batch.remaining_shelf_life_days > 3.0 && batch.remaining_shelf_life_days <= 6.0;

  const colorConfig = isCritical
    ? {
        badge: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
        bar: "bg-[#DC2626]",
        text: "text-[#991B1B]",
        icon: AlertTriangle,
      }
    : isWarning
    ? {
        badge: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
        bar: "bg-[#D97706]",
        text: "text-[#D97706]",
        icon: Clock,
      }
    : {
        badge: "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]",
        bar: "bg-[#15803D]",
        text: "text-[#15803D]",
        icon: CheckCircle,
      };

  const Icon = colorConfig.icon;

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#14532D] font-mono">
              {batch.crop_type}
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
              {batch.quantity_kg.toLocaleString()} kg
            </span>
          </div>
          <StatusBadge status={batch.status} />
        </div>

        <div className="text-xs text-[#6B7280] font-mono space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Producer:</span>
            <span className="font-semibold text-[#14532D]">
              {batch.farmers?.name || "Smallholder Producer"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Cluster:</span>
            <span>{batch.farmers?.location || "Regional Cluster"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Storage:</span>
            <span className={`font-semibold ${isAmbient ? "text-[#DC2626]" : isCold ? "text-[#15803D]" : "text-[#D97706]"}`}>
              {batch.storage_condition.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Basal Decay:</span>
            <span>+{batch.basal_degradation_score} pts/day</span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#BBF7D0]/50">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${colorConfig.badge}`}>
              <Icon className="w-3 h-3" />
              <span>{batch.remaining_shelf_life_days} days left</span>
            </span>
            <span className="text-[#9CA3AF]">{percentage}% viable</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${colorConfig.bar}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-[#BBF7D0]/50 flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#9CA3AF]">
          Harvest: {batch.harvest_date}
        </span>
        <button
          onClick={() => onUpdate(batch)}
          className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#15803D] hover:text-[#0f6b2e] bg-[#F0FDF4] hover:bg-[#DCFCE7] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>Update Status</span>
        </button>
      </div>
    </div>
  );
}
