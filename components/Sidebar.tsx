"use client";

import Link from "next/link";

export default function Sidebar() {

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5">

      <h1 className="text-2xl font-bold mb-8">
        Gym Admin
      </h1>

      <ul className="space-y-4">

        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link href="/dashboard/members">Members</Link>
        </li>

        <li>
          <Link href="/dashboard/trainers">Trainers</Link>
        </li>

        <li>
          <Link href="/dashboard/payments">Payments</Link>
        </li>

        <li>
          <Link href="/dashboard/classes">Classes</Link>
        </li>

        <li>
          <Link href="/dashboard/equipment">Equipment</Link>
        </li>

      </ul>

    </div>
  );
}