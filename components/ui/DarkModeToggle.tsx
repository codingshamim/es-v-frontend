"use client";

import { useTheme } from "@/lib/theme";
import { SunIcon, MoonIcon } from "@/components/icons";

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="active:scale-[98%] transition-all cursor-pointer flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252525] "
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      type="button"
    >
      <SunIcon className="w-5 h-5 hidden dark:block" />
      <MoonIcon className="w-5 h-5 block dark:hidden" />
    </button>
  );
}
