"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {

  const router = useRouter();

  const [form, setForm] = useState({
    gymName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e:any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e:any) => {

    e.preventDefault();

    console.log("Register Data", form);

    // future API
    // await fetch("/api/register",{method:"POST",body:JSON.stringify(form)})

    router.push("/login");
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

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              name="gymName"
              placeholder="Gym Name"
              onChange={handleChange}
              className="w-full bg-[#0F172A] border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#22C55E]"
              required
            />

            <input
              type="text"
              name="ownerName"
              placeholder="Owner Name"
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
              type="text"
              name="phone"
              placeholder="Phone"
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

            <button
              type="submit"
              className="w-full bg-[#22C55E] text-black font-semibold p-3 rounded-lg hover:opacity-90 transition"
            >
              Register Gym
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