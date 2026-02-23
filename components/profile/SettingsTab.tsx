"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogOutIcon } from "@/components/icons";

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-black dark:text-white text-sm font-bengali">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 dark:bg-[#333333] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-teal/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-teal" />
      </label>
    </div>
  );
}

export function SettingsTab() {
  const { logout } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [promoEmail, setPromoEmail] = useState(true);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1a1a1a]">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-bengali">
          নোটিফিকেশন
        </h3>
        <div className="space-y-4">
          <SettingToggle
            title="ইমেইল নোটিফিকেশন"
            description="অর্ডার আপডেট সম্পর্কে ইমেইল পান"
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <SettingToggle
            title="SMS নোটিফিকেশন"
            description="অর্ডার আপডেট সম্পর্কে SMS পান"
            checked={smsNotif}
            onChange={setSmsNotif}
          />
          <SettingToggle
            title="প্রমোশনাল ইমেইল"
            description="অফার এবং ডিসকাউন্ট সম্পর্কে জানুন"
            checked={promoEmail}
            onChange={setPromoEmail}
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1a1a1a]">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-bengali">
          অ্যাকাউন্ট
        </h3>
        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#222222] hover:border-accent-teal transition-colors"
          >
            <span className="text-sm font-medium text-black dark:text-white font-bengali">
              পাসওয়ার্ড পরিবর্তন করুন
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#222222] hover:border-accent-teal transition-colors"
          >
            <span className="text-sm font-medium text-black dark:text-white font-bengali">
              প্রাইভেসি সেটিংস
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#111111] rounded-xl border border-red-500/20 hover:border-red-500 transition-colors"
          >
            <span className="text-sm font-medium text-red-500 font-bengali">
              লগআউট
            </span>
            <LogOutIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
