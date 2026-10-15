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
        bg: "bg-rose-50 dark:bg-rose-950/40",
        border: "border-rose-200 dark:border-rose-900",
        text: "text-rose-700 dark:text-rose-300",
        bar: "bg-rose-500",
        icon: AlertTriangle,
      }
    : isWarning
    ? {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-900",
        text: "text-amber-800 dark:text-amber-300",
        bar: "bg-amber-500",
        icon: Clock,
      }
    : {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-900",
        text: "text-emerald-800 dark:text-emerald-300",
        bar: "bg-emerald-500",
        icon: CheckCircle,
      };

  const Icon = colorConfig.icon;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}
        >
          <Icon className="w-3 h-3" />
          <span>{remainingDays} days left</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          {percentage}% viable
        </span>
      </div>
      {/* Progress track */}
      <div
        className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
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
