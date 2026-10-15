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
        bg: "bg-[#FF453A]/10",
        border: "border-[#FF453A]/25",
        text: "text-[#FF453A]",
        bar: "bg-[#FF453A]",
        icon: AlertTriangle,
      }
    : isWarning
    ? {
        bg: "bg-[#FF9F0A]/10",
        border: "border-[#FF9F0A]/25",
        text: "text-[#FF9F0A]",
        bar: "bg-[#FF9F0A]",
        icon: Clock,
      }
    : {
        bg: "bg-[#30D158]/10",
        border: "border-[#30D158]/25",
        text: "text-[#30D158]",
        bar: "bg-[#30D158]",
        icon: CheckCircle,
      };

  const Icon = colorConfig.icon;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium tabular-nums ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}
        >
          <Icon className="w-3 h-3 stroke-[2]" />
          <span>{remainingDays} days left</span>
        </span>
        <span className="text-neutral-400 text-[11px] tabular-nums font-medium">
          {percentage}% viable
        </span>
      </div>
      {/* Progress track */}
      <div
        className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden"
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
