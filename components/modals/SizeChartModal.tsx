"use client";

import { CloseIcon } from "@/components/icons";

interface SizeEntry {
  label: string;
  chest?: string;
  length?: string;
  sleeve?: string;
}

const DEFAULT_SIZES: SizeEntry[] = [
  { label: "M", chest: "39", length: "27.5", sleeve: "8.5" },
  { label: "L", chest: "40.5", length: "28", sleeve: "8.75" },
  { label: "XL", chest: "43", length: "29", sleeve: "9" },
  { label: "2XL", chest: "45", length: "30", sleeve: "9.25" },
];

interface SizeChartModalProps {
  open: boolean;
  onClose: () => void;
  sizes?: SizeEntry[];
}

export function SizeChartModal({ open, onClose, sizes }: SizeChartModalProps) {
  const data = sizes ?? DEFAULT_SIZES;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-chart-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2
            id="size-chart-title"
            className="text-lg font-bold text-gray-900 dark:text-white font-bengali"
          >
            সাইজ চার্ট
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Size chart – In inches (Expected Deviation &lt; 3%)
          </p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Chest (round)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Length
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Sleeve
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {data.map((row) => (
                  <tr
                    key={row.label}
                    className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.chest ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.length ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.sleeve ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
