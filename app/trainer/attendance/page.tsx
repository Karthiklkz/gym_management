"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Modal from "@/components/Modal";

export default function TrainerAttendancePage() {
  const queryClient = useQueryClient();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  
  // Date filter (defaults to today's date)
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);

  // Check-In member search
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [checkInError, setCheckInError] = useState("");

  // Fetch Trainer Branch Attendance
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ["trainerAttendance", filterDate],
    queryFn: () => apiClient<any>(`/api/trainer/attendance?date=${filterDate}`),
  });

  // Fetch All branch members for check-in dropdown search
  const { data: membersResponse } = useQuery({
    queryKey: ["trainerAllMembers", memberSearch],
    queryFn: () => {
      let url = "/api/trainer/members?limit=50";
      if (memberSearch) url += `&search=${encodeURIComponent(memberSearch)}`;
      return apiClient<any>(url);
    },
  });

  const attendanceRecords = attendanceResponse?.data || [];
  const searchResults = membersResponse?.data?.members || [];

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiClient("/api/trainer/attendance", {
        method: "POST",
        body: JSON.stringify({ memberId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["trainerDashboardStats"] });
      setIsCheckInOpen(false);
      setMemberSearch("");
      setSelectedMemberId("");
      setCheckInError("");
    },
    onError: (err: any) => {
      setCheckInError(err.message || "Failed to check in member");
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: (attendanceId: string) =>
      apiClient(`/api/trainer/attendance/${attendanceId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["trainerDashboardStats"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to check out member");
    },
  });

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setCheckInError("Please select a member to check in");
      return;
    }
    setCheckInError("");
    checkInMutation.mutate(selectedMemberId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Branch Attendance</h1>
          <p className="text-sm text-slate-400">Track active member workouts and check in branch arrivals.</p>
        </div>
        <button
          onClick={() => {
            setCheckInError("");
            setIsCheckInOpen(true);
          }}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold px-4 py-2 rounded-lg text-sm transition cursor-pointer shadow-md shadow-emerald-500/10"
        >
          + Check-In Member
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Filter Workout Date
          </label>
          <div className="w-full md:w-56">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-400 py-6 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading attendance records...
          </div>
        ) : attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-450 uppercase border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Member</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Check-In Time</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Check-Out Time</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Duration</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {attendanceRecords.map((record: any) => {
                  const checkIn = new Date(record.checkIn);
                  const checkOut = record.checkOut ? new Date(record.checkOut) : null;
                  
                  let duration = "Active Session";
                  if (checkOut) {
                    const diffMs = checkOut.getTime() - checkIn.getTime();
                    const diffHrs = Math.floor(diffMs / 3600000);
                    const diffMins = Math.floor((diffMs % 3600000) / 60000);
                    duration = `${diffHrs}h ${diffMins}m`;
                  }

                  return (
                    <tr key={record.id} className="hover:bg-slate-900/20 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {record.member?.user?.profile?.firstName} {record.member?.user?.profile?.lastName || ""}
                        <span className="block text-[10px] text-slate-500 font-normal">{record.member?.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        {checkIn.toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {checkOut ? (
                          <span className="text-slate-500">{checkOut.toLocaleTimeString()}</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 animate-pulse">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-450">
                        {duration}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {!checkOut && (
                          <button
                            onClick={() => checkOutMutation.mutate(record.id)}
                            disabled={checkOutMutation.isPending}
                            className="bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-md font-bold transition cursor-pointer"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-450 font-medium text-sm">No attendance records found</p>
            <p className="text-slate-550 text-xs mt-1">There are no member sessions registered on this date.</p>
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Check In Branch Member"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          {checkInError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-semibold">
              {checkInError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
              Search Member *
            </label>
            <input
              type="text"
              placeholder="Type name or email to search..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setSelectedMemberId(""); // Clear selection
              }}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {memberSearch && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-800/80">
              {searchResults.length > 0 ? (
                searchResults.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(m.id);
                      setMemberSearch(`${m.user?.profile?.firstName} ${m.user?.profile?.lastName || ""}`.trim());
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition cursor-pointer flex justify-between items-center ${
                      selectedMemberId === m.id
                        ? "bg-[#22C55E]/15 text-[#22C55E]"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {m.user?.profile?.firstName} {m.user?.profile?.lastName || ""}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{m.user?.email}</p>
                    </div>
                    {selectedMemberId === m.id && (
                      <span className="text-emerald-400 font-bold">✓ Selected</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-550">No matching members found</div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setIsCheckInOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={checkInMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {checkInMutation.isPending ? "Confirming..." : "Confirm Arrival"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
