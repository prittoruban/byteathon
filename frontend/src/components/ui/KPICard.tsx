"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: {
    label: string;
    value: string;
    positive?: boolean;
  };
  unit?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  unit,
  className,
}: KPICardProps) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[#15803D]" />}
          <span className="text-xs font-medium text-[#475569] uppercase tracking-wider">
            {title}
          </span>
        </div>
        {trend && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              trend.positive
                ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                : "bg-[#FDF2F8] text-[#DC2626] border-[#FCE7F3]"
            }`}
          >
            {trend.value} {trend.label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-extrabold font-mono text-[#14532D]">
          {value}
        </span>
        {unit && <span className="text-xs font-normal text-[#6B7280]">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-[11px] font-mono text-[#6B7280] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
