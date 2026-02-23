"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrder, verifyPayment, confirmCodOrder } from "@/app/actions/orders";
import { Spinner } from "@/components/ui/Spinner";

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

const MERCHANT_NUMBER = "01994844761";

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

const PROGRESS_STEPS = [
  { label: "কার্ট", icon: CartIcon },
  { label: "চেকআউট", icon: CheckoutIcon },
  { label: "পেমেন্ট", icon: PaymentIcon },
  { label: "নিশ্চিত", icon: ConfirmIcon },
];

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function CheckoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function ConfirmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function ProgressSteps({ activeStep }: { activeStep: number }) {
  return (
    <div className="mx-auto mb-8 flex max-w-lg items-center justify-between">
      {PROGRESS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeStep;
        const isCompleted = i < activeStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "bg-accent-teal text-white"
                    : isCompleted
                      ? "bg-accent-teal/20 text-accent-teal"
                      : "bg-gray-100 text-gray-400 dark:bg-[#1a1a1a] dark:text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium font-bengali ${
                  isActive ? "text-accent-teal" : isCompleted ? "text-accent-teal/70" : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-8 sm:w-12 ${
                  isCompleted ? "bg-accent-teal/40" : "bg-gray-200 dark:bg-[#1a1a1a]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentDetailsCard({ pricing }: { pricing: OrderPricing }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
      <h2 className="mb-4 text-lg font-bold text-black dark:text-white font-bengali">পেমেন্ট বিস্তারিত</h2>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 font-bengali">পণ্যের মূল্য</span>
          <span className="font-medium text-black dark:text-white">BDT {pricing.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 font-bengali">ডেলিভারি চার্জ</span>
          <span className="font-medium text-black dark:text-white">BDT {pricing.deliveryCharge.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-black dark:text-white font-bengali">মোট টাকা</span>
            <span className="text-xl font-bold text-accent-teal">BDT {pricing.total.toFixed(2)}</span>
          </div>
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
}: {
  method: "bkash" | "nagad" | "rocket";
  orderId: string;
  amount: number;
}) {
  const router = useRouter();
  const config = PAYMENT_CONFIG[method];
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = senderNumber.trim() !== "" && transactionId.trim() !== "";

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
    <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] overflow-hidden">
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
        {/* QR Code placeholder */}
        <div className="flex flex-col items-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111] p-4">
            <div className="text-center">
              <svg className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
              </svg>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bengali leading-tight">
                ভার্চুয়াল পেমেন্ট করতে QR কোড স্ক্যান করুন
              </p>
            </div>
          </div>
        </div>

        {/* Merchant details */}
        <div className="rounded-xl bg-gray-50 dark:bg-[#111] p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-bengali">এই নাম্বারে টাকা পাঠান:</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl font-bold tracking-wider ${config.color}`}>{MERCHANT_NUMBER}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(MERCHANT_NUMBER)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors"
              title="Copy number"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
            </button>
          </div>
          <p className="text-center text-sm font-semibold text-black dark:text-white">
            BDT {amount.toFixed(2)} <span className="font-bengali">টাকা</span>
          </p>
        </div>

        {/* Verification form */}
        <div>
          <h4 className="mb-2 text-base font-bold text-black dark:text-white font-bengali">পেমেন্ট যাচাইকরণ</h4>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-bengali leading-relaxed">
            বিকাশ/নগদ বা আপনার মোবাইল ফিন্যান্সের মাধ্যমে BDT {amount.toFixed(2)} টাকা পাঠানোর পর, নিচে আপনার
            লেনদেনের তথ্যটি দিন, যাতে আমরা অর্ডারটি নিশ্চিত করতে পারি।
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
              <label htmlFor="transactionId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TXN123456789"
                className="w-full rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-3 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-accent-teal"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 font-bengali" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${config.gradient} px-6 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loading ? (
                <>
                  <Spinner size="md" className="text-white" />
                  <span className="font-bengali">যাচাই হচ্ছে...</span>
                </>
              ) : (
                "Verify Payment"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CodFlow({ orderId, pricing }: { orderId: string; pricing: OrderPricing }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<"bkash" | "nagad" | "rocket" | null>(null);

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

  return (
    <div className="space-y-6">
      {/* COD confirmation card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <BanknoteIcon className="h-8 w-8 text-accent-green" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Cash On Delivery</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bengali leading-relaxed">
          আপনার অর্ডার নিশ্চিত হয়েছে। পণ্য পাওয়ার সময় টাকা দিন।
        </p>
      </div>

      {/* Online payment option */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
        <h4 className="mb-2 text-base font-bold text-black dark:text-white font-bengali">
          ডেলিভারি চার্জ অনলাইন পরিশোধ করুন
        </h4>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-bengali leading-relaxed">
          জানুয়ার কবে BDT {pricing.deliveryCharge.toFixed(2)} টাকা ডেলিভারি চার্জ আপনার পছন্দের মোবাইল পেমেন্টের মাধ্যমে
          জমা পরিশোধ করুন।
        </p>

        <div className="mb-5 grid grid-cols-3 gap-3">
          {(["bkash", "nagad", "rocket"] as const).map((m) => (
            <MobilePaymentOption
              key={m}
              method={m}
              selected={selectedOnlineMethod === m}
              onSelect={() => setSelectedOnlineMethod(selectedOnlineMethod === m ? null : m)}
            />
          ))}
        </div>

        {selectedOnlineMethod && (
          <div className="mt-4">
            <VerificationForm method={selectedOnlineMethod} orderId={orderId} amount={pricing.deliveryCharge} />
          </div>
        )}
      </div>

      {/* Confirm COD button */}
      {!selectedOnlineMethod && (
        <div>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 px-4 py-2.5 text-sm text-center text-red-600 dark:text-red-400 font-bengali" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirmCod}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black dark:bg-white px-6 py-3.5 text-base font-semibold text-white dark:text-black transition-all hover:bg-[#1a1a1a]/80 dark:hover:bg-white/80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 font-bengali"
          >
            {loading ? (
              <>
                <Spinner size="md" className="text-white dark:text-black" />
                নিশ্চিত হচ্ছে...
              </>
            ) : (
              "অর্ডার নিশ্চিত করুন"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <main className="min-h-[60vh] pb-12">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Progress steps */}
        <ProgressSteps activeStep={2} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl font-bengali">পেমেন্ট যাচাইকরণ</h1>
          <p className="mt-2 text-sm text-accent-teal font-medium">Order ID: {orderId}</p>
        </div>

        <div className="space-y-6">
          {/* Payment details */}
          <PaymentDetailsCard pricing={pricing} />

          {/* Flow-specific content */}
          {isCod ? (
            <CodFlow orderId={orderId} pricing={pricing} />
          ) : (
            <VerificationForm method={method as "bkash" | "nagad" | "rocket"} orderId={orderId} amount={pricing.total} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-bengali">
            সমস্যা হচ্ছে? আমাদের সাথে যোগাযোগ করুন: +৮৮০ ১XXX-XXXXXX
          </p>
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
