"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { connectSocket } from "@/lib/socket";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface NotificationCounts {
  orders: number;
  chat: number;
  reviews: number;
  total: number;
}

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data) {
          const d = json.data;
          setCounts({
            orders: Number(d.orders ?? 0),
            chat: Number(d.chat ?? 0),
            reviews: Number(d.reviews ?? 0),
            total: Number(d.total ?? 0),
          });
          setNotificationCount(Number(d.total ?? 0));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    let mounted = true;
    fetchNotifications();

    const socket = connectSocket();
    const joinRoom = () => socket.emit("join-admin-notifications");
    joinRoom();
    socket.on("connect", joinRoom);
    socket.on("notification", () => {
      if (mounted) {
        setNotificationCount((prev) => prev + 1);
        fetchNotifications();
      }
    });

    return () => {
      mounted = false;
      socket.off("connect", joinRoom);
      socket.off("notification");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationOpen]);

  return (
    <header className="h-16 bg-white dark:bg-[#000000] border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-black dark:text-white">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 dark:border dark:border-white/10 rounded-xl">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-black dark:text-white placeholder-gray-400 w-48"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        <div className="relative" ref={modalRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              if (!notificationOpen) setNotificationCount(0);
            }}
            className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#000000]">
                <h3 className="text-base font-semibold text-black dark:text-white">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {counts && counts.total > 0
                    ? `${counts.total} unread`
                    : "All caught up — nothing new"}
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {counts && (
                  <div className="px-2 space-y-0.5">
                    <Link
                      href="/admin/orders"
                      onClick={() => setNotificationOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        counts.orders > 0
                          ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          counts.orders > 0
                            ? "bg-amber-200/60 dark:bg-amber-800/40"
                            : "bg-gray-100 dark:bg-white/5"
                        }`}
                      >
                        <ClipboardDocumentListIcon
                          className={`w-5 h-5 ${
                            counts.orders > 0
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            counts.orders > 0
                              ? "font-semibold text-black dark:text-white"
                              : "font-medium text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          Orders
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {counts.orders > 0
                            ? `${counts.orders} pending`
                            : "No pending orders"}
                        </p>
                      </div>
                      {counts.orders > 0 ? (
                        <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold flex items-center justify-center">
                          {counts.orders > 99 ? "99+" : counts.orders}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Read</span>
                      )}
                    </Link>
                    <Link
                      href="/admin/chat"
                      onClick={() => setNotificationOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        counts.chat > 0
                          ? "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          counts.chat > 0
                            ? "bg-blue-200/60 dark:bg-blue-800/40"
                            : "bg-gray-100 dark:bg-white/5"
                        }`}
                      >
                        <ChatBubbleLeftRightIcon
                          className={`w-5 h-5 ${
                            counts.chat > 0
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            counts.chat > 0
                              ? "font-semibold text-black dark:text-white"
                              : "font-medium text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          Live Chat
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {counts.chat > 0
                            ? `${counts.chat} unread messages`
                            : "All messages read"}
                        </p>
                      </div>
                      {counts.chat > 0 ? (
                        <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">
                          {counts.chat > 99 ? "99+" : counts.chat}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Read</span>
                      )}
                    </Link>
                    <Link
                      href="/admin/reviews"
                      onClick={() => setNotificationOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        counts.reviews > 0
                          ? "bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          counts.reviews > 0
                            ? "bg-green-200/60 dark:bg-green-800/40"
                            : "bg-gray-100 dark:bg-white/5"
                        }`}
                      >
                        <StarIcon
                          className={`w-5 h-5 ${
                            counts.reviews > 0
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            counts.reviews > 0
                              ? "font-semibold text-black dark:text-white"
                              : "font-medium text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          Reviews
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {counts.reviews > 0
                            ? `${counts.reviews} new in last 24h`
                            : "No new reviews"}
                        </p>
                      </div>
                      {counts.reviews > 0 ? (
                        <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center">
                          {counts.reviews > 99 ? "99+" : counts.reviews}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Read</span>
                      )}
                    </Link>
                  </div>
                )}
                {!counts && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#000000]">
                <Link
                  href="/admin/orders"
                  onClick={() => setNotificationOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors rounded-lg border border-gray-200 dark:border-white/20"
                >
                  View all orders
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-white text-black dark:text-black rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          View Site
        </Link>
      </div>
    </header>
  );
}
