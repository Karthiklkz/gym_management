"use client";

import { useState } from "react";

interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: (row: T) => string;
}

export default function Table<T>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter data
  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    if (searchKey) {
      return searchKey(row).toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Default search: check all string/number fields
    return Object.values(row as any).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full">
      {/* Table search toolbar */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-[#0F172A] border border-slate-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#22C55E] w-64"
        />
        <span className="text-xs text-slate-400">
          Showing {paginatedData.length} of {filteredData.length} records
        </span>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0B0F19]">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-[#111827] text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-[#090D16]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-900/30 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? String((row as any)[col.accessor])
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
