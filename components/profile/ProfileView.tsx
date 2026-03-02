"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getMyOrderCounts } from "@/app/actions/orders";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileTabs, type ProfileTabId } from "./ProfileTabs";
import { PersonalInfoTab } from "./PersonalInfoTab";
import { AddressesTab } from "./AddressesTab";
import { OrdersTab } from "./OrdersTab";
import { SettingsTab } from "./SettingsTab";

export function ProfileView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("personal");
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    getMyOrderCounts().then((res) => {
      if (res.success && res.total !== undefined) {
        setOrderCounts({
          total: res.total ?? 0,
          completed: res.completed ?? 0,
          pending: res.pending ?? 0,
        });
      }
    });
  }, []);

  if (!user) return null;

  const name = user.name ?? "User";
  const email = user.email ?? "";

  return (
    <main className="py-6 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-accent-teal transition-colors font-bengali"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            হোমে ফিরে যান
          </Link>
        </div>
        <ProfileHeader
          name={name}
          email={email}
          image={user.image}
          totalOrders={orderCounts.total}
          completedOrders={orderCounts.completed}
          pendingOrders={orderCounts.pending}
        />

        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-6" role="tabpanel" id={`tab-${activeTab}`} aria-labelledby={`tab-btn-${activeTab}`}>
          {activeTab === "personal" && (
            <PersonalInfoTab
              name={name}
              email={email}
              phone={(user as { phone?: string | null }).phone}
            />
          )}
          {activeTab === "addresses" && <AddressesTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </main>
  );
}
