"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setRole(userObj.role || "");
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  let menuItems = [];

  if (role === "SUPER_ADMIN") {
    menuItems = [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Gyms", href: "/dashboard/gyms" },
      { name: "Members", href: "/dashboard/members" },
      { name: "Trainers", href: "/dashboard/trainers" },
    ];
  } else if (role === "GYM_ADMIN") {
    menuItems = [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Members", href: "/dashboard/members" },
      { name: "Trainers", href: "/dashboard/trainers" },
      { name: "Payments", href: "/dashboard/payments" },
      { name: "Classes", href: "/dashboard/classes" },
      { name: "Equipment", href: "/dashboard/equipment" },
    ];
  } else if (role === "TRAINER") {
    menuItems = [
      { name: "Dashboard", href: "/trainer" },
      { name: "Members", href: "/trainer/members" },
      { name: "Attendance", href: "/trainer/attendance" },
      { name: "Notifications", href: "/trainer/notifications" },
      { name: "Profile", href: "/trainer/profile" },
    ];
  } else if (role === "MEMBER") {
    menuItems = [
      { name: "Dashboard", href: "/member" },
      { name: "Membership", href: "/member/membership" },
      { name: "Attendance", href: "/member/attendance" },
      { name: "Notifications", href: "/member/notifications" },
      { name: "Profile", href: "/member/profile" },
    ];
  } else {
    // Default fallback
    menuItems = [
      { name: "Dashboard", href: "/dashboard" },
    ];
  }


  return (
    <div className="w-64 h-screen bg-[#090D16] border-r border-slate-800 text-slate-300 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="h-8 w-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/20 text-[#22C55E] font-bold text-lg">
            P
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            PeakPulse <span className="text-[#22C55E]">Elite</span>
          </span>
        </div>

        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-white border border-transparent"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-slate-800/60 pt-4 px-2">
        <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
          System Status
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-semibold text-slate-400">All services online</span>
        </div>
      </div>
    </div>
  );
}