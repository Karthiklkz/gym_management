"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";
import Table from "@/components/Table";
import Modal from "@/components/Modal";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    memberId: "",
    amount: "",
    paymentMethod: "CASH",
    membershipPlanId: "",
  });

  // Fetch payments list
  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiClient<any>("/api/payments"),
  });

  // Fetch members for drop-down selection
  const { data: membersResponse } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient<any>("/api/members"),
  });

  // Fetch plans for drop-down selection (in case they don't have active memberships)
  const { data: plansResponse } = useQuery({
    queryKey: ["membershipPlans"],
    queryFn: () => apiClient<any>("/api/membership-plans"),
  });

  // Log payment mutation
  const logPaymentMutation = useMutation({
    mutationFn: (newPayment: typeof form) =>
      apiClient("/api/payments", {
        method: "POST",
        body: JSON.stringify(newPayment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setIsModalOpen(false);
      setForm({
        memberId: "",
        amount: "",
        paymentMethod: "CASH",
        membershipPlanId: "",
      });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to log payment");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    // Auto-fill amount if member is selected and plan is chosen
    if (name === "membershipPlanId" && value) {
      const plan = plans.find((p: any) => p.id === value);
      if (plan) {
        updatedForm.amount = String(plan.price);
      }
    }
    setForm(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    logPaymentMutation.mutate(form);
  };

  const payments = paymentsResponse?.data || [];
  const members = membersResponse?.data || [];
  const plans = plansResponse?.data || [];

  // Table columns definition
  const columns = [
    {
      header: "Member Name",
      render: (row: any) => (
        <span className="font-semibold text-white">
          {row.member?.user?.profile?.firstName} {row.member?.user?.profile?.lastName || ""}
        </span>
      ),
    },
    {
      header: "Membership Plan",
      render: (row: any) => (
        <span className="text-slate-300">
          {row.membership?.membershipPlan?.name || "N/A"}
        </span>
      ),
    },
    {
      header: "Amount Paid",
      render: (row: any) => (
        <span className="font-bold text-[#22C55E]">₹{Number(row.amount).toFixed(2)}</span>
      ),
    },
    {
      header: "Payment Method",
      render: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      header: "Transaction ID",
      render: (row: any) => (
        <span className="text-xs text-slate-400 font-mono">
          {row.transactionId || "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: "Paid At",
      render: (row: any) => (
        <span className="text-slate-400 text-xs">
          {new Date(row.paidAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Billing</h1>
          <p className="text-sm text-slate-400">
            Log membership transactions and monitor gym monthly revenue.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer"
        >
          + Log Payment
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-4 text-sm">Loading billing records...</div>
        ) : (
          <Table
            columns={columns}
            data={payments}
            searchPlaceholder="Search payments by member name or transaction..."
            searchKey={(row: any) =>
              `${row.member?.user?.profile?.firstName} ${row.member?.user?.profile?.lastName} ${row.transactionId}`
            }
          />
        )}
      </div>

      {/* Log Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Gym Transaction"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Select Gym Member *
            </label>
            <select
              name="memberId"
              required
              value={form.memberId}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="">Choose a member</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.user?.profile?.firstName} {m.user?.profile?.lastName || ""} ({m.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Activate New Plan (Optional)
            </label>
            <select
              name="membershipPlanId"
              value={form.membershipPlanId}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="">Keep current active membership</option>
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (₹{plan.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Transaction Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              value={form.amount}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              required
              value={form.paymentMethod}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E]"
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CREDIT/DEBIT CARD</option>
              <option value="UPI">UPI/MOBILE PAY</option>
              <option value="ONLINE">NET BANKING / ONLINE</option>
            </select>
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
              disabled={logPaymentMutation.isPending}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              {logPaymentMutation.isPending ? "Logging..." : "Log Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
