"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleType, DEMO_CREDENTIALS, getStoredUser, setStoredUser, loginWithRole } from "@/lib/auth";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n";

interface RoleHeaderProps {
  currentRole: RoleType;
  title: string;
}

export function RoleHeader({ currentRole }: RoleHeaderProps) {
  const router = useRouter();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const activeUser = getStoredUser();
  const { t, language } = useLanguage();

  const handleSwitchRole = (role: RoleType) => {
    loginWithRole(role);
    setRoleSwitcherOpen(false);
    router.push(DEMO_CREDENTIALS[role].path);
  };

  const handleLogout = () => {
    setStoredUser(null);
    router.push("/login");
  };

  const currentCreds = DEMO_CREDENTIALS[currentRole];

  const getRoleDisplayName = (role: RoleType) => {
    switch (role) {
      case "farmer":
        return t("role.farmer", "Farmer");
      case "buyer":
        return t("role.buyer", "Commercial Buyer");
      case "truck_driver":
        return t("role.truck", "Reefer Truck");
      case "cold_storage_owner":
        return t("role.cold_storage", "Cold Storage");
      case "fpo_coordinator":
        return t("role.fpo", "FPO");
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] h-[52px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between">
        {/* Left Section: Brand, Divider, Role Chip, Divider, User Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href={currentCreds.path} className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-[14px] sm:text-[15px] font-extrabold tracking-[-0.3px] text-[#0f172a]">
              {t("app.brand", "HARVEST ZERO")}
            </span>
            <div className="w-[1px] h-4 bg-[#e2e8f0]" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-[#f1f5f9] text-[#64748b] rounded px-1.5 sm:px-2 py-0.5 font-medium whitespace-nowrap">
              {getRoleDisplayName(currentRole)}
            </span>
          </Link>
          <div className="w-[1px] h-4 bg-[#e2e8f0] hidden md:block" />
          <span className="text-[12px] sm:text-[13px] text-[#64748b] hidden md:inline truncate max-w-xs">
            {activeUser?.display_name || currentCreds.subtitle}
          </span>
        </div>

        {/* Right Section: Language Switcher, Switch Role, Divider, Notification Bell */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher Button (EN | தமிழ்) */}
          <LanguageSwitcher />

          <div className="w-[1px] h-4 bg-[#e2e8f0]" />

          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="text-[12px] text-slate-600 hover:text-[#0f172a] cursor-pointer transition-colors py-2 px-1 touch-manipulation font-medium"
            >
              {t("nav.switch_role", "Switch Role")}
            </button>

            {roleSwitcherOpen && (
              <>
                {/* Backdrop for mobile click-outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
                  onClick={() => setRoleSwitcherOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-64 max-w-[calc(100vw-24px)] bg-white border border-slate-200 shadow-xl rounded-md p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    {t("nav.switch_dashboard", "Switch Dashboard")}
                  </div>
                  {(Object.keys(DEMO_CREDENTIALS) as RoleType[]).map((role) => {
                    const item = DEMO_CREDENTIALS[role];
                    const isCurrent = role === currentRole;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleSwitchRole(role)}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between touch-manipulation ${
                          isCurrent
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{getRoleDisplayName(role)}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {t("nav.active", "Active")}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer touch-manipulation"
                    >
                      {t("nav.sign_out", "Sign Out")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#e2e8f0]" />

          {/* In-App Notification Bell */}
          <NotificationBell role={currentRole} />
        </div>
      </div>
    </header>
  );
}
