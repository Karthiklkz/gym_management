"use client";

import React from "react";

export default function ClassesPage() {
  const dummyClasses = [
    { id: 1, name: "CrossFit Power Hour", trainer: "Mike Tyson", time: "08:00 AM - 09:00 AM", capacity: "18 / 20", level: "Advanced", color: "border-rose-500 bg-rose-500/5 text-rose-400" },
    { id: 2, name: "Vinyasa Flow Yoga", trainer: "Sarah Connor", time: "10:30 AM - 11:30 AM", capacity: "12 / 15", level: "Beginner", color: "border-emerald-500 bg-emerald-500/5 text-emerald-400" },
    { id: 3, name: "Spin & Cardio Burn", trainer: "John Doe", time: "05:30 PM - 06:30 PM", capacity: "24 / 25", level: "Intermediate", color: "border-sky-500 bg-sky-500/5 text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Classes & Schedules</h1>
        <p className="text-sm text-slate-400">
          Monitor group workout schedules, trainer allocations, and participant capacities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dummyClasses.map((item) => (
          <div key={item.id} className={`rounded-xl border p-6 flex flex-col justify-between h-48 transition-all hover:scale-[1.02] ${item.color}`}>
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white">{item.name}</h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                  {item.level}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">Instructor: {item.trainer}</p>
              <p className="text-xs text-slate-400 mt-2">{item.time}</p>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-800/40 pt-4">
              <span className="text-xs text-slate-400">Class Capacity</span>
              <span className="text-sm font-semibold text-white">{item.capacity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
