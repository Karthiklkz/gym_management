"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Modal from "@/components/Modal";

export default function TrainerMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch Member Details & Last 30 Days Attendance
  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ["trainerMemberDetail", id],
    queryFn: () => apiClient<any>(`/api/trainer/members/${id}`),
  });

  const memberData = detailResponse?.data?.member || null;
  const attendance = detailResponse?.data?.attendance || [];

  const profile = memberData?.user?.profile || {};
  const memberships = memberData?.memberships || [];
  const activeMembership = memberships[0];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    emergencyContact: "",
    profileImage: "",
  });

  // Edit Profile Mutation
  const editProfileMutation = useMutation({
    mutationFn: (updatedFields: typeof form) =>
      apiClient(`/api/trainer/members/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedFields),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerMemberDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["trainerMembers"] });
      setIsEditOpen(false);
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update member profile");
    },
  });

  const openEditModal = () => {
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      gender: profile.gender || "",
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
      emergencyContact: profile.emergencyContact || "",
      profileImage: profile.profileImage || "",
    });
    setFormError("");
    setIsEditOpen(true);
  };

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
    setFormError("");
    editProfileMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="py-10 text-slate-400 text-sm flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading member record profile...
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
        <p className="text-slate-400 font-semibold text-sm">Member not found</p>
        <p className="text-slate-550 text-xs mt-1">The member either does not exist or belongs to another branch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Member Profile</h1>
          <p className="text-sm text-slate-400">Review branch member profile metrics and active attendance.</p>
        </div>
        <button
          onClick={openEditModal}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold px-4 py-2 rounded-lg text-sm transition cursor-pointer shadow-md shadow-emerald-500/10"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - profile and memberships */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold text-3xl mb-4">
                {profile.firstName?.charAt(0) || "M"}
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {profile.firstName} {profile.lastName || ""}
              </h3>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-2">
                Member
              </span>
            </div>

            <div className="border-t border-slate-850 mt-6 pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="text-slate-300 font-semibold">{memberData.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phone Number</span>
                <span className="text-slate-300 font-semibold">{memberData.user?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="text-slate-300 font-semibold">{profile.gender || "Unspecified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="text-slate-300 font-semibold">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Emergency Contact</span>
                <span className="text-slate-300 font-semibold">{profile.emergencyContact || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Registration Date</span>
                <span className="text-slate-300 font-semibold">
                  {new Date(memberData.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Membership Card */}
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Membership Info</h4>
            {activeMembership ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">{activeMembership.membershipPlan?.name}</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      activeMembership.status === "ACTIVE"
                        ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {activeMembership.status}
                  </span>
                </div>
                <div className="border-t border-slate-850 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Rate</span>
                    <span className="text-slate-300 font-semibold">₹{Number(activeMembership.membershipPlan?.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Start Date</span>
                    <span className="text-slate-300 font-semibold">
                      {new Date(activeMembership.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expiration Date</span>
                    <span className="text-rose-400 font-semibold">
                      {new Date(activeMembership.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-550 text-center py-2">No active memberships</p>
            )}
          </div>
        </div>

        {/* Right column - Attendance */}
        <div className="lg:col-span-2">
          <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">Last 30 Days Attendance History</h3>
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-450 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-400">Check-In</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Check-Out</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {attendance.map((record: any) => {
                      const checkIn = new Date(record.checkIn);
                      const checkOut = record.checkOut ? new Date(record.checkOut) : null;
                      
                      let duration = "Active Session";
                      if (checkOut) {
                        const diffMs = checkOut.getTime() - checkIn.getTime();
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffMins = Math.floor((diffMs % 3600000) / 60000);
                        duration = `${diffHrs}h ${diffMins}m`;
                      }

                      return (
                        <tr key={record.id} className="hover:bg-slate-900/20 transition">
                          <td className="py-3 px-4 text-xs font-medium text-white">
                            {checkIn.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {checkOut ? (
                              <span className="text-slate-300">{checkOut.toLocaleString()}</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 animate-pulse">
                                Checked In
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                            {duration}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-550 py-8 text-center">No attendance sessions registered in the last 30 days.</p>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Update Member Profile Details"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleInputChange}
                className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Emergency Contact Phone
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={form.emergencyContact}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Profile Image URL
            </label>
            <input
              type="text"
              name="profileImage"
              value={form.profileImage}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editProfileMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {editProfileMutation.isPending ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
