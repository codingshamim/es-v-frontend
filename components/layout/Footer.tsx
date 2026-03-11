"use client";

import { useState, useEffect } from "react";
import { FooterBrand } from "./FooterBrand";
import { FooterContact } from "./FooterContact";
import { FooterSocial } from "./FooterSocial";
import { FooterBottom } from "./FooterBottom";

interface SettingsData {
  store?: { storeName?: string; storeEmail?: string; storePhone?: string; storeAddress?: string };
  shipping?: unknown;
  payment?: unknown;
  social?: { facebook?: string; instagram?: string; linkedin?: string };
}

export function Footer() {
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setSettings(json.data);
      })
      .catch(() => {});
  }, []);

  const store = settings?.store;
  const social = settings?.social;
  return (
    <footer className="bg-white  dark:bg-black border-t border-gray-200 dark:border-gray-800 pt-12 pb-24 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <FooterBrand storeName={store?.storeName} />
          <FooterContact store={store} />
          <FooterSocial social={social} />
        </div>
        <FooterBottom />
      </div>
    </footer>
  );
}
