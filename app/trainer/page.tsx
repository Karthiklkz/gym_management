"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Card from "@/components/Card";
import { useRouter } from "next/navigation";

export default function TrainerDashboard() {
  const router = useRouter();

  // Fetch Trainer Dashboard Stats
  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ["trainerDashboardStats"],
    queryFn: () => apiClient<any>("/api/trainer/dashboard"),
  });

  // Fetch Trainer Notifications
  const { data: notificationsResponse } = useQuery({
    queryKey: ["trainerNotifications"],
    queryFn: () => apiClient<any>("/api/trainer/notifications?limit=5"),
  });

  const data = dashboardResponse?.data || {
    trainerProfile: null,
    branchMemberCount: 0,
    todayAttendanceCount: 0,
    expiringMemberships: []
  };

  const notifications = (notificationsResponse?.data?.notifications || []).slice(0, 5);

  const profile = data.trainerProfile?.profile || {};
  const trainerInfo = data.trainerProfile?.trainer || {};
  const fullName = `${profile.firstName || "Trainer"} ${profile.lastName || ""}`.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, Coach {profile.firstName || ""}
        </h1>
        <p className="text-slate-400 mt-1">
          Here is your branch performance and trainer dashboard today.
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Branch Members"
          value={isLoading ? "..." : data.branchMemberCount}
          subtitle="Registered members in your branch"
        />
        <Card
          title="Today's Attendance"
          value={isLoading ? "..." : data.todayAttendanceCount}
          subtitle="Branch check-ins today"
        />
        <Card
          title="Expiring Memberships"
          value={isLoading ? "..." : data.expiringMemberships.length}
          subtitle="Expiring in the next 7 days"
        />
      </div>

      {/* Main Widgets layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Expiring Memberships */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Upcoming Membership Expirations (7 Days)
              </h3>
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                Attention Required
              </span>
            </div>

            {isLoading ? (
              <div className="text-slate-400 text-sm py-4">Loading expiring memberships...</div>
            ) : data.expiringMemberships.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-450 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-400">Member</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Membership Plan</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Expiration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {data.expiringMemberships.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-900/20 transition">
                        <td className="py-3 px-4 font-semibold text-white">
                          {item.member?.user?.profile?.firstName} {item.member?.user?.profile?.lastName || ""}
                          <span className="block text-[10px] text-slate-500 font-normal">{item.member?.user?.email}</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                            {item.membershipPlan?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-rose-400 font-semibold">
                          {new Date(item.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-550 py-6 text-center">No memberships expiring in the next 7 days.</p>
            )}
          </div>
        </div>

        {/* Right column - Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Profile Summary Panel */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Summary</h3>
            {isLoading ? (
              <div className="text-slate-400 text-sm">Loading profile info...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold text-2xl shadow-inner">
                    {profile.firstName?.charAt(0) || "T"}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">{fullName}</h4>
                    <p className="text-xs text-[#22C55E] font-semibold mt-1">Certified Fitness Coach</p>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Specialization</span>
                    <span className="text-slate-300 font-semibold">{trainerInfo.specialization || "General Fitness"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Experience</span>
                    <span className="text-slate-300 font-semibold">{trainerInfo.experienceYears ? `${trainerInfo.experienceYears} Years` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Certifications</span>
                    <span className="text-slate-400 italic text-right truncate max-w-[150px]">{trainerInfo.certification || "None"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Coach Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/trainer/members")}
                className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block shadow-sm shadow-emerald-500/5"
              >
                Search Members Directory
              </button>
              <button
                onClick={() => router.push("/trainer/attendance")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                Attendance check-in
              </button>
              <button
                onClick={() => router.push("/trainer/profile")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                View Coach Profile
              </button>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Notifications</h3>
            {notifications.length > 0 ? (
              <div className="space-y-3.5">
                {notifications.map((n: any) => (
                  <div key={n.id} className="text-xs border-l-2 border-emerald-500 pl-3 py-0.5">
                    <h5 className="font-bold text-white leading-snug">{n.title}</h5>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
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
