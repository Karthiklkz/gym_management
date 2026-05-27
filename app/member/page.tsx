"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Card from "@/components/Card";
import { useRouter } from "next/navigation";

export default function MemberDashboard() {
  const router = useRouter();

  // Fetch Member Dashboard Stats
  const { data: dashboardResponse, isLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ["memberDashboardStats"],
    queryFn: () => apiClient<any>("/api/member/dashboard"),
  });

  const toggleSelfAttendanceMutation = useMutation({
    mutationFn: () => apiClient("/api/member/attendance", { method: "POST" }),
    onSuccess: () => {
      refetchDashboard();
    }
  });

  // Fetch Member Notifications (limit to 5)
  const { data: notificationsResponse } = useQuery({
    queryKey: ["memberNotifications"],
    queryFn: () => apiClient<any>("/api/member/notifications?limit=5"),
  });

  const responseData = dashboardResponse?.data || {
    profile: null,
    activeMembership: null,
    checkInStatus: 'NOT_CHECKED_IN',
    todayAttendanceDetail: null,
    recentAttendance: [],
    unreadNotificationCount: 0,
    attendanceStreaks: null
  };

  const streaks = responseData.attendanceStreaks || {
    currentStreak: 0,
    maxStreak: 0,
    totalVisits: 0,
    weeklyChecklist: [false, false, false, false, false, false, false]
  };

  const notifications = (notificationsResponse?.data?.notifications || []).slice(0, 5);

  const profile = responseData.profile || {};
  const activePlan = responseData.activeMembership;
  const fullName = `${profile.firstName || "Member"} ${profile.lastName || ""}`.trim();

  // Map check-in status to user-friendly text and colors
  let attendanceText = "Not Checked In";
  let attendanceSubtitle = "Scan or check-in at the front desk";
  if (responseData.checkInStatus === 'CHECKED_IN') {
    attendanceText = "Active Inside";
    attendanceSubtitle = `Checked in at ${new Date(responseData.todayAttendanceDetail?.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (responseData.checkInStatus === 'CHECKED_OUT') {
    attendanceText = "Completed Today";
    attendanceSubtitle = `Checked out at ${new Date(responseData.todayAttendanceDetail?.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Hello, {profile.firstName || "Athlete"}!
          </h1>
          <p className="text-slate-400 mt-1">
            Track your workout logs, active plan details, and stay updated.
          </p>
        </div>
        
        {responseData.unreadNotificationCount > 0 && (
          <div 
            onClick={() => router.push("/member/notifications")}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/25 transition rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            {responseData.unreadNotificationCount} New Alerts
          </div>
        )}
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Active Membership"
          value={isLoading ? "..." : (activePlan?.planName || "No Active Plan")}
          subtitle={activePlan ? `Expires: ${new Date(activePlan.endDate).toLocaleDateString()}` : "Visit admin to renew"}
        />
        <Card
          title="Days Remaining"
          value={isLoading ? "..." : (activePlan?.daysRemaining ?? 0)}
          subtitle={activePlan ? "Active days left on membership" : "Renew membership today"}
        />
        <Card
          title="Today's Attendance"
          value={isLoading ? "..." : attendanceText}
          subtitle={attendanceSubtitle}
        />
      </div>

      {/* Main Widgets layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Recent Workout History & Streaks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Consistency & Streaks Widget */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Fitness Consistency & Streaks</h3>
                <p className="text-xs text-slate-400 mt-0.5">Stay regular, build momentum, and keep the fire burning!</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                🔥 Active Streak
              </div>
            </div>

            {/* Streak & Trophy Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl animate-pulse">
                  🔥
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Current Streak</span>
                  <span className="text-xl font-extrabold text-orange-400">{streaks.currentStreak} Days</span>
                </div>
              </div>

              <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Personal Best</span>
                  <span className="text-xl font-extrabold text-yellow-400">{streaks.maxStreak} Days</span>
                </div>
              </div>

              <div className="bg-[#050811]/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
                  💪
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Visits</span>
                  <span className="text-xl font-extrabold text-emerald-400">{streaks.totalVisits} Workouts</span>
                </div>
              </div>
            </div>

            {/* Weekly Checklist View */}
            <div className="bg-[#050811]/30 border border-slate-850/80 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly Consistency Tracker</h4>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => {
                  const visited = streaks.weeklyChecklist[idx];
                  return (
                    <div key={dayName} className="flex flex-col items-center gap-1.5">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md ${
                        visited 
                          ? "bg-[#22C55E] text-black shadow-[#22C55E]/15 border border-[#22C55E]/30" 
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}>
                        {visited ? "✓" : dayName.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Recent Workouts (Last 5 Sessions)
              </h3>
              <button 
                onClick={() => router.push("/member/attendance")}
                className="text-xs text-[#22C55E] hover:underline font-semibold"
              >
                View Full Log
              </button>
            </div>

            {isLoading ? (
              <div className="text-slate-400 text-sm py-4">Loading workout history...</div>
            ) : responseData.recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-450 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-400">Date</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Check-In</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Check-Out</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {responseData.recentAttendance.map((item: any) => {
                      let durationStr = "Active";
                      if (item.checkIn && item.checkOut) {
                        const diffMs = new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime();
                        const mins = Math.round(diffMs / (1000 * 60));
                        const hrs = Math.floor(mins / 60);
                        const remainingMins = mins % 60;
                        durationStr = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins} mins`;
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/20 transition">
                          <td className="py-3 px-4 font-semibold text-white">
                            {new Date(item.checkIn).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-350 font-medium">
                            {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-350 font-medium">
                            {item.checkOut 
                              ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : <span className="text-[#22C55E] font-semibold">Active Session</span>
                            }
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.checkOut 
                                ? "bg-slate-800 text-slate-300 border border-slate-700/60" 
                                : "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                            }`}>
                              {durationStr}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-550">No workouts recorded yet.</p>
                <p className="text-xs text-slate-600 mt-1">Visit your branch gym to start your first fitness workout!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Profile Summary Panel */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">My Account</h3>
            {isLoading ? (
              <div className="text-slate-400 text-sm">Loading profile info...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={fullName} 
                      className="h-14 w-14 rounded-xl object-cover border border-slate-700 shadow-md"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold text-2xl shadow-inner">
                      {profile.firstName?.charAt(0) || "M"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">{fullName}</h4>
                    <p className="text-xs text-[#22C55E] font-semibold mt-1">Athlete Member</p>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Join Date</span>
                    <span className="text-slate-300 font-semibold">
                      {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[170px]">{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phone</span>
                    <span className="text-slate-300 font-semibold">{profile.phone || "Not Set"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Shortcuts</h3>
            <div className="space-y-3">
              {/* Member Self Check-In/Out Toggle */}
              <button
                onClick={() => toggleSelfAttendanceMutation.mutate()}
                disabled={toggleSelfAttendanceMutation.isPending}
                className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition duration-300 border flex items-center justify-center gap-2 cursor-pointer ${
                  responseData.checkInStatus === 'CHECKED_IN'
                    ? "bg-rose-500/15 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                    : "bg-emerald-500/15 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${responseData.checkInStatus === 'CHECKED_IN' ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                {responseData.checkInStatus === 'CHECKED_IN' ? "🔴 Workout Active: Check Out" : "🟢 Start Workout: Check In"}
              </button>

              <button
                onClick={() => router.push("/member/membership")}
                className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block shadow-sm shadow-emerald-500/5"
              >
                View Membership History
              </button>
              <button
                onClick={() => router.push("/member/attendance")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                View Attendance Logs
              </button>
              <button
                onClick={() => router.push("/member/profile")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                My Profile Settings
              </button>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
            {notifications.length > 0 ? (
              <div className="space-y-3.5">
                {notifications.map((n: any) => (
                  <div 
                    key={n.id} 
                    onClick={() => router.push("/member/notifications")}
                    className={`text-xs border-l-2 pl-3 py-0.5 cursor-pointer ${
                      !n.isRead ? "border-emerald-500 bg-[#22C55E]/5" : "border-slate-700"
                    }`}
                  >
                    <h5 className={`font-bold leading-snug ${!n.isRead ? "text-white" : "text-slate-350"}`}>{n.title}</h5>
                    <p className="text-slate-400 mt-0.5 leading-relaxed truncate">{n.message}</p>
                    <span className="text-[10px] text-slate-550 block mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-550 py-2">No recent notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
