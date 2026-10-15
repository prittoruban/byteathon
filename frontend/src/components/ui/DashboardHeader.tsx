"use client";

import React from "react";
import { Sprout, RefreshCw, Plus } from "lucide-react";

interface SystemStatus {
  status: string | null;
  latency: number | null;
  loading: boolean;
}

interface DashboardHeaderProps {
  onRefresh: () => void;
  onRegisterBatch: () => void;
  systemStatus: SystemStatus;
  className?: string;
}

export function DashboardHeader({
  onRefresh,
  onRegisterBatch,
  systemStatus,
  className,
}: DashboardHeaderProps) {
  const { status, latency, loading } = systemStatus;

  const getStatusVariant = () => {
    if (loading) {
      return {
        bg: "bg-[#FEF3C7]",
        text: "text-[#92400E]",
        border: "border-[#FDE68A]",
        dot: "bg-[#D97706] animate-ping",
        label: "Optimizing...",
      };
    }
    if (status === "healthy") {
      return {
        bg: "bg-[#D1FAE5]",
        text: "text-[#065F46]",
        border: "border-[#A7F3D0]",
        dot: "bg-[#15803D]",
        label: `Engine Active (${latency}ms)`,
      };
    }
    return {
      bg: "bg-[#FEE2E2]",
      text: "text-[#991B1B]",
      border: "border-[#FECACA]",
      dot: "bg-[#DC2626]",
      label: "Disconnected",
    };
  };

  const variant = getStatusVariant();

  return (
    <header className={`sticky top-0 z-40 ${className}`}>
      <div className="border-b border-[#BBF7D0]/60 bg-[#F0FDF4]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#F0FDF4]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#15803D] flex items-center justify-center text-white shadow-md shadow-[#15803D]/30 shrink-0">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#14532D] font-mono">
                  HARVEST ZERO
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[#FDE68A] text-[#92400E] font-semibold px-2.5 py-0.5 rounded-full border border-[#FCD34D]">
                  Operations Control
                </span>
              </div>
              <p className="text-xs text-[#6B7280] hidden sm:block">
                Intelligent Post-Harvest Loss Prevention & Kinetic Logistics
              </p>
            </div>
          </div>

          {/* Quick Actions & System Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRegisterBatch}
              className="hidden md:inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#15803D] hover:bg-[#0f6b2e] active:scale-[0.98] text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Batch</span>
            </button>

            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-all ${variant.bg} ${variant.text} ${variant.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${variant.dot}`} />
              <span className="hidden sm:inline">{variant.label}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-[#6B7280] hover:text-[#14532D] hover:bg-[#14532D]/10 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] title='Refresh all inventory data' aria-label='Refresh all inventory data'"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-[#15803D]" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
