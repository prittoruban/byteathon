"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RoleType,
  DEMO_CREDENTIALS,
  getStoredUser,
  loginWithRole,
} from "@/lib/auth";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLaunchRole = (role: RoleType) => {
    loginWithRole(role);
    router.push(DEMO_CREDENTIALS[role].path);
  };

  const getRoleTitle = (role: RoleType) => {
    switch (role) {
      case "farmer":
        return t("role.farmer.title", "Farmer Intake & Harvest");
      case "buyer":
        return t("role.buyer.title", "Buyer Procurement Pool");
      case "truck_driver":
        return t("role.truck.title", "Reefer Transit Telemetry");
      case "cold_storage_owner":
        return t("role.cold_storage.title", "Cold Vault Buffer Network");
      case "fpo_coordinator":
        return t("role.fpo.title", "Cluster Mission Control");
      default:
        return (DEMO_CREDENTIALS as any)[role]?.title || "";
    }
  };

  const getRoleDesc = (role: RoleType) => {
    switch (role) {
      case "farmer":
        return t("role.farmer.desc", "Nashik Farmer Producer Node");
      case "buyer":
        return t("role.buyer.desc", "FreshMart Prime Retail & Hypermarkets");
      case "truck_driver":
        return t("role.truck.desc", "Maharashtra Agro Logistics Fleet");
      case "cold_storage_owner":
        return t("role.cold_storage.desc", "MahaAgro Vault 04 & APMC Hubs");
      case "fpo_coordinator":
        return t("role.fpo.desc", "Nashik Farmer Producer Org");
      default:
        return (DEMO_CREDENTIALS as any)[role]?.subtitle || "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6 h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              {t("app.brand", "HARVEST ZERO")}
            </span>
            <span className="text-[10px] uppercase tracking-wide font-semibold rounded px-2 py-0.5 bg-slate-100 text-slate-600">
              BYTEATHON 2026
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <div className="w-[1px] h-4 bg-[#e2e8f0]" />

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {currentUser.display_name}
                </span>
                <Link
                  href={DEMO_CREDENTIALS[currentUser.role as RoleType]?.path || "/farmer/dashboard"}
                  className="h-8 sm:h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center touch-manipulation"
                >
                  {t("nav.dashboard", "Dashboard")}
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center touch-manipulation"
              >
                {t("nav.sign_in", "Sign In")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full space-y-6 sm:space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("app.tagline", "Perishable Cold Chain System")}
          </div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {t("app.hero_title", "Multi-Echelon Agricultural Logistics & Arrhenius Spoilage Prevention")}
          </h1>
          <p className="text-xs text-slate-500 leading-normal">
            {t("app.hero_desc", "Continuous Arrhenius kinetic modeling, satellite microclimate telemetry, and synchronized allocation across 5 supply chain actors.")}
          </p>
        </div>

        {/* 5 Role Selectors (Disciplined Cards) */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("nav.select_role_prompt", "Select Role to Access Console")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.keys(DEMO_CREDENTIALS) as RoleType[]).map((role) => {
              const item = DEMO_CREDENTIALS[role];
              return (
                <div
                  key={role}
                  className="border border-slate-200 rounded-md bg-white p-3.5 sm:p-3 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {getRoleTitle(role)}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {getRoleDesc(role)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400">
                      {role}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLaunchRole(role)}
                      className="h-8 sm:h-7 px-3.5 sm:px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer touch-manipulation"
                    >
                      {t("nav.enter", "Enter")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Overview Specifications */}
        <div className="border border-slate-200 rounded-md bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
            System Subsystems
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Arrhenius Engine</div>
              <p className="text-xs text-slate-500 leading-normal">
                Models activation energies Ea, rate constants k(T), and chilling limits derived from live farm coordinates.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Multi-Echelon Dispatch</div>
              <p className="text-xs text-slate-500 leading-normal">
                Generates tripartite distribution plans pairing produce lots with commercial buyers, reefer trucks, and cold vault buffers.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Real-Time In-App Protocol</div>
              <p className="text-xs text-slate-500 leading-normal">
                Zero external dependencies on SMS or WhatsApp. Synchronized in-app dispatch status across all roles.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
        HARVEST ZERO · BYTEATHON 2026
      </footer>
    </div>
  );
}
