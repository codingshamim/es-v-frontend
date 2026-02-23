import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { LogInIcon, UserPlusIcon } from "@/components/icons";
import { NavButton } from "@/components/layout/NavButton";

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 bg-black/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-3">
            <NavButton href="/login" variant="default" icon={<LogInIcon className="w-[18px] h-[18px]" />}>
              <span className="font-bengali">লগিন</span>
            </NavButton>
            <NavButton href="/register" variant="filled" icon={<UserPlusIcon className="w-[18px] h-[18px]" />}>
              <span className="hidden md:block font-bengali">রেজিস্টার</span>
            </NavButton>
          </div>
        </div>
      </div>
    </header>
  );
}
