"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function MemberMembershipPage() {
  // Fetch Member Membership History
  const { data: membershipsResponse, isLoading } = useQuery({
    queryKey: ["memberMembershipsList"],
    queryFn: () => apiClient<any>("/api/member/membership"),
  });

  const list = membershipsResponse?.data || [];
  const activePlan = list.find((m: any) => m.status === 'ACTIVE');
  const pastPlans = list.filter((m: any) => m.id !== activePlan?.id);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Membership Portal</h1>
        <p className="text-sm text-slate-400">View your active subscription benefits, renewal timelines, and transaction history log.</p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm py-10 flex items-center justify-center gap-2">
          <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading plan details...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Active Plan Card - Takes 2 cols */}
          <div className="md:col-span-2 space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#090D16] p-6 shadow-md">
              {/* Background glow decorator */}
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#22C55E]/10 blur-3xl" />
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-widest bg-[#22C55E]/10 px-2.5 py-1 rounded-md border border-[#22C55E]/20">
                    Active Subscription
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-4">
                    {activePlan?.membershipPlan?.name || "No Active Plan"}
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md">
                    {activePlan?.membershipPlan?.description || "Access all gym areas, standard equipment, and classes at your branch branch."}
                  </p>
                </div>
                
                {activePlan && (
                  <span className="bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {activePlan.status}
                  </span>
                )}
              </div>

              {activePlan ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-800/80 pt-6 mt-6 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wide">Start Date</span>
                    <span className="block text-white font-bold mt-1">
                      {new Date(activePlan.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wide">Renewal / End Date</span>
                    <span className="block text-white font-bold mt-1">
                      {new Date(activePlan.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wide">Duration</span>
                    <span className="block text-[#22C55E] font-bold mt-1">
                      {activePlan.membershipPlan?.durationDays} Days
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-6 mt-6 border-t border-slate-850 text-slate-450 text-xs">
                  Please consult the front desk or a gym admin at your branch to select and purchase a membership plan.
                </div>
              )}
            </div>

            {/* Plan Access/Features summary */}
            {activePlan && (
              <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
                <h3 className="text-base font-semibold text-white mb-4">Membership Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-350">
                  <li className="flex items-center gap-2">
                    <span className="text-[#22C55E] font-bold">✓</span> Full access to branch gym facilities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#22C55E] font-bold">✓</span> Advanced cardio & strength equipment areas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#22C55E] font-bold">✓</span> Standard trainer assistance check
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#22C55E] font-bold">✓</span> Dynamic locker room & shower access
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Membership History Column - Takes 1 col */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md h-fit">
            <h3 className="text-base font-bold text-white mb-4">Subscription History</h3>
            
            {pastPlans.length > 0 ? (
              <div className="relative border-l border-slate-800 pl-4 space-y-6 text-xs">
                {pastPlans.map((m: any) => (
                  <div key={m.id} className="relative group">
                    {/* Circle bullet on line */}
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-800 border border-slate-700 group-hover:bg-slate-450 transition" />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-200">{m.membershipPlan?.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          m.status === 'EXPIRED' 
                            ? "bg-slate-800 text-slate-400" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-550 text-center py-4">No previous subscription plans found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
