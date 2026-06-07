"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<"members" | "trainers">("members");
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all attendance and branch listing
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ["adminAttendanceList", branchId, startDate, endDate],
    queryFn: () => {
      let url = `/api/dashboard/attendance?`;
      if (branchId) url += `&branchId=${branchId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      return apiClient<any>(url);
    },
  });

  const attendanceData = attendanceResponse?.data || {
    members: [],
    trainers: [],
    branches: []
  };

  const membersList = attendanceData.members;
  const trainersList = attendanceData.trainers;
  const branches = attendanceData.branches;

  const handleResetFilters = () => {
    setBranchId("");
    setStartDate("");
    setEndDate("");
  };

  // Duration Formatter Helper
  const formatDuration = (mins: number | null, isActive: boolean) => {
    if (mins !== null) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
    }
    return isActive ? "Active" : "--";
  };

  // Define Members columns
  const memberColumns = [
    {
      header: "Workout Date",
      render: (row: any) => (
        <span className="font-semibold text-white">
          {new Date(row.checkIn).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    },
    {
      header: "Member Name",
      render: (row: any) => (
        <div>
          <span className="font-semibold text-slate-100">{row.name}</span>
          {row.memberId && (
            <span className="inline-block ml-2 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/10">
              {row.memberId}
            </span>
          )}
          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{row.email}</span>
        </div>
      )
    },
    {
      header: "Check-In",
      render: (row: any) => (
        <span className="text-slate-300 font-medium">
          {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: "Check-Out",
      render: (row: any) => (
        <span className="text-slate-350">
          {row.checkOut 
            ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : <span className="text-[#22C55E] font-bold">Active in branch</span>
          }
        </span>
      )
    },
    {
      header: "Workout Length",
      render: (row: any) => {
        const isAct = !row.checkOut;
        return (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isAct 
              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 animate-pulse" 
              : "bg-slate-800 text-slate-300 border border-slate-700/60"
          }`}>
            {formatDuration(row.durationMinutes, isAct)}
          </span>
        );
      }
    },
    {
      header: "Branch",
      render: (row: any) => <span className="text-slate-400 font-medium text-xs">{row.branchName}</span>
    }
  ];

  // Define Trainers columns
  const trainerColumns = [
    {
      header: "Workout Date",
      render: (row: any) => (
        <span className="font-semibold text-white">
          {row.checkIn ? new Date(row.checkIn).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : "N/A"}
        </span>
      )
    },
    {
      header: "Trainer Name",
      render: (row: any) => (
        <div>
          <span className="font-semibold text-slate-100">{row.name}</span>
          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{row.email}</span>
        </div>
      )
    },
    {
      header: "Check-In",
      render: (row: any) => (
        <span className="text-slate-300 font-medium">
          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
        </span>
      )
    },
    {
      header: "Check-Out",
      render: (row: any) => (
        <span className="text-slate-350">
          {row.checkOut 
            ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : (row.checkIn ? <span className="text-[#22C55E] font-bold">On Shift</span> : "--")
          }
        </span>
      )
    },
    {
      header: "Shift Length",
      render: (row: any) => {
        const isAct = row.checkIn && !row.checkOut;
        return (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isAct 
              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 animate-pulse" 
              : "bg-slate-800 text-slate-300 border border-slate-700/60"
          }`}>
            {formatDuration(row.durationMinutes, isAct)}
          </span>
        );
      }
    },
    {
      header: "Branch",
      render: (row: any) => <span className="text-slate-400 font-medium text-xs">{row.branchName}</span>
    }
  ];

  // Calculated Stats
  const activeMembersNow = membersList.filter((r: any) => !r.checkOut).length;
  const activeTrainersNow = trainersList.filter((r: any) => r.checkIn && !r.checkOut).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Analytics</h1>
          <p className="text-sm text-slate-400">
            Calculate workout session lengths, track trainer shifts, and view presence trends.
          </p>
        </div>
      </div>

      {/* Grid of Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#090D16] border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Member Visits</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{membersList.length}</h3>
          </div>
          <span className="text-[10px] text-slate-450 font-medium">Logged in filter range</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Members Active Now</span>
            <h3 className="text-2xl font-extrabold text-[#22C55E] mt-1">{activeMembersNow}</h3>
          </div>
          <span className="text-[10px] text-slate-450 font-medium">Currently training in gym</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Trainer Shifts</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{trainersList.length}</h3>
          </div>
          <span className="text-[10px] text-slate-450 font-medium">Work sessions in range</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Coaches Active Now</span>
            <h3 className="text-2xl font-extrabold text-[#22C55E] mt-1">{activeTrainersNow}</h3>
          </div>
          <span className="text-[10px] text-slate-450 font-medium">Currently on-duty coaches</span>
        </div>
      </div>

      {/* Date & Branch Filters Row */}
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Filter Gym Branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full sm:w-56 bg-[#0F172A] border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#22C55E]"
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5 tracking-wider">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-44 bg-[#0F172A] border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#22C55E]"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5 tracking-wider">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-44 bg-[#0F172A] border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#22C55E]"
          />
        </div>

        <button
          onClick={handleResetFilters}
          disabled={!branchId && !startDate && !endDate}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer border ${
            activeTab === "members"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          📂 Members Attendance
        </button>
        <button
          onClick={() => setActiveTab("trainers")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer border ${
            activeTab === "trainers"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          📂 Trainers Presence
        </button>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-10 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
            Loading attendance records...
          </div>
        ) : (
          <Table
            columns={activeTab === "members" ? memberColumns : trainerColumns}
            data={activeTab === "members" ? membersList : trainersList}
            searchPlaceholder={activeTab === "members" ? "Search members by name or email..." : "Search trainers by name or email..."}
            searchKey={(row: any) => `${row.name} ${row.email} ${row.branchName} ${row.memberId || ""}`}
          />
        )}
      </div>
    </div>
  );
}
