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

  const [granularity, setGranularity] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [hoveredRev, setHoveredRev] = useState<number | null>(null);
  const [hoveredMem, setHoveredMem] = useState<number | null>(null);

  // Fetch Stats (refetches when granularity changes)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats", granularity],
    queryFn: () => apiClient<any>(`/api/dashboard/stats?granularity=${granularity}`),
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
    chartHistory: []
  };

  const recentMembers = (membersData?.data || []).slice(0, 5);

  const getExpiringMembers = () => {
    const normalizedRole = (role || "").toUpperCase();
    if (normalizedRole !== "GYM_ADMIN" || !membersData?.data) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return membersData.data.filter((member: any) => {
      if (!member.memberships || member.memberships.length === 0) return false;
      
      // Sort memberships to get the one with the latest endDate
      const sorted = [...member.memberships].sort(
        (a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
      const latestMembership = sorted[0];
      if (!latestMembership || !latestMembership.endDate) return false;
      
      const endDate = new Date(latestMembership.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Calculate days difference
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Show if it expires in the next 5 days, or has expired within the last 5 days
      return diffDays >= -5 && diffDays <= 5;
    });
  };

  const expiringMembers = getExpiringMembers();

  // Custom SVG Chart Layout Coordinates Calculations
  const history = stats.chartHistory || [];
  const maxRevenue = Math.max(...history.map((h: any) => h.revenue), 1000);
  const maxMembers = Math.max(...history.map((h: any) => h.memberCount), 5);

  const width = 500;
  const height = 220;
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // 1. Revenue Area Chart coords
  let areaPoints = "";
  let fillPoints = "";
  const revenueCoords = history.map((h: any, idx: number) => {
    const x = paddingX + (idx / Math.max(history.length - 1, 1)) * chartWidth;
    const y = paddingY + chartHeight - (h.revenue / maxRevenue) * chartHeight;
    return { x, y, label: h.label, value: h.revenue };
  });

  if (revenueCoords.length > 0) {
    areaPoints = revenueCoords.map((c: any) => `${c.x},${c.y}`).join(" ");
    fillPoints = `${revenueCoords[0].x},${paddingY + chartHeight} ` + areaPoints + ` ${revenueCoords[revenueCoords.length - 1].x},${paddingY + chartHeight}`;
  }

  // 2. Member Bar Chart coords
  const barGap = 6;
  const barGroupWidth = chartWidth / Math.max(history.length, 1);
  const barWidth = Math.max(6, Math.min(24, barGroupWidth - barGap * 2));
  
  const memberCoords = history.map((h: any, idx: number) => {
    const x = paddingX + idx * barGroupWidth + (barGroupWidth - barWidth) / 2;
    const barHeight = (h.memberCount / maxMembers) * chartHeight;
    const y = paddingY + chartHeight - barHeight;
    return { x, y, w: barWidth, h: barHeight, label: h.label, value: h.memberCount };
  });

  // Calculate Period Summaries
  const periodTotalRevenue = history.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
  const periodAvgRevenue = history.length > 0 ? periodTotalRevenue / history.length : 0;
  const periodTotalMembers = history.reduce((acc: number, curr: any) => acc + curr.memberCount, 0);

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
          value={statsLoading ? "..." : `₹${Number(stats.monthlyRevenue).toLocaleString()}`}
          subtitle={role === "SUPER_ADMIN" ? "Global payments" : "Payments this month"}
          trend={{ value: "+12.5% increase", isPositive: true }}
        />
      </div>

      {/* Expiring Memberships Alert Box */}
      {(role || "").toUpperCase() === "GYM_ADMIN" && expiringMembers.length > 0 && (
        <div className="bg-[#090D16] border border-amber-500/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Expiring Memberships</h2>
              <p className="text-xs text-slate-400">The following members have memberships expiring within the next 5 days.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringMembers.map((member: any) => {
              const activeMembership = member.memberships?.find((m: any) => m.status === "ACTIVE") || member.memberships?.[0];
              const daysLeft = Math.ceil((new Date(activeMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={member.id} className="bg-[#050811] border border-slate-800/80 rounded-lg p-4 flex items-center justify-between hover:border-amber-500/30 transition">
                  <div className="space-y-1">
                    <div className="font-semibold text-white text-sm">
                      {member.user?.profile?.firstName} {member.user?.profile?.lastName || ""}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">ID: {member.memberId || "N/A"}</div>
                    <div className="text-[11px] text-slate-400">
                      Plan: {activeMembership?.membershipPlan?.name || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${daysLeft <= 1 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {daysLeft <= 0 ? 'Expires Today' : `${daysLeft} days left`}
                    </span>
                    <button 
                      onClick={() => router.push("/dashboard/members")}
                      className="text-[11px] text-[#22C55E] hover:underline font-bold block mt-2 cursor-pointer text-right w-full"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Business Performance Analytics Charts */}
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Business Performance Analytics</h2>
            <p className="text-xs text-slate-400 mt-1">Visualize revenue metrics and athlete registrations over date range.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#050811] border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Range:</span>
            <select
              value={granularity}
              onChange={(e) => {
                setGranularity(e.target.value as any);
                setHoveredRev(null);
                setHoveredMem(null);
              }}
              className="bg-transparent border-0 text-white text-xs focus:outline-none cursor-pointer font-bold pr-2"
            >
              <option value="daily">Last 30 Days (Daily)</option>
              <option value="monthly">Last 6 Months (Monthly)</option>
              <option value="yearly">Last 3 Years (Yearly)</option>
            </select>
          </div>
        </div>

        {statsLoading ? (
          <div className="py-20 text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <span className="h-6 w-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-xs text-slate-400 uppercase tracking-widest animate-pulse">Analyzing financial models...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Revenue Dynamics (Sleek Area Chart) */}
            <div className="bg-[#050811]/60 border border-slate-850 p-5 rounded-xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Trend (₹)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Performance tracking of successfully paid invoices</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Period Revenue</span>
                  <span className="text-base font-extrabold text-[#22C55E]">₹{Number(periodTotalRevenue).toLocaleString()}</span>
                </div>
              </div>

              <div className="relative">
                {/* SVG Area Chart */}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingY + chartHeight * ratio;
                    const val = maxRevenue - maxRevenue * ratio;
                    return (
                      <g key={index}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={paddingX + chartWidth}
                          y2={y}
                          stroke="#1E293B"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="end"
                        >
                          ₹{Math.round(val / 100) * 100}
                        </text>
                      </g>
                    );
                  })}

                  {/* Filled Gradient Area */}
                  {fillPoints && (
                    <polygon points={fillPoints} fill="url(#areaGrad)" />
                  )}

                  {/* Stroke Line */}
                  {areaPoints && (
                    <polyline
                      points={areaPoints}
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* X Axis Labels */}
                  {revenueCoords.map((c: any, idx: number) => {
                    // Show sparse labels if daily (e.g. every 5th label)
                    const showLabel = granularity !== 'daily' || idx % 6 === 0 || idx === revenueCoords.length - 1;
                    if (!showLabel) return null;
                    return (
                      <text
                        key={idx}
                        x={c.x}
                        y={paddingY + chartHeight + 15}
                        fill="#64748B"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {c.label}
                      </text>
                    );
                  })}

                  {/* Interaction Hover States */}
                  {hoveredRev !== null && revenueCoords[hoveredRev] && (
                    <g>
                      {/* Vertical Indicator Line */}
                      <line
                        x1={revenueCoords[hoveredRev].x}
                        y1={paddingY}
                        x2={revenueCoords[hoveredRev].x}
                        y2={paddingY + chartHeight}
                        stroke="#475569"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      {/* Glowing Plot Point */}
                      <circle
                        cx={revenueCoords[hoveredRev].x}
                        cy={revenueCoords[hoveredRev].y}
                        r="6"
                        fill="#22C55E"
                        stroke="#090D16"
                        strokeWidth="2"
                      />
                    </g>
                  )}

                  {/* Wide Transparent Slices for Hover Tracking */}
                  {revenueCoords.map((c: any, idx: number) => {
                    const sliceW = chartWidth / Math.max(history.length - 1, 1);
                    const sliceX = c.x - sliceW / 2;
                    return (
                      <rect
                        key={idx}
                        x={sliceX}
                        y={paddingY}
                        width={sliceW}
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRev(idx)}
                        onMouseLeave={() => setHoveredRev(null)}
                      />
                    );
                  })}
                </svg>

                {/* Floating Tooltip Box */}
                {hoveredRev !== null && revenueCoords[hoveredRev] && (
                  <div 
                    className="absolute bg-[#0F172A] border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-xl text-left pointer-events-none transition-all duration-75"
                    style={{
                      left: `${Math.min(80, Math.max(5, (revenueCoords[hoveredRev].x / width) * 100 - 10))}%`,
                      top: `${Math.max(5, (revenueCoords[hoveredRev].y / height) * 100 - 25)}%`
                    }}
                  >
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{revenueCoords[hoveredRev].label}</p>
                    <p className="text-xs font-black text-white mt-0.5">₹{Number(revenueCoords[hoveredRev].value).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Member Acquisitions (Sleek Bar Chart) */}
            <div className="bg-[#050811]/60 border border-slate-850 p-5 rounded-xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Member Acquisition</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">New athlete registration trends across active periods</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total New Members</span>
                  <span className="text-base font-extrabold text-[#38BDF8]">{periodTotalMembers} Athletes</span>
                </div>
              </div>

              <div className="relative">
                {/* SVG Bar Chart */}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingY + chartHeight * ratio;
                    const val = maxMembers - maxMembers * ratio;
                    return (
                      <g key={index}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={paddingX + chartWidth}
                          y2={y}
                          stroke="#1E293B"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="end"
                        >
                          {Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Rendered Columns */}
                  {memberCoords.map((c: any, idx: number) => {
                    const isHovered = hoveredMem === idx;
                    return (
                      <g key={idx}>
                        {/* Interactive Bar */}
                        <rect
                          x={c.x}
                          y={c.y}
                          width={c.w}
                          height={c.h}
                          rx={Math.min(2, c.w / 2)}
                          ry={Math.min(2, c.w / 2)}
                          fill={isHovered ? "#38BDF8" : "#0284C7"}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredMem(idx)}
                          onMouseLeave={() => setHoveredMem(null)}
                        />
                      </g>
                    );
                  })}

                  {/* X Axis Labels */}
                  {memberCoords.map((c: any, idx: number) => {
                    const labelX = c.x + c.w / 2;
                    const showLabel = granularity !== 'daily' || idx % 6 === 0 || idx === memberCoords.length - 1;
                    if (!showLabel) return null;
                    return (
                      <text
                        key={idx}
                        x={labelX}
                        y={paddingY + chartHeight + 15}
                        fill="#64748B"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {c.label}
                      </text>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Box */}
                {hoveredMem !== null && memberCoords[hoveredMem] && (
                  <div 
                    className="absolute bg-[#0F172A] border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-xl text-left pointer-events-none transition-all duration-75"
                    style={{
                      left: `${Math.min(80, Math.max(5, (memberCoords[hoveredMem].x / width) * 100 - 5))}%`,
                      top: `${Math.max(5, (memberCoords[hoveredMem].y / height) * 100 - 25)}%`
                    }}
                  >
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{memberCoords[hoveredMem].label}</p>
                    <p className="text-xs font-black text-white mt-0.5">{memberCoords[hoveredMem].value} Signups</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
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