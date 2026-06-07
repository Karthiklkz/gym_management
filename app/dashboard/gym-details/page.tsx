"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function GymDetailsPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    location: "",
    address: "",
    pincode: "",
    gst: "",
  });

  // Fetch Gym Details
  const { data: gymResponse, isLoading } = useQuery({
    queryKey: ["gymDetails"],
    queryFn: async () => {
      const response = await apiClient<any>("/api/gym-admin/gym");
      if (response?.data) {
        setForm({
          name: response.data.name || "",
          ownerName: response.data.ownerName || "",
          phone: response.data.phone || "",
          location: response.data.location || "",
          address: response.data.address || "",
          pincode: response.data.pincode || "",
          gst: response.data.gst || "",
        });
      }
      return response;
    },
  });

  const gym = gymResponse?.data || null;

  // Edit Gym Mutation
  const updateGymMutation = useMutation({
    mutationFn: (updatedFields: typeof form) =>
      apiClient("/api/gym-admin/gym", {
        method: "PUT",
        body: JSON.stringify(updatedFields),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymDetails"] });
      setIsEditing(false);
      setSuccessMessage("Gym details updated successfully!");
      setFormError("");
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update gym details");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    updateGymMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="py-10 text-slate-400 text-sm flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Retrieving gym details...
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
        <p className="text-slate-400 font-semibold text-sm">Gym not found</p>
        <p className="text-slate-500 text-xs mt-1">Please ensure your user profile is associated with a gym record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Settings</h1>
        <p className="text-sm text-slate-400">Manage your gym location address, pincode, contact details, and GST configurations.</p>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>✓</span> {successMessage}
        </div>
      )}

      {formError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium">
          {formError}
        </div>
      )}

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">{gym.name} Details</h3>
            <p className="text-xs text-slate-550">Subscription Plan: <span className="text-emerald-400 font-bold uppercase">{gym.subscriptionPlan?.name || "Premium Plan"}</span></p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Modify Details
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Gym Name
              </label>
              <input
                type="text"
                name="name"
                disabled={!isEditing}
                required
                value={form.name}
                onChange={handleInputChange}
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Owner Full Name
              </label>
              <input
                type="text"
                name="ownerName"
                disabled={!isEditing}
                required
                value={form.ownerName}
                onChange={handleInputChange}
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                disabled={!isEditing}
                required
                value={form.phone}
                onChange={handleInputChange}
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                GST Number
              </label>
              <input
                type="text"
                name="gst"
                disabled={!isEditing}
                value={form.gst}
                onChange={handleInputChange}
                placeholder="e.g. 22AAAAA0000A1Z5"
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Gym Location (City/Branch)
              </label>
              <input
                type="text"
                name="location"
                disabled={!isEditing}
                value={form.location}
                onChange={handleInputChange}
                placeholder="e.g. Indiranagar, Bangalore"
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Postal Pincode
              </label>
              <input
                type="text"
                name="pincode"
                disabled={!isEditing}
                value={form.pincode}
                onChange={handleInputChange}
                placeholder="e.g. 560038"
                className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Full Physical Address
            </label>
            <textarea
              name="address"
              disabled={!isEditing}
              rows={3}
              value={form.address}
              onChange={handleInputChange}
              placeholder="e.g. #452, 12th Main Rd, Indiranagar, Bengaluru, Karnataka"
              className="w-full bg-[#050811] border border-slate-800 text-white px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed transition"
            />
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormError("");
                  // Reset form fields to gym values
                  if (gym) {
                    setForm({
                      name: gym.name || "",
                      ownerName: gym.ownerName || "",
                      phone: gym.phone || "",
                      location: gym.location || "",
                      address: gym.address || "",
                      pincode: gym.pincode || "",
                      gst: gym.gst || "",
                    });
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateGymMutation.isPending}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold rounded-lg text-xs transition cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {updateGymMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
