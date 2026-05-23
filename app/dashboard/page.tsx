"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Card from "@/components/Card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Admin");
  const [role, setRole] = useState("");

  // Auth Guard & Info Retrieval
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setRole(userObj.role || "");
        
        if (userObj.role === "SUPER_ADMIN") {
          setDisplayName("Super Admin");
        } else {
          const name = `${userObj.profile?.firstName || ""} ${userObj.profile?.lastName || ""}`.trim();
          setDisplayName(name || "Admin");
        }
      } catch (e) {}
    }
  }, [router]);

  // Fetch Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => apiClient<any>("/api/dashboard/stats"),
  });

  // Fetch Members (to show recent signups)
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient<any>("/api/members"),
  });

  const stats = statsData?.data || {
    totalMembers: 0,
    totalTrainers: 0,
    activePlans: 0,
    monthlyRevenue: 0,
  };

  const recentMembers = (membersData?.data || []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-slate-400 mt-1">
          {role === "SUPER_ADMIN"
            ? "Here is a global overview of your PeakPulse Gym Networks today."
            : "Here is what is happening at your PeakPulse Elite Fitness today."}
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          title="Total Members"
          value={statsLoading ? "..." : stats.totalMembers}
          subtitle={role === "SUPER_ADMIN" ? "Global members" : "Registered members"}
          trend={{ value: "+8% from last month", isPositive: true }}
        />
        <Card
          title={role === "SUPER_ADMIN" ? "Gym Networks" : "Active Memberships"}
          value={statsLoading ? "..." : stats.activePlans}
          subtitle={role === "SUPER_ADMIN" ? "Registered gym accounts" : "Currently active plans"}
          trend={role === "SUPER_ADMIN" ? undefined : { value: "+5% new signups", isPositive: true }}
        />
        <Card
          title="Trainers"
          value={statsLoading ? "..." : stats.totalTrainers}
          subtitle={role === "SUPER_ADMIN" ? "Coaches globally" : "Certified fitness coaches"}
        />
        <Card
          title="Monthly Revenue"
          value={statsLoading ? "..." : `$${Number(stats.monthlyRevenue).toLocaleString()}`}
          subtitle={role === "SUPER_ADMIN" ? "Global payments" : "Payments this month"}
          trend={{ value: "+12.5% increase", isPositive: true }}
        />
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members Panel */}
        <div className="lg:col-span-2 bg-[#090D16] border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Member Registrations
          </h3>

          {membersLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : recentMembers.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {recentMembers.map((member: any) => (
                <div key={member.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800/80 flex items-center justify-center text-sm font-semibold text-[#22C55E]">
                      {member.user?.profile?.firstName?.charAt(0) || "M"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {member.user?.profile?.firstName} {member.user?.profile?.lastName || ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {member.memberships[0]?.membershipPlan?.name || "No Plan"}
                    </span>
                    {role === "SUPER_ADMIN" && member.user?.gym?.name && (
                      <span className="text-[10px] text-emerald-400/90 font-medium mt-1 uppercase tracking-wider">
                        {member.user.gym.name}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      Joined {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4">No recent members</p>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              {role === "SUPER_ADMIN" ? "Quick Network Actions" : "Quick Admin Actions"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {role === "SUPER_ADMIN"
                ? "Perform standard administrative actions globally across all networks."
                : "Quickly perform standard administrative actions for your gym branch."}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard/members")}
              className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
            >
              Manage Members
            </button>
            <button
              onClick={() => router.push("/dashboard/trainers")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
            >
              {role === "SUPER_ADMIN" ? "Manage Trainers" : "View Trainers"}
            </button>
            {role === "SUPER_ADMIN" ? (
              <button
                onClick={() => router.push("/dashboard/gyms")}
                className="w-full bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20 font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                Manage Gym Networks
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard/payments")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer text-center block"
              >
                Billing & Payments
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}