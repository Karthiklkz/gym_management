"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function TrainerGymDetailsPage() {
  // Fetch Gym Details (accessible by TRAINER as well)
  const { data: gymResponse, isLoading } = useQuery({
    queryKey: ["gymDetails"],
    queryFn: () => apiClient<any>("/api/gym-admin/gym"),
  });

  const gym = gymResponse?.data || null;

  if (isLoading) {
    return (
      <div className="py-10 text-slate-400 text-sm flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Retrieving branch gym details...
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
        <p className="text-slate-400 font-semibold text-sm">Gym not found</p>
        <p className="text-slate-550 text-xs mt-1">Please ensure your trainer profile is associated with a gym record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Details</h1>
        <p className="text-sm text-slate-400">View information about your assigned gym branch, locations, and network registration.</p>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h3 className="text-lg font-bold text-white">{gym.name} Info</h3>
          <p className="text-xs text-slate-500">PeakPulse Authorized Elite Fitness Center Branch</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gym Name</span>
            <p className="text-sm font-semibold text-white mt-1">{gym.name}</p>
          </div>
          <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Owner Name</span>
            <p className="text-sm font-semibold text-white mt-1">{gym.ownerName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contact Phone</span>
            <p className="text-sm font-semibold text-white mt-1">{gym.phone}</p>
          </div>
          <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">GST Registration</span>
            <p className="text-sm font-semibold text-white font-mono mt-1 uppercase">{gym.gst || "Not Configured"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
          <div className="md:col-span-2 bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gym Location</span>
            <p className="text-sm font-semibold text-white mt-1">{gym.location || "N/A"}</p>
          </div>
          <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pincode</span>
            <p className="text-sm font-semibold text-white font-mono mt-1">{gym.pincode || "N/A"}</p>
          </div>
        </div>

        <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Physical Street Address</span>
          <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{gym.address || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}
