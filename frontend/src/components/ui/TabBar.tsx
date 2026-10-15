"use client";

import React from "react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
  ) => {
    const total = tabs.length;
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % total;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = total - 1;
    } else {
      return;
    }
    e.preventDefault();
    onTabChange(tabs[nextIndex].id);
    const nextElem = document.getElementById(`tab-${tabs[nextIndex].id}`);
    nextElem?.focus();
  };

  const baseClasses =
    "inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] shrink-0";
  const activeClasses = "bg-[#15803D] text-white shadow-sm font-bold";
  const inactiveClasses = "text-[#6B7280] hover:text-[#14532D] hover:bg-[#F0FDF4]";

  return (
    <div className={"border-t border-black/5 dark:border-white/10 bg-white/30 dark:bg-black/5 " + (className || "")}>
      <div className="overflow-x-auto flex items-center justify-between gap-4 scrollbar-none pb-2">
        <nav
          role="tablist"
          aria-label="Platform Navigation"
          className="flex items-center gap-1 shrink-0"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={"tab-" + tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={"panel-" + tab.id}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={baseClasses + " " + (isActive ? activeClasses : inactiveClasses)}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
