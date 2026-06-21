"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

export default function GymsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [selectedGym, setSelectedGym] = useState<any>(null);

  // Auth Guard: Only SUPER_ADMIN allowed
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.role !== "SUPER_ADMIN") {
          router.push("/dashboard");
        }
      } catch (e) {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // Form states for creating gym + admin user
  const [createForm, setCreateForm] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    subscriptionPlanId: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
  });

  // Form states for editing gym
  const [editForm, setEditForm] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    subscriptionPlanId: "",
    status: "ACTIVE",
  });

  // Fetch registered Gyms
  const { data: gymsResponse, isLoading: isGymsLoading } = useQuery({
    queryKey: ["superAdminGyms"],
    queryFn: () => apiClient<any>("/api/super-admin/gyms"),
  });

  // Fetch available subscription plans
  const { data: plansResponse } = useQuery({
    queryKey: ["superAdminPlans"],
    queryFn: () => apiClient<any>("/api/super-admin/subscription-plans"),
  });

  const gyms = gymsResponse?.data || [];
  const plans = plansResponse?.data || [];

  // Create Gym Mutation
  const createGymMutation = useMutation({
    mutationFn: (newGym: typeof createForm) =>
      apiClient("/api/super-admin/gyms", {
        method: "POST",
        body: JSON.stringify(newGym),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminGyms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        ownerName: "",
        email: "",
        phone: "",
        subscriptionPlanId: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPassword: "",
        adminPhone: "",
      });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create gym and admin");
    },
  });

  // Update Gym Mutation
  const updateGymMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      apiClient(`/api/super-admin/gyms/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminGyms"] });
      setIsEditOpen(false);
      setSelectedGym(null);
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update gym");
    },
  });

  // Delete Gym Mutation
  const deleteGymMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/super-admin/gyms/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminGyms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete gym");
    },
  });

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setCreateForm({
      ...createForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    createGymMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGym) return;
    setFormError("");
    updateGymMutation.mutate({ id: selectedGym.id, data: editForm });
  };

  const openEditModal = (gym: any) => {
    setSelectedGym(gym);
    setEditForm({
      name: gym.name,
      ownerName: gym.ownerName,
      email: gym.email,
      phone: gym.phone,
      subscriptionPlanId: gym.subscriptionPlanId,
      status: gym.status,
    });
    setFormError("");
    setIsEditOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will permanently delete all branches, members, trainers and data linked to this gym!`)) {
      deleteGymMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: "Gym Name",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center font-bold text-[#22C55E] border border-[#22C55E]/20 shadow-sm">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{row.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Owner: <span className="text-slate-400 font-medium">{row.ownerName}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Info",
      render: (row: any) => (
        <div className="text-xs">
          <p className="text-slate-300 font-medium">{row.email}</p>
          <p className="text-slate-500 mt-0.5">{row.phone || "N/A"}</p>
        </div>
      ),
    },
    {
      header: "Current Subscription",
      render: (row: any) => (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            {row.subscriptionPlan?.name || "No Plan"}
          </span>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium tracking-wide">
            {row.subscriptionPlan?.billingCycle || "Monthly"}
          </p>
        </div>
      ),
    },
    {
      header: "Gym Metrics",
      render: (row: any) => (
        <div className="text-slate-400 text-xs flex gap-4">
          <div>
            <span className="text-white font-semibold">{row._count?.branches || 0}</span> branches
          </div>
          <div>
            <span className="text-white font-semibold">{row._count?.users || 0}</span> users
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            row.status === "ACTIVE"
              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md transition cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-md transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gym Networks</h1>
          <p className="text-sm text-slate-400">
            Globally register, modify, monitor, and suspend active gym subscriptions.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold px-4 py-2 rounded-lg text-sm transition cursor-pointer shadow-md shadow-emerald-500/10"
        >
          + Register Gym
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-xl">
        {isGymsLoading ? (
          <div className="text-slate-400 py-6 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading gyms network catalog...
          </div>
        ) : gyms.length > 0 ? (
          <Table
            columns={columns}
            data={gyms}
            searchPlaceholder="Search gyms by network name, owner, or support email..."
            searchKey={(row: any) => `${row.name} ${row.ownerName} ${row.email}`}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400 font-medium text-sm">No registered gyms found</p>
            <p className="text-slate-500 text-xs mt-1">Get started by registering your first gym network.</p>
          </div>
        )}
      </div>

      {/* CREATE GYM MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Gym Network & Create Primary Admin"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Section 1: Gym Details */}
          <div className="space-y-3.5">
            <h4 className="text-[#22C55E] text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 pb-1">
              Gym Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Gym Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={createForm.name}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                  placeholder="e.g. Iron Gym"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={createForm.ownerName}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Gym Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={createForm.email}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                  placeholder="e.g. contact@irongym.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Gym Phone *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={createForm.phone}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                  placeholder="e.g. +1 555 999 0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Assign Subscription Plan *
              </label>
              <select
                name="subscriptionPlanId"
                required
                value={createForm.subscriptionPlanId}
                onChange={handleCreateChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select a subscription plan</option>
                {plans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price}/mo - Max Branches: {plan.maxBranches}, Trainers: {plan.maxTrainers}, Members: {plan.maxMembers})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Gym Primary Admin Credentials */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-[#22C55E] text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 pb-1">
              Primary Gym Admin Credentials
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  First Name *
                </label>
                <input
                  type="text"
                  name="adminFirstName"
                  required
                  value={createForm.adminFirstName}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  name="adminLastName"
                  value={createForm.adminLastName}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  value={createForm.adminEmail}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Admin Phone
                </label>
                <input
                  type="text"
                  name="adminPhone"
                  value={createForm.adminPhone}
                  onChange={handleCreateChange}
                  className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Admin Password *
              </label>
              <input
                type="password"
                name="adminPassword"
                required
                value={createForm.adminPassword}
                onChange={handleCreateChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGymMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {createGymMutation.isPending ? "Registering..." : "Register Gym"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT GYM MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modify Gym Network Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Gym Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={editForm.name}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Owner Name *
              </label>
              <input
                type="text"
                name="ownerName"
                required
                value={editForm.ownerName}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Gym Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={editForm.email}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Gym Phone *
              </label>
              <input
                type="text"
                name="phone"
                required
                value={editForm.phone}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Subscription Plan *
              </label>
              <select
                name="subscriptionPlanId"
                required
                value={editForm.subscriptionPlanId}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                {plans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price}/mo)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Network Status *
              </label>
              <select
                name="status"
                required
                value={editForm.status}
                onChange={handleEditChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateGymMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {updateGymMutation.isPending ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
