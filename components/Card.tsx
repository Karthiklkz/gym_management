"use client";

import React from "react";

interface CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export default function Card({ title, value, icon, subtitle, trend }: CardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#090D16] p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-slate-700/80">
      {/* Background glow decorator */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#22C55E]/5 blur-3xl" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">
            {value}
          </h3>
        </div>
        {icon && (
          <div className="rounded-lg bg-slate-800/80 p-3 text-[#22C55E] ring-1 ring-slate-700/50">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
