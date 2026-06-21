"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        const name = `${userObj.profile?.firstName || ""} ${userObj.profile?.lastName || ""}`.trim();
        if (name) setUserName(name);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore network errors
    }
    router.push("/login");
  };

  return (
    <div className="w-full h-16 bg-[#090D16] border-b border-slate-800 flex items-center justify-between px-6 text-slate-100">
      <h2 className="text-xl font-semibold tracking-tight text-white">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
          {userName}
        </span>

        <button
          onClick={handleLogout}
          className="bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}