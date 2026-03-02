"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
}

interface ShippingSettings {
  dhakaCharge: number;
  outsideDhakaCharge: number;
  freeShippingMin: number;
}

interface PaymentSettings {
  codEnabled: boolean;
  bkashEnabled: boolean;
  bkashNumber: string;
  nagadEnabled: boolean;
  nagadNumber: string;
  rocketEnabled: boolean;
  rocketNumber: string;
}

interface NotificationSettings {
  orderNotification: boolean;
  lowStockNotification: boolean;
  newReviewNotification: boolean;
}

interface Settings {
  store: StoreSettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
  notifications: NotificationSettings;
}

function normalizeSettings(d: {
  store?: Partial<StoreSettings>;
  shipping?: Partial<ShippingSettings>;
  payment?: Partial<PaymentSettings>;
  notifications?: Partial<NotificationSettings>;
}): Settings {
  return {
    store: {
      storeName: String(d.store?.storeName ?? ""),
      storeEmail: String(d.store?.storeEmail ?? ""),
      storePhone: String(d.store?.storePhone ?? ""),
      storeAddress: String(d.store?.storeAddress ?? ""),
    },
    shipping: {
      dhakaCharge: Number(d.shipping?.dhakaCharge ?? 60),
      outsideDhakaCharge: Number(d.shipping?.outsideDhakaCharge ?? 120),
      freeShippingMin: Number(d.shipping?.freeShippingMin ?? 0),
    },
    payment: {
      codEnabled: Boolean(d.payment?.codEnabled ?? true),
      bkashEnabled: Boolean(d.payment?.bkashEnabled ?? false),
      bkashNumber: String(d.payment?.bkashNumber ?? ""),
      nagadEnabled: Boolean(d.payment?.nagadEnabled ?? false),
      nagadNumber: String(d.payment?.nagadNumber ?? ""),
      rocketEnabled: Boolean(d.payment?.rocketEnabled ?? false),
      rocketNumber: String(d.payment?.rocketNumber ?? ""),
    },
    notifications: {
      orderNotification: Boolean(d.notifications?.orderNotification ?? true),
      lowStockNotification: Boolean(d.notifications?.lowStockNotification ?? true),
      newReviewNotification: Boolean(d.notifications?.newReviewNotification ?? false),
    },
  };
}

