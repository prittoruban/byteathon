"use client";

import React from "react";

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  harvested: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
  },
  in_storage: {
    bg: "bg-[#DBEAFE]",
    text: "text-[#1E40AF]",
    border: "border-[#BFDBFE]",
  },
  in_transit: {
    bg: "bg-[#F3E8FF]",
    text: "text-[#6B21A8]",
    border: "border-[#E9D5FF]",
  },
  delivered: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#065F46]",
    border: "border-[#A7F3D0]",
  },
  diverted: {
    bg: "bg-[#FCE7F3]",
    text: "text-[#9D174D]",
    border: "border-[#FCE7F3]",
  },
  rerouted: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
  },
  default: {
    bg: "bg-[#E5E7EB]",
    text: "text-[#374151]",
    border: "border-[#D1D5DB]",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.default;
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {label}
    </span>
  );
}

interface BuyerTypeBadgeProps {
  type: string;
  className?: string;
}

export function BuyerTypeBadge({ type, className }: BuyerTypeBadgeProps) {
  const isPrimary = type === "primary_retail";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${className} ${
        isPrimary
          ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
          : "bg-[#FDF4E3] text-[#92400E] border-[#FDE68A]"
      }`}
    >
      {isPrimary ? "Primary Retail" : "Secondary Processor"}
    </span>
  );
}
