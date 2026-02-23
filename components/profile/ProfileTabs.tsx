"use client";

export type ProfileTabId = "personal" | "addresses" | "orders" | "settings";

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: "personal", label: "ব্যক্তিগত তথ্য" },
  { id: "addresses", label: "ঠিকানা" },
  { id: "orders", label: "অর্ডার ইতিহাস" },
  { id: "settings", label: "সেটিংস" },
];

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div
      className="flex items-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2 border-b border-gray-200 dark:border-[#1a1a1a]"
      role="tablist"
      aria-label="Profile sections"
    >
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`tab-${id}`}
          id={`tab-btn-${id}`}
          onClick={() => onTabChange(id)}
          className={`tab-button px-4 py-2 text-sm font-medium whitespace-nowrap font-bengali transition-all duration-200 ${
            activeTab === id
              ? "border-b-2 border-accent-teal text-accent-teal"
              : "text-gray-500 dark:text-gray-400 hover:text-accent-teal border-b-2 border-transparent"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export { TABS };
