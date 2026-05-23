"use client";

import React from "react";

export default function EquipmentPage() {
  const dummyEquipment = [
    { id: 1, name: "Matrix Fitness Treadmills", category: "Cardio", count: 8, status: "Active", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { id: 2, name: "Olympic Squat Racks & Barbells", category: "Strength", count: 4, status: "Active", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { id: 3, name: "Cable Crossover Machines", category: "Strength", count: 2, status: "Maintenance", statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { id: 4, name: "Rubber Dumbbell Rack Set (5 - 100 lbs)", category: "Free Weights", count: 2, status: "Active", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Equipment Inventory</h1>
        <p className="text-sm text-slate-400">
          Track gym facility physical assets, counts, and maintenance schedules.
        </p>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">Asset List</h3>
        </div>
        <div className="divide-y divide-slate-800 bg-[#090D16]">
          {dummyEquipment.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center font-bold text-[#22C55E]">
                  {item.category.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.category} • Quantity: {item.count}</p>
                </div>
              </div>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.statusColor}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
