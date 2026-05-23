"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import Modal from "@/components/Modal";

export default function TrainersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [role, setRole] = useState<string>("");

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
    specialization: "",
    experienceYears: "",
    certification: "",
    gymId: "",
  });

  // Fetch trainers list
  const { data: trainersResponse, isLoading } = useQuery({
    queryKey: ["trainers"],
    queryFn: () => apiClient<any>("/api/trainers"),
  });

  // Fetch registered gyms if current user is Super Admin
  const { data: gymsResponse } = useQuery({
    queryKey: ["superAdminGymsList"],
    queryFn: () => apiClient<any>("/api/super-admin/gyms"),
    enabled: role === "SUPER_ADMIN",
  });

  // Create trainer mutation
  const createTrainerMutation = useMutation({
    mutationFn: (newTrainer: typeof form) =>
      apiClient("/api/trainers", {
        method: "POST",
        body: JSON.stringify(newTrainer),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsModalOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialization: "",
        experienceYears: "",
        certification: "",
        gymId: "",
      });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create trainer");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    createTrainerMutation.mutate(form);
  };

  const trainers = trainersResponse?.data || [];
  const gyms = gymsResponse?.data || [];

  // Table columns definition
  const columns = [
    {
      header: "Trainer Name",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-850 flex items-center justify-center font-semibold text-[#22C55E]">
            {row.user?.profile?.firstName?.charAt(0) || "T"}
          </div>
          <div>
            <span className="font-semibold text-white">
              {row.user?.profile?.firstName} {row.user?.profile?.lastName || ""}
            </span>
          </div>
        </div>
      ),
    },
  ];

  // Insert Gym column for Super Admin
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

  // Add the remaining columns
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
      header: "Specialization",
      render: (row: any) => (
        <span className="text-slate-300 font-medium">
          {row.specialization || "General Fitness"}
        </span>
      ),
    },
    {
      header: "Experience",
      render: (row: any) => (
        <span className="text-slate-300">
          {row.experienceYears ? `${row.experienceYears} Years` : "N/A"}
        </span>
      ),
    },
    {
      header: "Certifications",
      render: (row: any) => (
        <span className="text-slate-400 text-xs italic">
          {row.certification || "None listed"}
        </span>
      ),
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trainers</h1>
          <p className="text-sm text-slate-400">
            {role === "SUPER_ADMIN"
              ? "Manage gym coaches globally across all network gyms."
              : "Manage your certified gym coaches and specializations."}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer"
        >
          + Add Trainer
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-4 text-sm">Loading trainers list...</div>
        ) : (
          <Table
            columns={columns}
            data={trainers}
            searchPlaceholder="Search trainers by name, email, or specialization..."
            searchKey={(row: any) =>
              `${row.user?.profile?.firstName} ${row.user?.profile?.lastName} ${row.user?.email} ${row.specialization} ${row.user?.gym?.name || ""}`
            }
          />
        )}
      </div>

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Certified Trainer"
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

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={form.specialization}
                onChange={handleInputChange}
                placeholder="e.g. Strength training"
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Exp. Years
              </label>
              <input
                type="number"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Certifications
            </label>
            <textarea
              name="certification"
              rows={2}
              value={form.certification}
              onChange={handleInputChange}
              placeholder="e.g. NASM-CPT, CSCS"
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
              disabled={createTrainerMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {createTrainerMutation.isPending ? "Creating..." : "Save Trainer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}