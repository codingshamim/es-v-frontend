"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-black dark:text-white">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-black dark:text-white placeholder-gray-400 w-48"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent-teal text-white rounded-xl text-sm font-medium hover:bg-accent-teal/90 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          View Site
        </Link>
      </div>
    </header>
  );
}
