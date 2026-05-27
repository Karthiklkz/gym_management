"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function ClassesPage() {
  const { data: classesResponse, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => apiClient<any>("/api/classes"),
  });

  const classes = classesResponse?.data || [];

  const getLevelStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case "ADVANCED":
        return "border-rose-500 bg-rose-500/5 text-rose-400";
      case "INTERMEDIATE":
        return "border-sky-500 bg-sky-500/5 text-sky-400";
      case "BEGINNER":
      default:
        return "border-emerald-500 bg-emerald-500/5 text-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Classes & Schedules</h1>
        <p className="text-sm text-slate-400">
          Monitor group workout schedules, trainer allocations, and participant capacities.
        </p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-10 text-sm flex items-center gap-2">
          <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading schedules...
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((item: any) => {
            const levelClass = getLevelStyles(item.level);
            // Construct trainer display name
            const trainerName = item.trainer?.user?.profile
              ? `${item.trainer.user.profile.firstName} ${item.trainer.user.profile.lastName || ""}`.trim()
              : "Assigned Coach";

            return (
              <div key={item.id} className={`rounded-xl border p-6 flex flex-col justify-between h-48 transition-all hover:scale-[1.02] ${levelClass}`}>
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-white line-clamp-1">{item.name}</h3>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-350 shrink-0">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">Instructor: {trainerName}</p>
                  <p className="text-xs text-slate-400 mt-2">{item.startTime} - {item.endTime}</p>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-800/45 pt-4">
                  <span className="text-xs text-slate-400">Class Capacity</span>
                  <span className="text-sm font-semibold text-white">
                    {item.currentCapacity} / {item.maxCapacity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-[#090D16] border border-slate-800 rounded-xl">
          <p className="text-slate-400 font-semibold text-sm">No gym classes registered yet</p>
        </div>
      )}
    </div>
  );
}
