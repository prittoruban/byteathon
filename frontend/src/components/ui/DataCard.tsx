"use client";

import React from "react";

interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export function DataCard({
  children,
  className,
  padding = "md",
  hover = true,
}: DataCardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`rounded-2xl bg-white border border-[#BBF7D0] shadow-sm transition-all duration-200 ${
        hover
          ? "hover:shadow-md hover:-translate-y-1 cursor-default"
          : ""
      } ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface DataCardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  className?: string;
}

export function DataCardHeader({
  title,
  description,
  icon: Icon,
  badge,
  className,
}: DataCardHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 ${className}`}>
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-[#15803D]" />}
        <div>
          <h3 className="font-bold text-[#14532D] font-mono text-sm tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}
