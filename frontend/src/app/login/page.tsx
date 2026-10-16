"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RoleType,
  DEMO_CREDENTIALS,
  loginWithRole,
  setStoredUser,
} from "@/lib/auth";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrKisan, setEmailOrKisan] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType>("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleDemoLogin = (role: RoleType) => {
    setLoading(true);
    loginWithRole(role);
    router.push(DEMO_CREDENTIALS[role].path);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrKisan) {
      setError("Please enter your PM-KISAN ID or email.");
      return;
    }

    setLoading(true);
    setError(null);

    let role = selectedRole;
    if (emailOrKisan.includes("fpo")) role = "fpo_coordinator";
    else if (emailOrKisan.includes("storage")) role = "cold_storage_owner";
    else if (emailOrKisan.includes("truck")) role = "truck_driver";
    else if (emailOrKisan.includes("buyer")) role = "buyer";

    const user = {
      user_id: `user-${Date.now()}`,
      email: emailOrKisan.includes("@") ? emailOrKisan : `${emailOrKisan}@pmkisan.gov.in`,
      role: role,
      display_name: emailOrKisan.includes("@")
        ? DEMO_CREDENTIALS[role].subtitle
        : `Farmer ${emailOrKisan}`,
      phone: "+91-9876543210",
      linked_entity_id: emailOrKisan,
    };

    setStoredUser(user);
    router.push(DEMO_CREDENTIALS[role].path);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6 h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            {t("app.brand", "HARVEST ZERO")}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {t("app.tagline", "Perishable Logistics Platform")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">
            {t("nav.sign_in", "Sign In to Platform")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("nav.select_role_prompt", "Select a role to start or authenticate using your PM-KISAN identifier.")}
          </p>
        </div>

        {/* 1-Click Role Direct Access Strip */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Role Profiles
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {(Object.keys(DEMO_CREDENTIALS) as RoleType[]).map((role) => {
              const cred = DEMO_CREDENTIALS[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDemoLogin(role)}
                  disabled={loading}
                  className="p-2.5 rounded-md border border-slate-200 bg-white text-left hover:border-slate-300 cursor-pointer space-y-1 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900">
                    {cred.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {cred.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="max-w-sm mx-auto border border-slate-200 rounded-md bg-white p-4 space-y-4">
          <div className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Credentials or PM-KISAN
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none cursor-pointer"
              >
                {(["farmer", "fpo_coordinator", "cold_storage_owner", "truck_driver", "buyer"] as RoleType[]).map((r) => (
                  <option key={r} value={r}>
                    {DEMO_CREDENTIALS[r].title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">PM-KISAN ID or Email</label>
              <input
                type="text"
                placeholder={selectedRole === "farmer" ? "102938475612 or farmer@demo.com" : "demo@demo.com"}
                value={emailOrKisan}
                onChange={(e) => setEmailOrKisan(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
              />
            </div>

            {/* Allowed full-width button only on login submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-8 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
        HARVEST ZERO · Agricultural Perishable Protection
      </footer>
    </div>
  );
}
