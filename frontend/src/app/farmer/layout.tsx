"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleHeader } from "@/components/RoleHeader";
import { useLanguage } from "@/lib/i18n";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      name: t("tab.harvest_intake", "Harvest Intake & Plans"),
      href: "/farmer/dashboard",
    },
    {
      name: t("tab.active_batches", "Produce Batches"),
      href: "/farmer/batches",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] flex flex-col font-sans">
      <RoleHeader currentRole="farmer" title="Farmer Console" />

      {/* Full-width Tab navigation bar */}
      <div className="bg-white border-b border-[#e2e8f0] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-4 sm:gap-6 pt-3 whitespace-nowrap min-w-max">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] pb-3 transition-colors ${
                  active
                    ? "font-semibold text-[#0f172a] border-b-2 border-[#0f172a]"
                    : "font-normal text-[#94a3b8] hover:text-[#475569] border-b-2 border-transparent"
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
        HARVEST ZERO · Agricultural Perishable Protection
      </footer>
    </div>
  );
}
