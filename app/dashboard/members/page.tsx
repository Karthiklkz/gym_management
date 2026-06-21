"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import Modal from "@/components/Modal";

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [role, setRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"directory" | "accounts" | "billing">("directory");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setRole(userObj.role || "");
      } catch (e) {}
    }
  }, []);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    medicalNotes: "",
    membershipPlanId: "",
    gymId: "",
    emergencyContact: "",
    classType: "",
  });

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    emergencyContact: "",
    classType: "",
    medicalNotes: "",
  });

  // Fetch members (uses dynamic get members endpoint)
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient<any>("/api/members"),
  });

  // Fetch plans for dropdown selection (dynamically loads per gym for Super Admin)
  const { data: plansResponse } = useQuery({
    queryKey: ["membershipPlans", form.gymId],
    queryFn: () => apiClient<any>(form.gymId ? `/api/membership-plans?gymId=${form.gymId}` : "/api/membership-plans"),
    enabled: role === "GYM_ADMIN" || (role === "SUPER_ADMIN" && !!form.gymId),
  });

  // Fetch registered gyms if current user is Super Admin
  const { data: gymsResponse } = useQuery({
    queryKey: ["superAdminGymsList"],
    queryFn: () => apiClient<any>("/api/super-admin/gyms"),
    enabled: role === "SUPER_ADMIN",
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
        gymId: "",
        emergencyContact: "",
        classType: "",
      });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create member");
    },
  });

  const patchMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: any }) =>
      apiClient(`/api/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const putMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: any }) =>
      apiClient(`/api/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setIsEditModalOpen(false);
      setEditFormError("");
    },
    onError: (err: any) => {
      setEditFormError(err.message || "Failed to update member");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "gymId") {
      setForm({
        ...form,
        gymId: e.target.value,
        membershipPlanId: "", // reset plan when gym changes
      });
    } else {
      setForm({
        ...form,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    createMemberMutation.mutate(form);
  };

  const handleEditClick = (member: any) => {
    setSelectedMemberId(member.id);
    setEditForm({
      firstName: member.user?.profile?.firstName || "",
      lastName: member.user?.profile?.lastName || "",
      phone: member.user?.phone || "",
      emergencyContact: member.user?.profile?.emergencyContact || "",
      classType: member.classType || "",
      medicalNotes: member.medicalNotes || "",
    });
    setIsEditModalOpen(true);
    setEditFormError("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");
    putMemberMutation.mutate({ memberId: selectedMemberId, data: editForm });
  };

  const members = membersResponse?.data || [];
  const plans = plansResponse?.data || [];
  const gyms = gymsResponse?.data || [];

  // 1. Directory Tab Columns
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
            {row.memberId && (
              <span className="block text-[10px] font-mono text-[#22C55E] mt-0.5">
                ID: {row.memberId}
              </span>
            )}
          </div>
        </div>
      ),
    },
  ];

  if (role === "SUPER_ADMIN") {
    columns.push({
      header: "Gym Network",
      render: (row: any) => (
        <span className="text-slate-300 font-semibold">
          {row.user?.gym?.name || "N/A"}
        </span>
      ),
    });
  }

  columns.push(
    {
      header: "Email",
      render: (row: any) => <span>{row.user?.email}</span>,
    },
    {
      header: "Phone",
      render: (row: any) => <span>{row.user?.phone || "N/A"}</span>,
    },
    {
      header: "Class Type",
      render: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {row.classType || "Gym"}
        </span>
      ),
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
    {
      header: "Actions",
      render: (row: any) => (
        <button
          onClick={() => handleEditClick(row)}
          className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border-[#22C55E]/20 transition cursor-pointer"
        >
          Edit
        </button>
      ),
    }
  );

  // 2. Account Status Tab Columns
  const accountColumns = [
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
            {row.memberId && (
              <span className="block text-[10px] font-mono text-[#22C55E] mt-0.5">
                ID: {row.memberId}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      render: (row: any) => <span>{row.user?.email}</span>,
    },
    {
      header: "Account Status",
      render: (row: any) => {
        const isAct = row.user?.status === "ACTIVE";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isAct ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
          }`}>
            {row.user?.status || "ACTIVE"}
          </span>
        );
      }
    },
    {
      header: "Toggle Status",
      render: (row: any) => {
        const isAct = row.user?.status === "ACTIVE";
        return (
          <button
            onClick={() => patchMemberMutation.mutate({ memberId: row.id, data: { status: isAct ? "INACTIVE" : "ACTIVE" } })}
            disabled={patchMemberMutation.isPending}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
              isAct 
                ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20" 
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
            }`}
          >
            {isAct ? "Set Inactive" : "Set Active"}
          </button>
        );
      }
    }
  ];

  // 3. Billing Audit Tab Columns
  const billingColumns = [
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
            {row.memberId && (
              <span className="block text-[10px] font-mono text-[#22C55E] mt-0.5">
                ID: {row.memberId}
              </span>
            )}
          </div>
        </div>
      ),
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
      header: "Payment Status",
      render: (row: any) => {
        const isPaid = row.payments?.[0]?.paymentStatus === "SUCCESS";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isPaid ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse"
          }`}>
            {isPaid ? "Paid ✓" : "Unpaid ⚠️"}
          </span>
        );
      }
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
    {
      header: "Billing Action",
      render: (row: any) => {
        const isPaid = row.payments?.[0]?.paymentStatus === "SUCCESS";
        return (
          <button
            onClick={() => patchMemberMutation.mutate({ memberId: row.id, data: { paymentStatus: isPaid ? "PENDING" : "SUCCESS" } })}
            disabled={patchMemberMutation.isPending}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
              isPaid 
                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
            }`}
          >
            {isPaid ? "Mark Unpaid" : "Mark Paid"}
          </button>
        );
      }
    }
  ];

  // Sort: Unpaid members on top for Billing Audits
  let displayedData = members;
  if (activeTab === "billing") {
    displayedData = [...members].sort((a: any, b: any) => {
      const aPaid = a.payments?.[0]?.paymentStatus === "SUCCESS";
      const bPaid = b.payments?.[0]?.paymentStatus === "SUCCESS";
      if (!aPaid && bPaid) return -1;
      if (aPaid && !bPaid) return 1;
      return 0;
    });
  }

  const activeColumns = 
    activeTab === "accounts" ? accountColumns : 
    activeTab === "billing" ? billingColumns : 
    columns;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Members</h1>
          <p className="text-sm text-slate-400">
            {role === "SUPER_ADMIN"
              ? "View and register new gym members globally across all networks."
              : "View, search, and register new members in your gym."}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer"
        >
          + Add Member
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer border ${
            activeTab === "directory"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          📂 Member Directory
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer border ${
            activeTab === "accounts"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          ⚙️ Account Status Toggles
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer border ${
            activeTab === "billing"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          💳 Payment & Paid Auditing
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-4 text-sm">Loading members list...</div>
        ) : (
          <Table
            columns={activeColumns}
            data={displayedData}
            searchPlaceholder="Search members by name or email..."
            searchKey={(row: any) =>
              `${row.user?.profile?.firstName} ${row.user?.profile?.lastName} ${row.user?.email} ${row.user?.gym?.name || ""} ${row.memberId || ""}`
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

          {/* Super Admin Gym selection */}
          {role === "SUPER_ADMIN" && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Gym Network *
              </label>
              <select
                name="gymId"
                required
                value={form.gymId}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select a gym network</option>
                {gyms.map((gym: any) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name}
                  </option>
                ))}
              </select>
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
              disabled={role === "SUPER_ADMIN" && !form.gymId}
              value={form.membershipPlanId}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {role === "SUPER_ADMIN" && !form.gymId
                  ? "Select a gym network first"
                  : "Select a membership plan"}
              </option>
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (₹{plan.price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                placeholder="e.g. +91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Class Type
              </label>
              <select
                name="classType"
                value={form.classType}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select class type</option>
                <option value="Gym">Gym</option>
                <option value="Yoga">Yoga</option>
                <option value="Zumba">Zumba</option>
                <option value="CrossFit">CrossFit</option>
                <option value="MMA/Boxing">MMA/Boxing</option>
                <option value="Cardio">Cardio</option>
              </select>
            </div>
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

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Gym Member Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editFormError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-medium">
              {editFormError}
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
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
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
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Class Type
            </label>
            <select
              name="classType"
              value={editForm.classType}
              onChange={(e) => setEditForm({ ...editForm, classType: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="">Select class type</option>
              <option value="Gym">Gym</option>
              <option value="Yoga">Yoga</option>
              <option value="Zumba">Zumba</option>
              <option value="CrossFit">CrossFit</option>
              <option value="MMA/Boxing">MMA/Boxing</option>
              <option value="Cardio">Cardio</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Medical Notes
            </label>
            <textarea
              name="medicalNotes"
              rows={3}
              value={editForm.medicalNotes}
              onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={putMemberMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {putMemberMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}