"use client";

export default function Navbar() {

  return (

    <div className="w-full h-16 bg-white shadow flex items-center justify-between px-6">

      <h2 className="text-xl font-semibold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">

        <span>Admin</span>

        <button className="bg-red-500 text-white px-3 py-1 rounded">
          Logout
        </button>

      </div>

    </div>

  );
}