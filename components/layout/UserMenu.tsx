"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { UserIcon, ChevronDownIcon, LogOutIcon } from "@/components/icons";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status !== "authenticated" || !session?.user) return null;

  const user = session.user;
  const name = user.name ?? "User";
  const email = user.email ?? "";

  const handleLogout = () => {
    setOpen(false);
    signOut({ callbackUrl: "/", redirect: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors min-w-0 max-w-[220px] sm:max-w-[280px]"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
        </span>
        <span className="flex-1 min-w-0 hidden sm:block">
          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate font-bengali">
            {name}
          </span>
          {email && (
            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
              {email}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] shadow-lg py-1 z-50"
          role="menu"
        >
          <Link href="/profile" className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] font-bengali">
            <UserIcon className="w-4 h-4" />
            প্রোফাইল
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] font-bengali"
            role="menuitem"
          >
            <LogOutIcon className="w-4 h-4" />
            লগআউট
          </button>
        </div>
      )}
    </div>
  );
}