const defaultSettings: Settings = {
  store: {
    storeName: "",
    storeEmail: "",
    storePhone: "",
    storeAddress: "",
  },
  shipping: {
    dhakaCharge: 60,
    outsideDhakaCharge: 120,
    freeShippingMin: 0,
  },
  payment: {
    codEnabled: true,
    bkashEnabled: false,
    bkashNumber: "",
    nagadEnabled: false,
    nagadNumber: "",
    rocketEnabled: false,
    rocketNumber: "",
  },
  notifications: {
    orderNotification: true,
    lowStockNotification: true,
    newReviewNotification: false,
  },
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-checked:bg-white dark:peer-checked:bg-white rounded-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-black dark:peer-checked:after:bg-black" />
    </label>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setSettings(normalizeSettings(json.data));
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSettings(normalizeSettings(json.data));
        setToast("Settings saved successfully!");
      } else {
        setToast("Failed to save settings");
      }
    } catch {
      setToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateStore = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      store: { ...prev.store, [field]: value },
    }));
  };

  const updateShipping = (field: keyof ShippingSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, [field]: value },
    }));
  };

  const updatePayment = <K extends keyof PaymentSettings>(
    field: K,
    value: PaymentSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      payment: { ...prev.payment, [field]: value },
    }));
  };

  const updateNotifications = (
    field: keyof NotificationSettings,
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Cog6ToothIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-xl font-bold text-black dark:text-white">
          Settings
        </h1>
      </div>

      {/* Store Settings */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
          Store Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Store Name
            </label>
            <input
              type="text"
              value={settings.store.storeName}
              onChange={(e) => updateStore("storeName", e.target.value)}
              placeholder="Your store name"
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Store Email
            </label>
            <input
              type="email"
              value={settings.store.storeEmail}
              onChange={(e) => updateStore("storeEmail", e.target.value)}
              placeholder="store@example.com"
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Store Phone
            </label>
            <input
              type="tel"
              value={settings.store.storePhone}
              onChange={(e) => updateStore("storePhone", e.target.value)}
              placeholder="+880 1XXX-XXXXXX"
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Store Address
            </label>
            <textarea
              rows={3}
              value={settings.store.storeAddress}
              onChange={(e) => updateStore("storeAddress", e.target.value)}
              placeholder="Full store address"
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
          Shipping Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Dhaka Delivery Charge (৳)
            </label>
            <input
              type="number"
              min={0}
              value={settings.shipping.dhakaCharge}
              onChange={(e) =>
                updateShipping("dhakaCharge", parseInt(e.target.value) || 0)
              }
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Outside Dhaka Delivery Charge (৳)
            </label>
            <input
              type="number"
              min={0}
              value={settings.shipping.outsideDhakaCharge}
              onChange={(e) =>
                updateShipping(
                  "outsideDhakaCharge",
                  parseInt(e.target.value) || 0,
                )
              }
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              Free Shipping Min Order (৳)
            </label>
            <input
              type="number"
              min={0}
              value={settings.shipping.freeShippingMin}
              onChange={(e) =>
                updateShipping(
                  "freeShippingMin",
                  parseInt(e.target.value) || 0,
                )
              }
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Set to 0 to disable free shipping
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
          Payment Methods
        </h2>
        <div className="space-y-5">
          {/* COD */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Cash on Delivery (COD)
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Accept payment upon delivery
              </p>
            </div>
            <Toggle
              checked={settings.payment.codEnabled}
              onChange={(val) => updatePayment("codEnabled", val)}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-white/10" />

          {/* bKash */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  bKash
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Accept bKash mobile payments
                </p>
              </div>
              <Toggle
                checked={settings.payment.bkashEnabled}
                onChange={(val) => updatePayment("bkashEnabled", val)}
              />
            </div>
            {settings.payment.bkashEnabled && (
              <input
                type="text"
                value={settings.payment.bkashNumber}
                onChange={(e) =>
                  updatePayment("bkashNumber", e.target.value)
                }
                placeholder="bKash number (e.g. 01XXXXXXXXX)"
                className="w-full md:w-1/2 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
              />
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/10" />

          {/* Nagad */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Nagad
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Accept Nagad mobile payments
                </p>
              </div>
              <Toggle
                checked={settings.payment.nagadEnabled}
                onChange={(val) => updatePayment("nagadEnabled", val)}
              />
            </div>
            {settings.payment.nagadEnabled && (
              <input
                type="text"
                value={settings.payment.nagadNumber}
                onChange={(e) =>
                  updatePayment("nagadNumber", e.target.value)
                }
                placeholder="Nagad number (e.g. 01XXXXXXXXX)"
                className="w-full md:w-1/2 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
              />
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/10" />

          {/* Rocket */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Rocket
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Accept Rocket mobile payments
                </p>
              </div>
              <Toggle
                checked={settings.payment.rocketEnabled}
                onChange={(val) => updatePayment("rocketEnabled", val)}
              />
            </div>
            {settings.payment.rocketEnabled && (
              <input
                type="text"
                value={settings.payment.rocketNumber}
                onChange={(e) =>
                  updatePayment("rocketNumber", e.target.value)
                }
                placeholder="Rocket number (e.g. 01XXXXXXXXX)"
                className="w-full md:w-1/2 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 transition-all"
              />
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
          Notifications
        </h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Order Notifications
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Get notified when a new order is placed
              </p>
            </div>
            <Toggle
              checked={settings.notifications.orderNotification}
              onChange={(val) => updateNotifications("orderNotification", val)}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Low Stock Alerts
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Get notified when product stock is running low
              </p>
            </div>
            <Toggle
              checked={settings.notifications.lowStockNotification}
              onChange={(val) =>
                updateNotifications("lowStockNotification", val)
              }
            />
          </div>

          <div className="border-t border-gray-100 dark:border-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New Review Notifications
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Get notified when a customer leaves a review
              </p>
            </div>
            <Toggle
              checked={settings.notifications.newReviewNotification}
              onChange={(val) =>
                updateNotifications("newReviewNotification", val)
              }
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-white text-black rounded-xl px-8 py-3 text-sm font-medium hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving && <Spinner size="sm" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${toast.includes("success") ? "bg-green-500" : "bg-red-500"}`}
            />
            <p className="text-sm text-gray-900 dark:text-white">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
