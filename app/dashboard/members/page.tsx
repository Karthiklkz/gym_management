"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import Modal from "@/components/Modal";

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    medicalNotes: "",
    membershipPlanId: "",
  });

  // Fetch members
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient<any>("/api/members"),
  });

  // Fetch plans for dropdown selection
  const { data: plansResponse } = useQuery({
    queryKey: ["membershipPlans"],
    queryFn: () => apiClient<any>("/api/membership-plans"),
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: (newMember: typeof form) =>
      apiClient("/api/members", {
        method: "POST",
        body: JSON.stringify(newMember),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsModalOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        medicalNotes: "",
        membershipPlanId: "",
      });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create member");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    createMemberMutation.mutate(form);
  };

  const members = membersResponse?.data || [];
  const plans = plansResponse?.data || [];

  // Table Columns definition
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
      header: "Email",
      render: (row: any) => <span>{row.user?.email}</span>,
    },
    {
      header: "Phone",
      render: (row: any) => <span>{row.user?.phone || "N/A"}</span>,
    },
    {
      header: "Membership Plan",
      render: (row: any) => {
        const activeMembership = row.memberships?.[0];
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {activeMembership?.membershipPlan?.name || "Inactive"}
          </span>
        );
      },
    },
    {
      header: "Expiration Date",
      render: (row: any) => {
        const activeMembership = row.memberships?.[0];
        if (!activeMembership) return <span className="text-slate-500">N/A</span>;
        return (
          <span className="text-slate-300">
            {new Date(activeMembership.endDate).toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Members</h1>
          <p className="text-sm text-slate-400">
            View, search, and register new members in your gym.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer"
        >
          + Add Member
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-4 text-sm">Loading members list...</div>
        ) : (
          <Table
            columns={columns}
            data={members}
            searchPlaceholder="Search members by name or email..."
            searchKey={(row: any) =>
              `${row.user?.profile?.firstName} ${row.user?.profile?.lastName} ${row.user?.email}`
            }
          />
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Gym Member"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Assign Membership Plan *
            </label>
            <select
              name="membershipPlanId"
              required
              value={form.membershipPlanId}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="">Select a membership plan</option>
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (${plan.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Medical Notes
            </label>
            <textarea
              name="medicalNotes"
              rows={2}
              value={form.medicalNotes}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMemberMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {createMemberMutation.isPending ? "Creating..." : "Save Member"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}