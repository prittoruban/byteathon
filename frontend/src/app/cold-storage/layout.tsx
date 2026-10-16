"use client";

import React from "react";
import { RoleHeader } from "@/components/RoleHeader";

export default function ColdStorageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <RoleHeader currentRole="cold_storage_owner" title="Cold Storage Vault" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 px-3 sm:px-6 text-center text-xs text-slate-400">
        HARVEST ZERO · Cold Chain Buffer & Pre-Cooling Operations
      </footer>
    </div>
  );
}
