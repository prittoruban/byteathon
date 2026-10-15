"use client";

import React from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface ShelfLifeBadgeProps {
  remainingDays: number;
  initialDays: number;
}

export function ShelfLifeBadge({
  remainingDays,
  initialDays,
}: ShelfLifeBadgeProps) {
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((remainingDays / Math.max(1, initialDays)) * 100))
  );

  const isCritical = remainingDays <= 3.0;
  const isWarning = remainingDays > 3.0 && remainingDays <= 6.0;

  const colorConfig = isCritical
    ? {
        bg: "bg-[#FFEBEE]",
        border: "border-[#FFCDD2]",
        text: "text-[#C62828]",
        bar: "bg-[#C62828]",
        icon: AlertTriangle,
      }
    : isWarning
    ? {
        bg: "bg-[#FFF4E5]",
        border: "border-[#FFE0B2]",
        text: "text-[#B76E00]",
        bar: "bg-[#B76E00]",
        icon: Clock,
      }
    : {
        bg: "bg-[#E8F5E9]",
        border: "border-[#C8E6C9]",
        text: "text-[#107C41]",
        bar: "bg-[#107C41]",
        icon: CheckCircle,
      };

  const Icon = colorConfig.icon;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tabular-nums ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}
        >
          <Icon className="w-3 h-3 stroke-[2.5]" />
          <span>{remainingDays} days left</span>
        </span>
        <span className="text-[#6E6E73] text-[11px] tabular-nums font-medium">
          {percentage}% viable
        </span>
      </div>
      {/* Progress track */}
      <div
        className="w-full h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorConfig.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
