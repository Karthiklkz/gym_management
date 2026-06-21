"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

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
      } else if (userObj.role === "TRAINER") {
        router.push("/trainer");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
        <span className="h-5 w-5 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
}
