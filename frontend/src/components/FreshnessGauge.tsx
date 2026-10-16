"use client";

import React from "react";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

interface FreshnessGaugeProps {
  hoursRemaining: number;
  variant?: "table" | "card";
  totalHours?: number;
  urgency?: UrgencyLevel | string;
  size?: number;
}

export function FreshnessGauge({
  hoursRemaining,
  variant,
  totalHours = 120,
  size: propSize,
}: FreshnessGaugeProps) {
  const safeHours = isNaN(Number(hoursRemaining)) ? 72 : Math.max(0, Number(hoursRemaining));

  // Strict sizes: table inline = 28px (stroke 3), card header = 48px (stroke 4)
  const isTable = variant === "table" || (propSize && propSize <= 32);
  const size = isTable ? 28 : 48;
  const strokeWidth = isTable ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (safeHours / totalHours) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Strict colour rules: >48h → emerald-500, 24–48h → amber-500, 4–24h → red-500, <4h → red-700 + animate-pulse
  let strokeColor = "#10b981"; // emerald-500
  let isCriticalPulse = false;

  if (safeHours < 4) {
    strokeColor = "#b91c1c"; // red-700
    isCriticalPulse = true;
  } else if (safeHours < 24) {
    strokeColor = "#ef4444"; // red-500
  } else if (safeHours <= 48) {
    strokeColor = "#f59e0b"; // amber-500
  }

  if (isTable) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <svg width={size} height={size} className="transform -rotate-90 shrink-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={isCriticalPulse ? "animate-pulse" : ""}
          />
        </svg>
        <span className="text-xs tabular-nums text-slate-600 font-medium">
          {Math.round(safeHours)}h
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={isCriticalPulse ? "animate-pulse" : ""}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold tabular-nums text-slate-900 leading-none">
          {Math.round(safeHours)}h
        </span>
      </div>
    </div>
  );
}
