"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utility/api/apiClient";

export default function MemberNotificationsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Member Notifications
  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ["memberNotifications", currentPage],
    queryFn: () => apiClient<any>(`/api/member/notifications?page=${currentPage}&limit=10`),
  });

  const notificationsData = notificationsResponse?.data || {
    notifications: [],
    pagination: { total: 0, totalPages: 1 }
  };

  const list = notificationsData.notifications;
  const pagination = notificationsData.pagination;

  const hasUnread = list.some((n: any) => !n.isRead);

  // Mark Single Notification Read
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient("/api/member/notifications", {
        method: "PUT",
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["memberDashboardStats"] });
    },
  });

  // Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiClient("/api/member/notifications", {
        method: "PUT",
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["memberDashboardStats"] });
    },
  });

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Alerts & Notifications</h1>
          <p className="text-sm text-slate-400">View updates, holiday alerts, and dynamic gym reminders.</p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={!hasUnread || markAllReadMutation.isPending}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60"
        >
          {markAllReadMutation.isPending ? "Marking..." : "Mark All Read"}
        </button>
      </div>

      <div className="bg-[#090D16] border border-slate-800 rounded-xl p-6 shadow-md">
        {isLoading ? (
          <div className="text-slate-400 py-6 text-sm flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading alerts...
          </div>
        ) : list.length > 0 ? (
          <div className="space-y-3">
            {list.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-xl border transition cursor-pointer text-xs ${
                  !item.isRead
                    ? "bg-[#22C55E]/5 border-[#22C55E]/30 hover:bg-[#22C55E]/10"
                    : "bg-[#0B0F19] border-slate-850 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#22C55E] shrink-0 animate-pulse" />
                      )}
                      <h4 className={`text-sm ${!item.isRead ? "font-bold text-white" : "font-semibold text-slate-350"}`}>
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-slate-400 leading-relaxed pl-4">{item.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-550 shrink-0 font-semibold uppercase tracking-wide">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-6 border-t border-slate-850">
                <span className="text-xs text-slate-500 font-medium">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-450 font-semibold text-sm">No notifications found</p>
            <p className="text-slate-550 text-xs mt-1">You are all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
