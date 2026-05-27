"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function MemberAttendancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch Member Attendance Logs
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ["memberAttendanceList", currentPage, startDate, endDate],
    queryFn: () => {
      let url = `/api/member/attendance?page=${currentPage}&limit=10`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      return apiClient<any>(url);
    },
  });

  const attendanceData = attendanceResponse?.data || {
    attendance: [],
    pagination: { total: 0, totalPages: 1 }
  };

  const list = attendanceData.attendance;
  const pagination = attendanceData.pagination;

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workout Logs & Attendance</h1>
          <p className="text-sm text-slate-400">View your full fitness visit logs, session check-ins, and durations.</p>
        </div>
      </div>

      {/* Date Filters Row */}
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5 tracking-wider">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-44 bg-[#0F172A] border border-slate-750 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#22C55E]"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5 tracking-wider">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-44 bg-[#0F172A] border border-slate-750 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#22C55E]"
          />
        </div>
        <button
          onClick={handleResetFilters}
          disabled={!startDate && !endDate}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Attendance List */}
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-10 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading attendance records...
          </div>
        ) : list.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-450 uppercase border-b border-slate-800 bg-slate-900/50">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold text-slate-400">Workout Date</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-400">Check-In</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-400">Check-Out</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-400 text-center">Session Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {list.map((record: any) => {
                    let formattedDuration = "--";
                    if (record.durationMinutes !== null) {
                      const mins = record.durationMinutes;
                      const hrs = Math.floor(mins / 60);
                      const remainingMins = mins % 60;
                      formattedDuration = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
                    } else if (record.checkIn && !record.checkOut) {
                      formattedDuration = "Active Now";
                    }

                    return (
                      <tr key={record.id} className="hover:bg-slate-900/20 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {new Date(record.checkIn).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-350">
                          {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-350">
                          {record.checkOut 
                            ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : <span className="text-[#22C55E] font-bold">Active in branch</span>
                          }
                        </td>
                        <td className="py-3.5 px-4 text-xs text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            record.checkOut 
                              ? "bg-slate-800 text-slate-300 border border-slate-700/60" 
                              : "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 animate-pulse"
                          }`}>
                            {formattedDuration}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-6 border-t border-slate-850">
                <span className="text-xs text-slate-500 font-medium">
                  Page {currentPage} of {pagination.totalPages} ({pagination.total} total sessions)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-450 font-semibold text-sm">No attendance records found</p>
            <p className="text-slate-550 text-xs mt-1">Change your date filters or check-in at the front desk desk.</p>
          </div>
        )}
      </div>
    </div>
  );
}
