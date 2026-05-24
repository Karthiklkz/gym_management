"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      if (userObj.role === "MEMBER") {
        router.push("/member");
        return;
      } else if (userObj.role === "TRAINER") {
        router.push("/trainer");
        return;
      } else if (userObj.role === "GYM_ADMIN" || userObj.role === "SUPER_ADMIN") {
        setAuthorized(true);
      } else {
        router.push("/login");
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <span className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Verifying session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 bg-[#020617] text-slate-100 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}