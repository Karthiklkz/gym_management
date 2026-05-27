"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function EquipmentPage() {
  const { data: equipmentResponse, isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiClient<any>("/api/equipment"),
  });

  const equipment = equipmentResponse?.data || [];

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "MAINTENANCE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RETIRED":
        return "bg-slate-800 text-slate-400 border-slate-700/60";
      case "ACTIVE":
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Equipment Inventory</h1>
        <p className="text-sm text-slate-400">
          Track gym facility physical assets, counts, and maintenance schedules.
        </p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-10 text-sm flex items-center gap-2">
          <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading inventory...
        </div>
      ) : equipment.length > 0 ? (
        <div className="bg-[#090D16] border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b border-slate-800 bg-[#111827]">
            <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">Asset List</h3>
          </div>
          <div className="divide-y divide-slate-800 bg-[#090D16]">
            {equipment.map((item: any) => {
              const statusStyle = getStatusStyles(item.status);
              return (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center font-bold text-[#22C55E]">
                      {item.category.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.category} • Quantity: {item.quantity} 
                        {item.branch ? ` • Branch: ${item.branch.name}` : ""}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}>
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-[#090D16] border border-slate-800 rounded-xl">
          <p className="text-slate-400 font-semibold text-sm">No gym equipment registered yet</p>
        </div>
      )}
    </div>
  );
}
