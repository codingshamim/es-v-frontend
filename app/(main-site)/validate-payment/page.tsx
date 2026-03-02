"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrder, verifyPayment, confirmCodOrder } from "@/app/actions/orders";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";

interface OrderPricing {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

interface OrderData {
  orderId: string;
  pricing: OrderPricing;
  payment: {
    method: PaymentMethod;
    status: string;
  };
}

interface PaymentSettings {
  codEnabled?: boolean;
  bkashEnabled?: boolean;
  bkashNumber?: string;
  nagadEnabled?: boolean;
  nagadNumber?: string;
  rocketEnabled?: boolean;
  rocketNumber?: string;
}

const DEFAULT_MERCHANT = "01994844761";

const PAYMENT_CONFIG: Record<
  "bkash" | "nagad" | "rocket",
  { label: string; color: string; bg: string; border: string; gradient: string }
> = {
  bkash: {
    label: "bKash",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    gradient: "from-pink-600 to-pink-500",
  },
  nagad: {
    label: "Nagad",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    gradient: "from-orange-600 to-orange-500",
  },
  rocket: {
    label: "Rocket",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    gradient: "from-purple-600 to-purple-500",
  },
};

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function CheckoutProgressSteps({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      <Link href="/cart" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            currentStep > 1 ? "bg-accent-green text-white" : currentStep === 1 ? "bg-accent-teal text-white" : "bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500"
          }`}
        >
          {currentStep > 1 ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            "১"
          )}
        </div>
        <span className={`text-sm font-bengali ${currentStep > 1 ? "font-medium text-accent-green" : currentStep === 1 ? "font-bold text-accent-teal" : "text-gray-400 dark:text-gray-500"}`}>
          কার্ট
        </span>
      </Link>
      <div className={`mx-3 h-px w-12 sm:w-20 ${currentStep > 1 ? "bg-accent-green" : "bg-gray-300 dark:bg-gray-600"}`} />
      <Link href="/checkout" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            currentStep > 2 ? "bg-accent-green text-white" : currentStep === 2 ? "bg-accent-teal text-white" : "bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500"
          }`}
        >
          {currentStep > 2 ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            "২"
          )}
        </div>
        <span className={`text-sm font-bengali ${currentStep > 2 ? "font-medium text-accent-green" : currentStep === 2 ? "font-bold text-accent-teal" : "text-gray-400 dark:text-gray-500"}`}>
          চেকআউট
        </span>
      </Link>
      <div className={`mx-3 h-px w-12 sm:w-20 ${currentStep > 2 ? "bg-accent-green" : "bg-gray-300 dark:bg-gray-600"}`} />
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            currentStep === 3 ? "bg-accent-teal text-white" : "bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500"
          }`}
        >
          ৩
        </div>
        <span className={`text-sm font-bengali font-bold ${currentStep === 3 ? "text-accent-teal" : "text-gray-400 dark:text-gray-500"}`}>
          সম্পন্ন
        </span>
      </div>
    </div>
  );
}

function formatPrice(amount: number) {
  return `৳${amount.toLocaleString("bn-BD")}`;
}

function PaymentDetailsCard({ pricing, isCod }: { pricing: OrderPricing; isCod?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm">
      <div className="bg-accent-teal/5 dark:bg-accent-teal/10 px-5 py-4 border-b border-gray-100 dark:border-[#1a1a1a]">
        <h2 className="text-base font-bold text-black dark:text-white font-bengali">পেমেন্ট বিবরণ</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-bengali">
          আপনার অর্ডারের সম্পূর্ণ মূল্য বিস্তারিত
        </p>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400 font-bengali">পণ্যের মূল্য (সাবটোটাল)</span>
            {isCod && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bengali mt-0.5">ডেলিভারির সময় নগদ পরিশোধ করবেন</p>
            )}
          </div>
          <span className="font-semibold text-black dark:text-white">{formatPrice(pricing.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm py-3 px-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <div>
            <span className="text-amber-800 dark:text-amber-200 font-bengali font-medium">ডেলিভারি চার্জ</span>
            {isCod && (
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bengali mt-0.5">অনলাইনে প্রথমে পরিশোধ করুন (bKash/Nagad/Rocket)</p>
            )}
          </div>
          <span className="font-bold text-amber-700 dark:text-amber-300">{formatPrice(pricing.deliveryCharge)}</span>
        </div>
        {pricing.discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-bengali">ডিসকাউন্ট</span>
            <span className="font-medium text-green-600 dark:text-green-400">-{formatPrice(pricing.discount)}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-200 dark:border-[#222] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-black dark:text-white font-bengali">মোট পরিশোধ</span>
            <span className="text-2xl font-bold text-accent-teal">{formatPrice(pricing.total)}</span>
          </div>
          {isCod && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali mt-1">
              = ডেলিভারি চার্জ (অনলাইন) + সাবটোটাল (ডেলিভারিতে নগদ)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MobilePaymentOption({
  method,
  selected,
  onSelect,
}: {
  method: "bkash" | "nagad" | "rocket";
  selected: boolean;
  onSelect: () => void;
}) {
  const config = PAYMENT_CONFIG[method];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
        selected
          ? `${config.border} ${config.bg} ring-2 ring-offset-1 dark:ring-offset-black`
          : "border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#2a2a2a]"
      }`}
      style={selected ? { ["--tw-ring-color" as string]: method === "bkash" ? "#ec4899" : method === "nagad" ? "#f97316" : "#a855f7" } : undefined}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient}`}>
        <span className="text-lg font-bold text-white">{config.label[0]}</span>
      </div>
      <span className={`text-sm font-semibold ${selected ? config.color : "text-gray-700 dark:text-gray-300"}`}>
        {config.label}
      </span>
    </button>
  );
}

function VerificationForm({
  method,
  orderId,
  amount,
  merchantNumber,
  isDeliveryCharge,
}: {
  method: "bkash" | "nagad" | "rocket";
  orderId: string;
  amount: number;
  merchantNumber?: string;
  isDeliveryCharge?: boolean;
}) {
  const router = useRouter();
  const config = PAYMENT_CONFIG[method];
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isValid = senderNumber.trim() !== "" && transactionId.trim() !== "";
  const displayNumber = merchantNumber || DEFAULT_MERCHANT;

  function handleCopy() {
    navigator.clipboard?.writeText(displayNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const result = await verifyPayment(orderId, senderNumber.trim(), transactionId.trim());
      if (result.success) {
        router.push(`/order-confirmed?orderId=${orderId}`);
      } else {
        setError(result.message || "পেমেন্ট ভেরিফাই করতে ব্যর্থ। আবার চেষ্টা করুন।");
      }
    } catch {
      setError("পেমেন্ট ভেরিফাই করতে ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-xl font-bold text-white">{config.label[0]}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{config.label}</h3>
            <p className="text-sm text-white/80 font-bengali">
              {config.label} মোবাইল ওয়ালেট ব্যবহার করে পেমেন্ট সম্পন্ন করুন
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Step-by-step guide */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4">
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 font-bengali mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs">১</span>
            কীভাবে পেমেন্ট করবেন?
          </h4>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200 font-bengali list-decimal list-inside">
            <li>নিচের নাম্বারে <strong>{formatPrice(amount)}</strong> টাকা সেন্ড মানি করুন</li>
            <li>পেমেন্ট সম্পন্ন হলে Transaction ID/TrxID পাবেন</li>
            <li>নিচের ফর্মে আপনার {config.label} নাম্বার ও TrxID দিন</li>
            <li>যাচাই বাটনে ক্লিক করুন</li>
          </ol>
        </div>

        {/* Merchant details */}
        <div className="rounded-xl bg-gray-50 dark:bg-[#111] p-5 space-y-4 border border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-bengali">এই নাম্বারে টাকা পাঠান</p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-green-600 dark:text-green-400 font-bengali">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                  <span className="font-bengali">নাম্বার কপি করুন</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 py-2">
            <span className={`text-2xl sm:text-3xl font-bold tracking-wider ${config.color}`}>{displayNumber}</span>
          </div>
          <p className="text-center text-lg font-bold text-black dark:text-white">
            {formatPrice(amount)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400 font-bengali">টাকা</span>
          </p>
          {isDeliveryCharge && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-bengali">
              এটি ডেলিভারি চার্জ। সাবটোটাল ডেলিভারির সময় নগদ পরিশোধ করবেন।
            </p>
          )}
        </div>

        {/* Verification form */}
        <div>
          <h4 className="mb-2 text-base font-bold text-black dark:text-white font-bengali">পেমেন্ট যাচাইকরণ</h4>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-bengali leading-relaxed">
            {formatPrice(amount)} টাকা পাঠানোর পর নিচের তথ্য দিন। Transaction ID {config.label} অ্যাপে পেমেন্ট সফল হওয়ার পর দেখা যাবে।
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="senderNumber" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300 font-bengali">
                আপনার {config.label} নাম্বার <span className="text-red-500">*</span>
              </label>
              <input
                id="senderNumber"
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-3 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-accent-teal font-bengali"
                required
              />
            </div>
            <div>
              <label htmlFor="transactionId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300 font-bengali">
                Transaction ID / TrxID <span className="text-red-500">*</span>
              </label>
              <input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="যেমন: TXN123456789 অথবা TrxID123456"
                className="w-full rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-3 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-accent-teal font-bengali"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-bengali">
                {config.label} অ্যাপে পেমেন্ট সম্পন্ন হলে SMS বা অ্যাপে TrxID দেখা যাবে
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 font-bengali" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${config.gradient} px-6 py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loading ? (
                <>
                  <Spinner size="md" className="text-white" />
                  <span className="font-bengali">যাচাই হচ্ছে...</span>
                </>
              ) : (
                <span className="font-bengali">পেমেন্ট যাচাই করুন</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CodFlow({
  orderId,
  pricing,
  paymentOpts,
  merchantNumbers,
}: {
  orderId: string;
  pricing: OrderPricing;
  paymentOpts: { bkash: boolean; nagad: boolean; rocket: boolean };
  merchantNumbers: { bkash: string; nagad: string; rocket: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<"bkash" | "nagad" | "rocket" | null>(null);

  const enabledOnlineMethods = (["bkash", "nagad", "rocket"] as const).filter(
    (m) => paymentOpts[m]
  );

  async function handleConfirmCod() {
    setLoading(true);
    setError("");
    try {
      const result = await confirmCodOrder(orderId);
      if (result.success) {
        router.push(`/order-confirmed?orderId=${orderId}`);
      } else {
        setError(result.message || "অর্ডার কনফার্ম করতে ব্যর্থ। আবার চেষ্টা করুন।");
      }
    } catch {
      setError("অর্ডার কনফার্ম করতে ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const deliveryDateFrom = new Date();
  deliveryDateFrom.setDate(deliveryDateFrom.getDate() + 3);
  const deliveryDateTo = new Date();
  deliveryDateTo.setDate(deliveryDateTo.getDate() + 5);
  const deliveryRange = `${deliveryDateFrom.getDate()}–${deliveryDateTo.getDate()} ${deliveryDateTo.toLocaleDateString("bn-BD", { month: "long", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      {/* COD payment flow: ১. ডেলিভারি চার্জ অনলাইনে প্রথমে | ২. সাবটোটাল ডেলিভারিতে নগদ */}
      <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm">
        <div className="bg-orange-50 dark:bg-orange-900/10 px-5 py-4 border-b border-orange-100 dark:border-orange-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <BanknoteIcon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white font-bengali">ক্যাশ অন ডেলিভারি</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bengali mt-0.5">
                দুই ধাপে পেমেন্ট: (১) ডেলিভারি চার্জ এখনই অনলাইনে পরিশোধ করুন। (২) পণ্য হাতে পেয়ে সাবটোটাল নগদ দিন।
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-4 px-4 rounded-xl bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-900/30">
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-200 font-bengali flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs">১</span>
                এখনই অনলাইনে পরিশোধ করুন
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 font-bengali mt-1 ml-8">bKash, Nagad বা Rocket দিয়ে</p>
            </div>
            <span className="text-xl font-bold text-green-700 dark:text-green-300">{formatPrice(pricing.deliveryCharge)}</span>
          </div>
          <div className="flex items-center justify-between py-4 px-4 rounded-xl bg-gray-50 dark:bg-[#111] border-2 border-gray-200 dark:border-[#1a1a1a]">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 font-bengali flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 dark:bg-gray-600 text-white text-xs">২</span>
                ডেলিভারির সময় নগদ পরিশোধ
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-bengali mt-1 ml-8">পণ্য হাতে পেয়ে কুরিয়ারকে দিন</p>
            </div>
            <span className="text-xl font-bold text-black dark:text-white">{formatPrice(pricing.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 dark:border-[#1a1a1a]">
            <span className="text-sm font-bold text-black dark:text-white font-bengali">সর্বমোট</span>
            <span className="text-lg font-bold text-accent-teal">{formatPrice(pricing.total)}</span>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 px-4 py-3 mt-2">
            <p className="text-xs text-blue-800 dark:text-blue-200 font-bengali">
              📦 আনুমানিক ডেলিভারি: ৩–৫ কর্মদিবস ({deliveryRange})
            </p>
          </div>
        </div>
      </div>

      {/* ডেলিভারি চার্জ অনলাইনে প্রথমে - only enabled methods */}
      {enabledOnlineMethods.length > 0 && (
        <div className="rounded-2xl border-2 border-accent-teal/30 dark:border-accent-teal/40 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-accent-teal/5 dark:bg-accent-teal/10 border-b border-accent-teal/20">
            <h4 className="text-base font-bold text-black dark:text-white font-bengali">
              ডেলিভারি চার্জ অনলাইনে পরিশোধ করুন (প্রথমে)
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-bengali">
              নিচ থেকে আপনার পছন্দের পেমেন্ট পদ্ধতি বেছে নিয়ে {formatPrice(pricing.deliveryCharge)} ডেলিভারি চার্জ পরিশোধ করুন। 
              পেমেন্টের পর নিচে Transaction ID দিয়ে যাচাই করুন।
            </p>
          </div>
          <div className="p-5">
            <div className={`grid gap-3 ${enabledOnlineMethods.length === 3 ? "grid-cols-3" : enabledOnlineMethods.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {enabledOnlineMethods.map((m) => (
                <MobilePaymentOption
                  key={m}
                  method={m}
                  selected={selectedOnlineMethod === m}
                  onSelect={() => setSelectedOnlineMethod(selectedOnlineMethod === m ? null : m)}
                />
              ))}
            </div>

            {selectedOnlineMethod && (
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-[#1a1a1a]">
                <VerificationForm
                  method={selectedOnlineMethod}
                  orderId={orderId}
                  amount={pricing.deliveryCharge}
                  merchantNumber={merchantNumbers[selectedOnlineMethod] || undefined}
                  isDeliveryCharge
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm COD button - বিকল্প: ডেলিভারি চার্জ অনলাইনে না দিলে */}
      {!selectedOnlineMethod && (
        <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
          <div className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#1a1a1a]">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-bengali">
              <strong>বিকল্প:</strong> ডেলিভারি চার্জ এখনই অনলাইনে না দিলে, নিচে ক্লিক করে অর্ডার নিশ্চিত করুন। 
              ডেলিভারির সময় ডেলিভারি চার্জসহ সাবটোটাল মোট টাকা নগদ পরিশোধ করবেন।
            </p>
          </div>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 px-4 py-2.5 text-sm text-center text-red-600 dark:text-red-400 font-bengali" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirmCod}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black dark:bg-white px-6 py-4 text-base font-semibold text-white dark:text-black transition-all hover:bg-[#1a1a1a]/80 dark:hover:bg-white/80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 font-bengali"
          >
            {loading ? (
              <>
                <Spinner size="md" className="text-white dark:text-black" />
                নিশ্চিত হচ্ছে...
              </>
            ) : (
              "ডেলিভারিতে সব টাকা দেব — অর্ডার নিশ্চিত করুন"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ValidatePaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("transaction") || "";
  const method = (searchParams.get("method") || "cod") as PaymentMethod;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [settings, setSettings] = useState<{ payment?: PaymentSettings } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const paymentOpts = {
    cod: settings?.payment?.codEnabled !== false,
    bkash: settings?.payment?.bkashEnabled === true,
    nagad: settings?.payment?.nagadEnabled === true,
    rocket: settings?.payment?.rocketEnabled === true,
  };

  const merchantNumbers = {
    bkash: settings?.payment?.bkashNumber || DEFAULT_MERCHANT,
    nagad: settings?.payment?.nagadNumber || DEFAULT_MERCHANT,
    rocket: settings?.payment?.rocketNumber || DEFAULT_MERCHANT,
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setSettings(json.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!orderId) {
      setError("অর্ডার আইডি পাওয়া যায়নি।");
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const result = await getOrder(orderId);
        if (result.success && result.data) {
          setOrder(result.data as unknown as OrderData);
        } else {
          setError(result.message || "অর্ডার লোড করতে ব্যর্থ।");
        }
      } catch {
        setError("অর্ডার লোড করতে ব্যর্থ। আবার চেষ্টা করুন।");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-accent-teal" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bengali">অর্ডার লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400 font-bengali">সমস্যা হয়েছে</h2>
          <p className="mb-6 text-sm text-red-600 dark:text-red-400/80 font-bengali">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-red-200 dark:border-red-900/30 px-6 py-2.5 text-sm font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 font-bengali"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </main>
    );
  }

  const pricing = order.pricing;
  const isCod = method === "cod";

  return (
    <main className="min-h-[60vh] pb-48 lg:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Progress steps - same as cart/checkout: কার্ট | চেকআউট | সম্পন্ন */}
        <CheckoutProgressSteps currentStep={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-semibold font-bengali mb-4">
            <span>Order ID</span>
            <span className="font-mono">{orderId}</span>
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl font-bengali">
            পেমেন্ট পেজ
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-bengali max-w-lg mx-auto leading-relaxed">
            {isCod
              ? "আপনার অর্ডার সফল হয়েছে। ডেলিভারি চার্জ অনলাইনে পরিশোধ করুন অথবা ডেলিভারিতে সব টাকা নগদ দেবেন।"
              : "পেমেন্ট সম্পন্ন করুন এবং নিচে আপনার লেনদেনের তথ্য দিন।"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment details - ডেলিভারি চার্জ prominently shown */}
          <PaymentDetailsCard pricing={pricing} isCod={isCod} />

          {/* Flow-specific content */}
          {isCod ? (
            <CodFlow
              orderId={orderId}
              pricing={pricing}
              paymentOpts={paymentOpts}
              merchantNumbers={merchantNumbers}
            />
          ) : (
            <VerificationForm
              method={method as "bkash" | "nagad" | "rocket"}
              orderId={orderId}
              amount={pricing.total}
              merchantNumber={merchantNumbers[method as "bkash" | "nagad" | "rocket"]}
            />
          )}
        </div>

        {/* Footer - Help & Links */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#1a1a1a] space-y-6">
          <div className="rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5">
            <h4 className="text-sm font-bold text-black dark:text-white font-bengali mb-2">সহায়তা</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 font-bengali space-y-1.5">
              <li>• অর্ডার ট্র্যাক করতে: <Link href="/track-order" className="text-accent-teal hover:underline">ট্র্যাক অর্ডার</Link></li>
              <li>• Transaction ID পাচ্ছেন না? bKash/Nagad/Rocket অ্যাপে পেমেন্ট সম্পন্ন হলে SMS বা অ্যাপের হিস্টোরিতে দেখা যাবে</li>
              <li>• কোনো সমস্যা? ফোন বা ইমেইলে যোগাযোগ করুন</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/" className="font-medium text-accent-teal hover:underline font-bengali">
              হোমে ফিরে যান
            </Link>
            <Link href="/shop" className="font-medium text-gray-600 dark:text-gray-400 hover:text-accent-teal transition font-bengali">
              শপিং চালিয়ে যান
            </Link>
            <Link href="/track-order" className="font-medium text-gray-600 dark:text-gray-400 hover:text-accent-teal transition font-bengali">
              অর্ডার ট্র্যাক করুন
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ValidatePaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" className="text-accent-teal" />
        </main>
      }
    >
      <ValidatePaymentContent />
    </Suspense>
  );
}
