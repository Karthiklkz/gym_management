"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import { useRouter } from "next/navigation";

export default function TrainerMembersPage() {
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Fetch Trainer Branch Members
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ["trainerMembers", search, status],
    queryFn: () => {
      let url = "/api/trainer/members?limit=100";
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      return apiClient<any>(url);
    },
  });

  const members = membersResponse?.data?.members || [];

  const columns = [
    {
      header: "Member Name",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-850 flex items-center justify-center font-semibold text-[#22C55E]">
            {row.user?.profile?.firstName?.charAt(0) || "M"}
          </div>
          <div>
            <span className="font-semibold text-white">
              {row.user?.profile?.firstName} {row.user?.profile?.lastName || ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Email Address",
      render: (row: any) => <span>{row.user?.email}</span>,
    },
    {
      header: "Phone Number",
      render: (row: any) => <span>{row.user?.phone || "N/A"}</span>,
    },
    {
      header: "Active Membership",
      render: (row: any) => {
        const activePlan = row.memberships?.[0];
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {activePlan?.membershipPlan?.name || "No Plan"}
          </span>
        );
      },
    },
    {
      header: "Status",
      render: (row: any) => {
        const activePlan = row.memberships?.[0];
        const stat = activePlan?.status || "EXPIRED";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              stat === "ACTIVE"
                ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                : stat === "CANCELLED"
                ? "bg-slate-800 text-slate-400 border border-slate-700/60"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {stat}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row: any) => (
        <button
          onClick={() => router.push(`/trainer/members/${row.id}`)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md transition cursor-pointer"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Branch Members</h1>
        <p className="text-sm text-slate-400">
          Search, filter, and review profiles of members in your gym branch.
        </p>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-400 py-6 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading branch members catalog...
          </div>
        ) : members.length > 0 ? (
          <Table
            columns={columns}
            data={members}
            searchPlaceholder="Refine list results..."
            searchKey={(row: any) =>
              `${row.user?.profile?.firstName} ${row.user?.profile?.lastName} ${row.user?.email}`
            }
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-450 font-medium text-sm">No members found</p>
            <p className="text-slate-550 text-xs mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
