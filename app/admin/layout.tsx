"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/products/create": "Create Product",
  "/admin/categories": "Categories",
  "/admin/users": "Users",
  "/admin/analytics": "Analytics",
  "/admin/chat": "Live Chat",
  "/admin/coupons": "Coupons",
  "/admin/reviews": "Reviews",
  "/admin/settings": "Settings",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const title =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(
      ([key]) => key !== "/admin" && pathname.startsWith(key),
    )?.[1] ||
    "Admin";

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#000000]">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
