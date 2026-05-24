"use client";

import DashboardLayout from "@/components/layout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const userObj = JSON.parse(userStr);
      if (userObj.role !== "MEMBER") {
        router.push("/dashboard");
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Verifying member credentials...
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
