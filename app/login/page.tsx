"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLoginMutation } from "@/utility/api/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorDisplay, setErrorDisplay] = useState("");
  
  const loginMutation = useLoginMutation();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDisplay("");

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (res: any) => {
          // Success! Store JWT & User Info to localStorage
          if (res?.data?.token) {
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
          router.push("/dashboard");
        },
        onError: (err: any) => {
          setErrorDisplay(err.message || "Invalid login credentials");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE IMAGE */}
      <div className="hidden md:flex w-1/2 bg-[#020617] items-center justify-center relative">
        <Image
          src="/images/gym-login-bg.jpg"
          alt="Gym"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-[#020617]">
        <div className="absolute top-6 right-8">
          <Image
            src="/images/peakpulse.png"
            alt="PeakPulse"
            width={90}
            height={90}
          />
        </div>
        
        <div className="w-[380px]">
          <h1 className="text-3xl font-semibold text-[#F8FAFC] mb-2">Sign in</h1>
          <p className="text-slate-400 mb-8">Access your PeakPulse dashboard</p>

          {/* DISPLAY ERROR MESSAGE */}
          {errorDisplay && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
              {errorDisplay}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
            />

            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
            />

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#22C55E] text-black font-semibold p-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loginMutation.isPending ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6">
            Don't have an account?
            <a href="/register" className="text-[#22C55E] ml-1">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
