"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function MemberProfilePage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    emergencyContact: "",
    profileImage: "",
  });

  // Fetch Member Own Profile (medicalNotes are securely excluded by the backend)
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["memberOwnProfile"],
    queryFn: () => apiClient<any>("/api/member/profile"),
  });

  const memberData = profileResponse?.data || null;

  useEffect(() => {
    if (memberData) {
      const profile = memberData.profile || {};
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
        emergencyContact: profile.emergencyContact || "",
        profileImage: profile.profileImage || "",
      });
    }
  }, [memberData]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updatedForm: typeof form) =>
      apiClient("/api/member/profile", {
        method: "PUT",
        body: JSON.stringify(updatedForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberOwnProfile"] });
      queryClient.invalidateQueries({ queryKey: ["memberDashboardStats"] });
      setSuccessMessage("Your profile has been updated successfully!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to update profile");
      setSuccessMessage("");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    updateProfileMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="py-10 text-slate-400 text-sm flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-400">View and update your personal athlete profile details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {successMessage && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] p-3 rounded-lg text-xs font-semibold">
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Personal Details */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#22C55E] border-b border-slate-850 pb-2 uppercase tracking-wide">
              Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                Profile Image URL
              </label>
              <input
                type="text"
                name="profileImage"
                value={form.profileImage}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Section 2: Contact Details (Read Only) & Security locks */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#22C55E] border-b border-slate-850 pb-2 uppercase tracking-wide">
              Contact & Membership Settings
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Email Address (Read-only)
                <span className="text-[9px] text-slate-500 font-normal italic">(Contact admin to edit)</span>
              </label>
              <input
                type="email"
                disabled
                value={memberData?.email || ""}
                className="w-full bg-slate-900 border border-slate-850 text-slate-500 px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Contact Phone (Read-only)
                <span className="text-[9px] text-slate-500 font-normal italic">(Contact admin to edit)</span>
              </label>
              <input
                type="text"
                disabled
                value={memberData?.phone || "Not Set"}
                className="w-full bg-slate-900 border border-slate-850 text-slate-500 px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wide">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-705 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
                placeholder="e.g. +1 555 999 8888"
              />
            </div>

            {memberData?.memberId && (
              <div className="pt-2 border-b border-slate-850 pb-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member ID</span>
                <span className="block text-[#22C55E] font-bold text-sm font-mono mt-1">
                  {memberData.memberId}
                </span>
              </div>
            )}

            <div className="pt-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Join Date</span>
              <span className="block text-slate-400 font-semibold text-xs mt-1">
                {memberData?.joinDate ? new Date(memberData.joinDate).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold px-6 py-3 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/10"
          >
            {updateProfileMutation.isPending ? "Updating profile..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
