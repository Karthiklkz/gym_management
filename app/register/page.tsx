"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRegisterMutation } from "@/utility/api/auth";

export default function RegisterPage() {

  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "GYM_ADMIN"
  });
  
  const [errorDisplay, setErrorDisplay] = useState("");
  const registerMutation = useRegisterMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDisplay("");

    const password = form.password;
    if (password.length < 8) {
      setErrorDisplay("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorDisplay("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorDisplay("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorDisplay("Password must contain at least one number.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorDisplay("Password must contain at least one special character (e.g. @, #, $, etc.).");
      return;
    }

    registerMutation.mutate(form, {
      onSuccess: () => {
        // Success! Redirect to login
        router.push("/login");
      },
      onError: (err: any) => {
        setErrorDisplay(err.message || "An error occurred during registration.");
      }
    });
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


      {/* RIGHT SIDE FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-[#020617]">
      <div className="absolute top-6 right-8">
          <Image
            src="/images/peakpulse.png"
            alt="PeakPulse"
            width={100}
            height={100}
          />
        </div>

        <div className="w-[420px]">

          <h1 className="text-3xl font-semibold text-white mb-2">
            Create Account
          </h1>

          <p className="text-slate-400 mb-8">
            Register your gym and start managing members
          </p>

          {/* DISPLAY ERROR MESSAGE */}
          {errorDisplay && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
              {errorDisplay}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              onChange={handleChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
              required
            />

            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              onChange={handleChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
              required
            />

            {/* Hidden field or select for role depending on what's needed. For now it's default value state */}
            <input type="hidden" name="role" value={form.role} />

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-[#22C55E] text-black font-semibold p-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {registerMutation.isPending ? "Registering..." : "Register Gym"}
            </button>

          </form>

          <p className="text-center mt-6 text-sm text-slate-400">
            Already have an account?
            <a href="/login" className="text-[#22C55E] ml-1">
              Login
            </a>
          </p>

        </div>

      </div>

    </div>

  );
}