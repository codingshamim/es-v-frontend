"use client";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBg,
  change,
  changeType = "up",
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-gray-200 dark:border-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {change && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              changeType === "up"
                ? "text-green-500"
                : changeType === "down"
                  ? "text-red-500"
                  : "text-orange-500"
            }`}
          >
            {changeType === "up" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {changeType === "down" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}
