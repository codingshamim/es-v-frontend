"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  TagIcon,
  UsersIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  StarIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/orders", label: "Orders", icon: ClipboardDocumentListIcon, badge: true },
  { href: "/admin/products", label: "Products", icon: CubeIcon },
  { href: "/admin/categories", label: "Categories", icon: TagIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/analytics", label: "Analytics", icon: ChartBarIcon },
  { href: "/admin/chat", label: "Live Chat", icon: ChatBubbleLeftRightIcon, pulse: true },
  { href: "/admin/coupons", label: "Coupons", icon: TicketIcon },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
];

const BOTTOM_NAV = [
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-[#1a1a1a] transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-200 dark:border-[#1a1a1a] shrink-0">
          <div className="w-8 h-8 bg-accent-teal rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ES</span>
          </div>
          <div>
            <h1 className="text-black dark:text-white font-bold text-lg leading-none">
              ES FITT
            </h1>
            <span className="text-accent-teal text-[10px] uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-accent-teal/10 text-accent-teal"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-accent-teal"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.pulse && (
                  <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-[#1a1a1a]">
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-accent-teal/10 text-accent-teal"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-accent-teal"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-teal flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black dark:text-white truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
