"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleHeader } from "@/components/RoleHeader";

export default function FPOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Cluster Mission Control",
      href: "/fpo/dashboard",
    },
    {
      name: "Farmers Directory",
      href: "/fpo/farmers",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <RoleHeader currentRole="fpo_coordinator" title="FPO Coordinator" />

      {/* Clean Subnav Tabs */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-4 whitespace-nowrap min-w-max">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  active
                    ? "border-emerald-600 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 px-3 sm:px-6 text-center text-xs text-slate-400">
        HARVEST ZERO · FPO Cluster Operations & Perishable Governance
      </footer>
    </div>
  );
}
