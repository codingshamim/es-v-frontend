"use client";

import { useState } from "react";
import Image from "next/image";
import { getOrder } from "@/app/actions/orders";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface OrderItem {
  name: string;
  image: string;
  size: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
}

interface TrackedOrder {
  orderId: string;
  status: string;
  items: OrderItem[];
  shipping: {
    name: string;
    phone: string;
    district: string;
    city: string;
    address: string;
  };
  payment: {
    method: string;
    status: string;
  };
  pricing: {
    subtotal: number;
    deliveryCharge: number;
    discount: number;
    total: number;
  };
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: {
    label: "পেন্ডিং",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: "🕐",
  },
  confirmed: {
    label: "কনফার্মড",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "✓",
  },
  processing: {
    label: "প্রসেসিং",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "⚙",
  },
  shipped: {
    label: "শিপড",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "🚚",
  },
  delivered: {
    label: "ডেলিভারড",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "✅",
  },
  cancelled: {
    label: "বাতিল",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "✕",
  },
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

function OrderTimeline({
  currentStatus,
  statusHistory,
}: {
  currentStatus: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
}) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="relative">
      {STATUS_STEPS.map((step, i) => {
        const config = STATUS_CONFIG[step] || STATUS_CONFIG.pending;
        const historyEntry = statusHistory.find((h) => h.status === step);
        const isCompleted = !isCancelled && i <= currentIdx;
        const isCurrent = !isCancelled && i === currentIdx;
        const isLast = i === STATUS_STEPS.length - 1;

        return (
          <div key={step} className="flex gap-4">
            {/* Line & Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isCancelled
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                    : isCompleted
                      ? "bg-accent-teal text-white"
                      : "bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-12 ${
                    isCompleted && i < currentIdx
                      ? "bg-accent-teal"
                      : "bg-gray-200 dark:bg-[#1a1a1a]"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-semibold font-bengali ${
                  isCurrent ? "text-accent-teal" : isCompleted ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {config.label}
              </p>
              {historyEntry && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(historyEntry.timestamp).toLocaleString("bn-BD")}
                  </p>
                  {historyEntry.note && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-bengali">
                      {historyEntry.note}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="flex gap-4 mt-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">
              ✕
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-500 font-bengali">বাতিল</p>
            {statusHistory.find((h) => h.status === "cancelled") && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(
                  statusHistory.find((h) => h.status === "cancelled")!.timestamp,
                ).toLocaleString("bn-BD")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("অর্ডার আইডি লিখুন");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);

    try {
      const result = await getOrder(orderId.trim());
      if (result.success && result.data) {
        setOrder(result.data as unknown as TrackedOrder);
      } else {
        setError(result.message || "অর্ডার খুঁজে পাওয়া যায়নি");
      }
    } catch {
      setError("অর্ডার খুঁজতে ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null;

  return (
    <main className="min-h-[60vh] pb-24 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-teal/10">
            <svg className="h-8 w-8 text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white font-bengali">
            অর্ডার ট্র্যাকিং
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-bengali">
            আপনার অর্ডার আইডি দিয়ে অর্ডারের অবস্থা জানুন
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="অর্ডার আইডি (যেমন: ES1A2B3C4D5E)"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-accent-teal"
            />
            <Button
              variant="secondary"
              size="md"
              type="submit"
              disabled={loading}
              className="shrink-0"
            >
              {loading ? (
                <Spinner size="sm" className="text-white dark:text-black" />
              ) : (
                <span className="font-bengali">খুঁজুন</span>
              )}
            </Button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 p-6 text-center mb-8">
            <p className="text-red-700 dark:text-red-400 font-bengali">{error}</p>
          </div>
        )}

        {/* No result */}
        {searched && !loading && !error && !order && (
          <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a] p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-bengali">
              অর্ডার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার আইডি দিন।
            </p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className={`rounded-2xl ${statusConfig?.bg} p-6 text-center`}>
              <div className="text-3xl mb-2">{statusConfig?.icon}</div>
              <h2 className={`text-xl font-bold ${statusConfig?.color} font-bengali`}>
                {statusConfig?.label}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Order ID: <span className="font-mono font-semibold text-black dark:text-white">{order.orderId}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleString("bn-BD")}
              </p>
            </div>

            {/* Order Timeline */}
            <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-6 font-bengali">
                অর্ডার টাইমলাইন
              </h3>
              <OrderTimeline
                currentStatus={order.status}
                statusHistory={order.statusHistory}
              />
            </div>

            {/* Order Items */}
            <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
              <h3 className="text-base font-bold text-black dark:text-white mb-4 font-bengali">
                অর্ডার আইটেম
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-medium text-black dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        সাইজ: {item.size} | কালার: {item.colorName} | ×{item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-black dark:text-white">
                      ৳{(item.unitPrice * item.quantity).toLocaleString("bn-BD")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
                <h3 className="text-base font-bold text-black dark:text-white mb-3 font-bengali">
                  ডেলিভারি তথ্য
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-black dark:text-white font-medium">{order.shipping.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{order.shipping.phone}</p>
                  <p className="text-gray-500 dark:text-gray-400 font-bengali">
                    {order.shipping.district}, {order.shipping.city}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">{order.shipping.address}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
                <h3 className="text-base font-bold text-black dark:text-white mb-3 font-bengali">
                  পেমেন্ট সামারি
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 font-bengali">সাবটোটাল</span>
                    <span className="text-black dark:text-white">৳{order.pricing.subtotal.toLocaleString("bn-BD")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 font-bengali">ডেলিভারি</span>
                    <span className="text-black dark:text-white">৳{order.pricing.deliveryCharge.toLocaleString("bn-BD")}</span>
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 font-bengali">ডিসকাউন্ট</span>
                      <span className="text-accent-green">-৳{order.pricing.discount.toLocaleString("bn-BD")}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-2 flex justify-between">
                    <span className="font-bold text-black dark:text-white font-bengali">মোট</span>
                    <span className="font-bold text-accent-teal">৳{order.pricing.total.toLocaleString("bn-BD")}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500 dark:text-gray-400 font-bengali">পেমেন্ট</span>
                    <span className="text-black dark:text-white uppercase text-xs font-semibold">
                      {order.payment.method} ({order.payment.status})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
