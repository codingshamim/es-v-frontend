"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getOrder } from "@/app/actions/orders";
import { Spinner } from "@/components/ui/Spinner";
import { InvoicePrintButton } from "@/components/invoice/InvoicePrintButton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  product: { slug?: string; images?: { main?: string } } | string;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

interface OrderData {
  orderId: string;
  items: OrderItem[];
  shipping: {
    name: string;
    phone: string;
    email?: string;
    district: string;
    city: string;
    address: string;
    notes?: string;
  };
  payment: {
    method: "cod" | "bkash" | "nagad" | "rocket";
    status: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };
  status: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

const CONFETTI_COLORS = [
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return `BDT ${amount.toLocaleString("en-US")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDeliveryDateRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() + 3);
  const to = new Date(now);
  to.setDate(to.getDate() + 5);
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  return `${from.toLocaleDateString("bn-BD", opts)} - ${to.toLocaleDateString("bn-BD", opts)}`;
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function launchConfetti() {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const el = document.createElement("div");
    const size = Math.random() * 8 + 6;
    const color =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 600;
    const duration = Math.random() * 2000 + 2000;
    const rotation = Math.random() * 720 - 360;

    el.style.cssText = `position:absolute;top:-20px;left:${left}%;width:${size}px;height:${size * 0.6}px;background:${color};border-radius:2px;`;

    container.appendChild(el);

    el.animate(
      [
        { transform: "translateY(0) rotate(0deg)", opacity: 1 },
        {
          transform: `translateY(${window.innerHeight + 40}px) rotate(${rotation}deg)`,
          opacity: 0,
        },
      ],
      { duration, delay, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" },
    );
  }

  setTimeout(() => container.remove(), 5000);
}

// ─── CSS Keyframes (injected once) ───────────────────────────────────────────

const STYLE_ID = "order-confirmed-keyframes";

function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes scaleIn {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .anim-scale-in { animation: scaleIn 0.6s ease-out forwards; }
    .anim-fade-in { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
  `;
  document.head.appendChild(style);
}

// ─── Main Content ────────────────────────────────────────────────────────────

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const confettiLaunched = useRef(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("অর্ডার আইডি পাওয়া যায়নি।");
      setLoading(false);
      return;
    }
    try {
      const result = await getOrder(orderId);
      if (result.success && result.data) {
        setOrder(result.data as unknown as OrderData);
      } else {
        setError(result.message || "অর্ডার খুঁজে পাওয়া যায়নি।");
      }
    } catch {
      setError("অর্ডার লোড করতে ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (order && !confettiLaunched.current) {
      confettiLaunched.current = true;
      const t = setTimeout(() => launchConfetti(), 500);
      return () => clearTimeout(t);
    }
  }, [order]);

  // ── Loading ──
  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-black dark:text-white" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bengali">
            অর্ডার লোড হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  // ── Error ──
  if (error || !order) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400 font-bengali">
            অর্ডার খুঁজে পাওয়া যায়নি
          </h2>
          <p className="mb-6 text-sm text-red-600 dark:text-red-400/80 font-bengali">
            {error}
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg border border-red-200 dark:border-red-900/30 px-6 py-2.5 text-sm font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 font-bengali"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </main>
    );
  }

  const orderDate = formatDate(order.createdAt);
  const firstTimestamp =
    order.statusHistory?.[0]?.timestamp
      ? new Date(order.statusHistory[0].timestamp).toLocaleString("bn-BD")
      : "";

  return (
    <main className="min-h-[60vh] pb-12">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ── Progress Steps ── same as cart/checkout/validate-payment */}
        <div
          className="mb-10 flex items-center justify-center gap-0 anim-fade-in"
          style={{ animationDelay: "0ms" }}
        >
          <Link href="/cart" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-black dark:text-white font-bengali">কার্ট</span>
          </Link>
          <div className="mx-3 h-px w-12 bg-black/20 dark:bg-white/20 sm:w-20" />
          <Link href="/checkout" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-black dark:text-white font-bengali">চেকআউট</span>
          </Link>
          <div className="mx-3 h-px w-12 bg-black/20 dark:bg-white/20 sm:w-20" />
          <div className="flex items-center gap-2">
            <div className="flex dark:bg-white dark:text-black h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-black dark:text-white font-bengali">সম্পন্ন</span>
          </div>
        </div>

        {/* ── Success Animation ── */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex dark:bg-white dark:!text-black h-24 w-24 items-center justify-center rounded-full bg-black text-white anim-scale-in">
          <svg
  xmlns="http://www.w3.org/2000/svg"
  width={40}
  height={40}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth={2}
  strokeLinecap="round"
  strokeLinejoin="round"
  className="lucide lucide-circle-check-big-icon lucide-circle-check-big"
>
  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
  <path d="m9 11 3 3L22 4" />
</svg>

          </div>
          <h1
            className="mb-2 text-2xl font-bold text-black dark:text-white sm:text-3xl font-bengali anim-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            অর্ডার সফলভাবে সম্পন্ন হয়েছে!
          </h1>
          <p
            className="text-sm text-gray-500 dark:text-gray-400 font-bengali anim-fade-in"
            style={{ animationDelay: "350ms" }}
          >
            আপনার অর্ডার গ্রহণ করা হয়েছে এবং শীঘ্রই প্রসেস করা হবে।
          </p>
        </div>

        {/* ── Order Details Card ── */}
        <div
          className="mb-6 overflow-hidden rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] anim-fade-in"
          style={{ animationDelay: "450ms" }}
        >
          {/* Order ID Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/5 dark:bg-white/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                অর্ডার আইডি
              </p>
              <p className="text-lg font-bold text-black dark:text-white">
                {order.orderId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                তারিখ
              </p>
              <p className="text-sm font-medium text-black dark:text-white font-bengali">
                {orderDate}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a] px-5 sm:px-6">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-1 text-sm font-medium text-black dark:text-white font-bengali">
                    {item.name}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-bengali">
                    সাইজ: {item.size} | কালার: {item.colorName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-bengali">
                    পরিমাণ: {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-black dark:text-white">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping Info */}
          <div className="border-t border-gray-100 dark:border-[#1a1a1a] px-5 py-5 sm:px-6">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
              </svg>
              <h3 className="text-sm font-bold text-black dark:text-white font-bengali">
                ডেলিভারি ঠিকানা
              </h3>
            </div>
            <div className="pl-7 text-sm text-gray-600 dark:text-gray-400 font-bengali space-y-1">
              <p className="font-medium text-black dark:text-white">
                {order.shipping.name}
              </p>
              <p>{order.shipping.phone}</p>
              <p>
                {order.shipping.address}, {order.shipping.city},{" "}
                {order.shipping.district}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-gray-100 dark:border-[#1a1a1a] px-5 py-5 sm:px-6">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              <h3 className="text-sm font-bold text-black dark:text-white font-bengali">
                পেমেন্ট তথ্য
              </h3>
            </div>
            <div className="pl-7 text-sm text-gray-600 dark:text-gray-400 font-bengali space-y-1">
              <p className="font-medium text-black dark:text-white">
                {PAYMENT_LABELS[order.payment.method] || order.payment.method}
              </p>
              <p>
                {order.payment.status === "verified"
                  ? "পেমেন্ট ভেরিফাই করা হয়েছে"
                  : order.payment.method === "cod"
                    ? "ডেলিভারির সময় পরিশোধ করুন"
                    : "পেমেন্ট পেন্ডিং"}
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div className="border-t border-gray-100 dark:border-[#1a1a1a] px-5 py-5 sm:px-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 font-bengali">
                  সাবটোটাল
                </span>
                <span className="font-medium text-black dark:text-white">
                  {formatPrice(order.pricing.subtotal)}
                </span>
              </div>

              {order.pricing.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 font-bengali">
                    ডিসকাউন্ট
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    -{formatPrice(order.pricing.discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 font-bengali">
                  ডেলিভারি চার্জ
                </span>
                <span className="font-medium text-black dark:text-white">
                  {formatPrice(order.pricing.deliveryCharge)}
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-black dark:text-white font-bengali">
                    সর্বমোট
                  </span>
                  <span className="text-xl font-bold text-black dark:text-white">
                    {formatPrice(order.pricing.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Estimated Delivery ── */}
        <div
          className="mb-6 rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-black/5 dark:bg-white/10 p-5 anim-fade-in"
          style={{ animationDelay: "550ms" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/10">
              <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-black dark:text-white font-bengali">
                আনুমানিক ডেলিভারি তারিখ
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-bengali">
                ৩-৫ কর্মদিবসের মধ্যে ({getDeliveryDateRange()})
              </p>
            </div>
          </div>
        </div>

        {/* ── Order Timeline ── */}
        <div
          className="mb-6 rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 sm:p-6 anim-fade-in"
          style={{ animationDelay: "650ms" }}
        >
          <h3 className="mb-5 text-sm font-bold text-black dark:text-white font-bengali">
            অর্ডার ট্র্যাকিং
          </h3>
          <div className="space-y-0">
            {/* Step 1 - অর্ডার গ্রহণ */}
            <div className="relative flex gap-4 pb-6">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div className="w-px flex-1 bg-black/30 dark:bg-white/30" />
              </div>
              <div className="pb-2">
                <p className="text-sm font-semibold text-black dark:text-white font-bengali">
                  অর্ডার গ্রহণ করা হয়েছে
                </p>
                {firstTimestamp && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-bengali">
                    {firstTimestamp}
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 - প্রসেসিং */}
            <div className="relative flex gap-4 pb-6">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-black text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                  </svg>
                </div>
                <div className="w-px flex-1 bg-gray-200 dark:bg-[#1a1a1a]" />
              </div>
              <div className="pb-2">
                <p className="text-sm font-semibold text-black dark:text-white font-bengali">
                  প্রসেসিং চলছে
                </p>
              </div>
            </div>

            {/* Step 3 - শিপমেন্ট */}
            <div className="relative flex gap-4 pb-6">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div className="w-px flex-1 bg-gray-200 dark:bg-[#1a1a1a]" />
              </div>
              <div className="pb-2">
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 font-bengali">
                  শিপমেন্ট
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600 font-bengali">
                  অপেক্ষমাণ
                </p>
              </div>
            </div>

            {/* Step 4 - ডেলিভারি */}
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 font-bengali">
                  ডেলিভারি সম্পন্ন
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600 font-bengali">
                  অপেক্ষমাণ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div
          className="mb-6 flex flex-col gap-3 sm:flex-row anim-fade-in"
          style={{ animationDelay: "750ms" }}
        >
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] px-6 py-3.5 text-sm font-semibold text-black dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-[#111] font-bengali"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            শপিং চালিয়ে যান
          </Link>
          <InvoicePrintButton
            customClass="flex-1"
            order={{
              orderId: order.orderId,
              items: order.items.map((it) => ({
                name: it.name,
                size: it.size,
                colorName: it.colorName,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
              })),
              shipping: {
                name: order.shipping.name,
                phone: order.shipping.phone,
                district: order.shipping.district,
                city: order.shipping.city,
                address: order.shipping.address,
              },
              payment: {
                method: order.payment.method,
                transactionId: (order.payment as { transactionId?: string }).transactionId,
              },
              pricing: order.pricing,
              createdAt: order.createdAt,
            }}
          />
        </div>

        {/* ── Help Section ── */}
        <div
          className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a] p-5 text-center anim-fade-in"
          style={{ animationDelay: "850ms" }}
        >
          <p className="mb-3 text-sm font-semibold text-black dark:text-white font-bengali">
            কোনো সমস্যা? আমাদের সাথে যোগাযোগ করুন
          </p>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
            <a
              href="tel:+8801816628413"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:text-black dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              +880 1816628413
            </a>
            <a
              href="mailto:contact@esfitt.com"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:text-black dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              contact@esfitt.com
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" className="text-black dark:text-white" />
        </main>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  );
}
