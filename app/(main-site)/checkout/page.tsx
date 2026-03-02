"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { createOrder } from "@/app/actions/orders";
import { getAddresses } from "@/app/actions/addresses";
import {
  getDistricts,
  getCitiesForDistrict,
} from "@/lib/data/bangladesh-locations";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { CreateOrderPayload } from "@/app/actions/orders";

function formatPrice(amount: number) {
  return `৳${amount.toLocaleString("bn-BD")}`;
}

const DEFAULT_DHAKA = 120;
const DEFAULT_OUTSIDE = 150;
const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;

interface SiteSettings {
  shipping?: { dhakaCharge?: number; outsideDhakaCharge?: number; freeShippingMin?: number };
  payment?: {
    codEnabled?: boolean;
    bkashEnabled?: boolean;
    nagadEnabled?: boolean;
    rocketEnabled?: boolean;
  };
}

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";

interface ShippingForm {
  name: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  address: string;
  notes: string;
}

const initialForm: ShippingForm = {
  name: "",
  phone: "",
  email: "",
  district: "",
  city: "",
  address: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getCartTotal, getCartSavings, getCartCount, clearCart } =
    useCart();

  const [form, setForm] = useState<ShippingForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const orderSuccessRef = useRef(false);

  const districts = useMemo(() => getDistricts(), []);
  const cities = useMemo(
    () => (form.district ? getCitiesForDistrict(form.district) : []),
    [form.district],
  );

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setSiteSettings(json.data);
      })
      .catch(() => {});
  }, []);

  const dhakaCharge = siteSettings?.shipping?.dhakaCharge ?? DEFAULT_DHAKA;
  const outsideCharge = siteSettings?.shipping?.outsideDhakaCharge ?? DEFAULT_OUTSIDE;
  const freeShippingMin = siteSettings?.shipping?.freeShippingMin ?? 0;
  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const itemCount = getCartCount();
  const isDhaka = form.district === "ঢাকা";
  const rawDelivery =
    form.district && (isDhaka ? dhakaCharge : outsideCharge) !== undefined
      ? isDhaka
        ? dhakaCharge
        : outsideCharge
      : 0;
  const deliveryCharge =
    freeShippingMin > 0 && subtotal >= freeShippingMin ? 0 : rawDelivery;
  const total = subtotal + deliveryCharge;

  const paymentOpts = useMemo(() => {
    const p = siteSettings?.payment;
    const cod = p?.codEnabled !== false;
    const bkash = p?.bkashEnabled === true;
    const nagad = p?.nagadEnabled === true;
    const rocket = p?.rocketEnabled === true;
    return { cod, bkash, nagad, rocket };
  }, [siteSettings?.payment]);

  useEffect(() => {
    if (items.length === 0 && !orderSuccessRef.current) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  useEffect(() => {
    if (!session?.user || addressLoaded) return;

    let cancelled = false;
    const user = session.user;

    (async () => {
      try {
        const res = await getAddresses();
        if (cancelled) return;

        const defaultAddr =
          res.success && res.data?.length
            ? res.data.find((a) => a.isDefault) ?? res.data[0]
            : null;

        setForm((prev) => ({
          ...prev,
          name: defaultAddr?.name || user.name || prev.name || "",
          phone: defaultAddr?.phone || (user as { phone?: string }).phone || prev.phone || "",
          email: user.email ?? prev.email,
          district: defaultAddr?.district ?? prev.district ?? "",
          city: defaultAddr?.city ?? prev.city ?? "",
          address: defaultAddr?.address ?? prev.address ?? "",
        }));
      } catch {
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            name: user.name ?? prev.name,
            phone: (user as { phone?: string }).phone ?? prev.phone,
            email: user.email ?? prev.email,
          }));
        }
      } finally {
        if (!cancelled) setAddressLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, addressLoaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const { cod, bkash, nagad, rocket } = paymentOpts;
    const allowed: PaymentMethod =
      cod ? "cod" : bkash ? "bkash" : nagad ? "nagad" : rocket ? "rocket" : "cod";
    const ok =
      (paymentMethod === "cod" && cod) ||
      (paymentMethod === "bkash" && bkash) ||
      (paymentMethod === "nagad" && nagad) ||
      (paymentMethod === "rocket" && rocket);
    if (!ok) setPaymentMethod(allowed);
  }, [paymentOpts, paymentMethod]);

  function updateField(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleDistrictChange(value: string) {
    setForm((prev) => ({ ...prev, district: value, city: "" }));
    if (errors.district) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.district;
        return next;
      });
    }
  }

  function validate(): boolean {
    const e: Partial<Record<keyof ShippingForm, string>> = {};
    if (!form.name.trim()) e.name = "নাম প্রয়োজন";
    if (!form.phone.trim()) {
      e.phone = "ফোন নম্বর প্রয়োজন";
    } else if (!PHONE_REGEX.test(form.phone.trim().replace(/\s/g, ""))) {
      e.phone = "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX)";
    }
    if (!form.district) e.district = "জেলা নির্বাচন করুন";
    if (!form.city) e.city = "শহর/উপজেলা নির্বাচন করুন";
    if (!form.address.trim()) e.address = "ঠিকানা প্রয়োজন";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitOrder() {
    if (!validate()) return;
    setIsSubmitting(true);
    setShowPaymentConfirmModal(false);

    try {
      const payload: CreateOrderPayload = {
        items: items.map((item) => ({
          product: item.productId,
          name: item.name,
          image: item.image,
          size: item.size,
          color: item.color,
          colorName: item.colorName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalPrice: item.originalPrice,
        })),
        shipping: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          district: form.district,
          city: form.city,
          address: form.address.trim(),
          notes: form.notes.trim() || undefined,
        },
        paymentMethod,
      };

      const result = await createOrder(payload);

      if (result.success && result.orderId) {
        orderSuccessRef.current = true;
        clearCart();
        router.push(
          `/validate-payment?transaction=${result.orderId}&method=${paymentMethod}`,
        );
      } else {
        setToast({
          type: "error",
          message: result.message ?? "অর্ডার তৈরি করতে ব্যর্থ। আবার চেষ্টা করুন।",
        });
      }
    } catch {
      setToast({
        type: "error",
        message: "অর্ডার তৈরি করতে ব্যর্থ। আবার চেষ্টা করুন।",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePlaceOrderClick() {
    if (!validate()) return;
    const isEnabled =
      (paymentMethod === "cod" && paymentOpts.cod) ||
      (paymentMethod === "bkash" && paymentOpts.bkash) ||
      (paymentMethod === "nagad" && paymentOpts.nagad) ||
      (paymentMethod === "rocket" && paymentOpts.rocket);
    // Show delivery charge confirmation before payment for all enabled methods
    if (isEnabled) {
      setShowPaymentConfirmModal(true);
    } else {
      submitOrder();
    }
  }

  if (items.length === 0) return null;

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-accent-teal font-bengali";
  const selectClass =
    "w-full rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-2.5 text-sm text-black dark:text-white outline-none transition-colors focus:border-accent-teal font-bengali appearance-none cursor-pointer";
  const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300 font-bengali";
  const errorClass = "mt-1 text-xs text-red-500 font-bengali";

  return (
    <>
      <main className="min-h-[60vh] pb-48 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {/* ── Progress Steps ── */}
          <div className="mb-8 flex items-center justify-center gap-0">
            {/* Step 1 - কার্ট (completed, tab) */}
            <Link href="/cart" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-sm font-medium text-accent-green font-bengali">কার্ট</span>
            </Link>

            <div className="mx-3 h-px w-12 bg-accent-green sm:w-20" />

            {/* Step 2 - চেকআউট (current) */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-teal text-white text-sm font-bold">
                ২
              </div>
              <span className="text-sm font-bold text-accent-teal font-bengali">চেকআউট</span>
            </div>

            <div className="mx-3 h-px w-12 bg-gray-300 dark:bg-gray-600 sm:w-20" />

            {/* Step 3 - সম্পন্ন (upcoming, tab) */}
            <Link href="/order-confirmed" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 text-sm font-bold">
                ৩
              </div>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 font-bengali">সম্পন্ন</span>
            </Link>
          </div>

          {/* ── Toast ── */}
          {toast && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-bengali ${
                toast.type === "success"
                  ? "bg-accent-green/20 text-accent-green border border-accent-green/40"
                  : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}
              role="status"
            >
              {toast.message}
            </div>
          )}

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* ════════════ LEFT COLUMN ════════════ */}
            <div className="lg:col-span-2 space-y-6">
              {/* ── 1. Shipping Information ── */}
              <section className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-teal/10">
                    <svg className="h-5 w-5 text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black dark:text-white font-bengali">
                      ডেলিভারি তথ্য
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                      আপনার ঠিকানা ও যোগাযোগ তথ্য দিন
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* পুরো নাম */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>পুরো নাম *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="আপনার পুরো নাম"
                      className={`${inputClass} ${errors.name ? "border-red-500!" : ""}`}
                    />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>

                  {/* ফোন নম্বর */}
                  <div>
                    <label className={labelClass}>ফোন নম্বর *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className={`${inputClass} ${errors.phone ? "border-red-500!" : ""}`}
                    />
                    {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                  </div>

                  {/* ইমেইল */}
                  <div>
                    <label className={labelClass}>ইমেইল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="email@example.com"
                      className={inputClass}
                    />
                  </div>

                  {/* জেলা */}
                  <div>
                    <label className={labelClass}>জেলা *</label>
                    <select
                      value={form.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className={`${selectClass} ${errors.district ? "border-red-500!" : ""}`}
                    >
                      <option value="">জেলা নির্বাচন করুন</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.district && <p className={errorClass}>{errors.district}</p>}
                  </div>

                  {/* শহর/উপজেলা */}
                  <div>
                    <label className={labelClass}>শহর/উপজেলা *</label>
                    <select
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      disabled={!form.district}
                      className={`${selectClass} ${errors.city ? "border-red-500!" : ""} ${!form.district ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">
                        {form.district ? "শহর/উপজেলা নির্বাচন করুন" : "আগে জেলা নির্বাচন করুন"}
                      </option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && <p className={errorClass}>{errors.city}</p>}
                  </div>

                  {/* সম্পূর্ণ ঠিকানা */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>সম্পূর্ণ ঠিকানা *</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="বাড়ি নং, রোড, ব্লক, সেক্টর ইত্যাদি"
                      rows={3}
                      className={`${inputClass} resize-none ${errors.address ? "border-red-500!" : ""}`}
                    />
                    {errors.address && <p className={errorClass}>{errors.address}</p>}
                  </div>

                  {/* অর্ডার নোট */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>অর্ডার নোট (ঐচ্ছিক)</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন"
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* ── 2. Payment Method ── */}
              <section className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-teal/10">
                    <svg className="h-5 w-5 text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-black dark:text-white font-bengali">
                    পেমেন্ট পদ্ধতি
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* COD */}
                  {paymentOpts.cod && (
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "cod"
                        ? "border-accent-teal bg-accent-teal/5 dark:bg-accent-teal/10"
                        : "border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                      <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-black dark:text-white font-bengali">
                          ক্যাশ অন ডেলিভারি
                        </span>
                        <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 font-bengali">
                          জনপ্রিয়
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন
                      </p>
                    </div>
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${paymentMethod === "cod" ? "border-accent-teal bg-accent-teal" : "border-gray-300 dark:border-gray-600"} flex items-center justify-center`}>
                      {paymentMethod === "cod" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </label>
                  )}

                  {/* bKash */}
                  {paymentOpts.bkash && (
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "bkash"
                        ? "border-accent-teal bg-accent-teal/5 dark:bg-accent-teal/10"
                        : "border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={paymentMethod === "bkash"}
                      onChange={() => setPaymentMethod("bkash")}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/20">
                      <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-black dark:text-white">
                        bKash
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        বিকাশ মোবাইল পেমেন্ট
                      </p>
                    </div>
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${paymentMethod === "bkash" ? "border-accent-teal bg-accent-teal" : "border-gray-300 dark:border-gray-600"} flex items-center justify-center`}>
                      {paymentMethod === "bkash" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </label>
                  )}

                  {/* Nagad */}
                  {paymentOpts.nagad && (
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "nagad"
                        ? "border-accent-teal bg-accent-teal/5 dark:bg-accent-teal/10"
                        : "border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="nagad"
                      checked={paymentMethod === "nagad"}
                      onChange={() => setPaymentMethod("nagad")}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                      <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-black dark:text-white">
                        Nagad
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        নগদ মোবাইল পেমেন্ট
                      </p>
                    </div>
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${paymentMethod === "nagad" ? "border-accent-teal bg-accent-teal" : "border-gray-300 dark:border-gray-600"} flex items-center justify-center`}>
                      {paymentMethod === "nagad" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </label>
                  )}

                  {/* Rocket */}
                  {paymentOpts.rocket && (
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "rocket"
                        ? "border-accent-teal bg-accent-teal/5 dark:bg-accent-teal/10"
                        : "border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="rocket"
                      checked={paymentMethod === "rocket"}
                      onChange={() => setPaymentMethod("rocket")}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-black dark:text-white">
                        Rocket
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        রকেট মোবাইল পেমেন্ট
                      </p>
                    </div>
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${paymentMethod === "rocket" ? "border-accent-teal bg-accent-teal" : "border-gray-300 dark:border-gray-600"} flex items-center justify-center`}>
                      {paymentMethod === "rocket" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </label>
                  )}
                </div>
              </section>

              {/* ── 3. Order Items Preview ── */}
              <section className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-teal/10">
                      <svg className="h-5 w-5 text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-black dark:text-white font-bengali">
                      অর্ডার আইটেম
                    </h2>
                  </div>
                  <Link
                    href="/cart"
                    className="text-xs font-medium text-accent-teal hover:underline font-bengali"
                  >
                    পরিবর্তন করুন
                  </Link>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-sm font-medium text-black dark:text-white font-bengali">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                          সাইজ: {item.size} | কালার: {item.colorName} | ×{item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-black dark:text-white">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ════════════ RIGHT COLUMN ════════════ */}
            <div className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* ── Order Summary ── */}
                <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
                  <h2 className="mb-4 text-lg font-bold text-black dark:text-white font-bengali">
                    অর্ডার সামারি
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-bengali">
                        সাবটোটাল ({itemCount} আইটেম)
                      </span>
                      <span className="font-medium text-black dark:text-white">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-bengali">
                          ডিসকাউন্ট
                        </span>
                        <span className="font-medium text-accent-green">
                          -{formatPrice(savings)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-bengali">
                        ডেলিভারি চার্জ
                      </span>
                      <span className="font-medium text-black dark:text-white">
                        {form.district ? formatPrice(deliveryCharge) : "—"}
                      </span>
                    </div>

                    {form.district && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bengali">
                        {isDhaka ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"} ডেলিভারি
                      </p>
                    )}

                    <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-black dark:text-white font-bengali">
                          সর্বমোট
                        </span>
                        <span className="text-xl font-bold text-accent-teal">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      className="font-bengali"
                      onClick={handlePlaceOrderClick}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          অর্ডার হচ্ছে...
                        </span>
                      ) : (
                        "অর্ডার করুন"
                      )}
                    </Button>

                    <Link href="/cart" className="block">
                      <Button variant="outline" fullWidth className="font-bengali">
                        কার্টে ফিরে যান
                      </Button>
                    </Link>
                  </div>

                  {/* Security notice */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    <span className="font-bengali">সম্পূর্ণ সুরক্ষিত পেমেন্ট</span>
                  </div>
                </div>

                {/* Delivery info card */}
                <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-teal/10">
                      <svg className="h-4.5 w-4.5 text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black dark:text-white font-bengali">
                        দ্রুত ডেলিভারি
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
                        ৩-৫ কর্মদিবসের মধ্যে
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-[#1a1a1a] bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
              সর্বমোট
            </p>
            <p className="text-lg font-bold text-accent-teal">
              {formatPrice(total)}
            </p>
          </div>
          <button
            onClick={handlePlaceOrderClick}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-medium transition-all hover:bg-[#1a1a1a]/80 dark:hover:bg-white/80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 font-bengali"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                অর্ডার হচ্ছে...
              </>
            ) : (
              "অর্ডার করুন"
            )}
          </button>
        </div>
      </div>

      {/* Payment Confirmation Modal - ডেলিভারি চার্জ before pay for all enabled methods */}
      {showPaymentConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowPaymentConfirmModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  paymentMethod === "cod" ? "bg-orange-100 dark:bg-orange-900/30" :
                  paymentMethod === "bkash" ? "bg-pink-100 dark:bg-pink-900/30" :
                  paymentMethod === "nagad" ? "bg-orange-100 dark:bg-orange-900/30" :
                  "bg-purple-100 dark:bg-purple-900/30"
                }`}>
                  <span className={`font-bold text-sm ${
                    paymentMethod === "cod" ? "text-orange-600 dark:text-orange-400" :
                    paymentMethod === "bkash" ? "text-pink-600 dark:text-pink-400" :
                    paymentMethod === "nagad" ? "text-orange-600 dark:text-orange-400" :
                    "text-purple-600 dark:text-purple-400"
                  }`}>
                    {paymentMethod === "cod" ? "COD" : paymentMethod === "bkash" ? "bK" : paymentMethod === "nagad" ? "ন" : "R"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white font-bengali">
                  {paymentMethod === "cod" ? "ক্যাশ অন ডেলিভারি" : paymentMethod === "bkash" ? "bKash" : paymentMethod === "nagad" ? "Nagad" : "Rocket"} – পেমেন্ট নিশ্চিত করুন
                </h3>
              </div>
              <button
                onClick={() => !isSubmitting && setShowPaymentConfirmModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-bengali mb-4">
              {paymentMethod === "cod"
                ? "ডেলিভারি চার্জ প্রথমে অনলাইনে পরিশোধ করুন। ডেলিভারির সময় সাবটোটাল নগদ পরিশোধ করবেন।"
                : "নিচের ডেলিভারি চার্জসহ মোট টাকা পেমেন্ট পেজে পরিশোধ করবেন।"}
            </p>
            <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-bengali">ডেলিভারি চার্জ <span className="text-amber-600 dark:text-amber-400">{paymentMethod === "cod" ? "(অনলাইনে প্রথমে)" : ""}</span></span>
                <span className="font-semibold text-black dark:text-white">{formatPrice(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-bengali">সাবটোটাল <span className="text-amber-600 dark:text-amber-400">{paymentMethod === "cod" ? "(ডেলিভারিতে নগদ)" : ""}</span></span>
                <span className="font-medium text-black dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
                <span className="font-bold text-black dark:text-white font-bengali">সর্বমোট</span>
                <span className="text-xl font-bold text-accent-teal">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                className="font-bengali"
                onClick={() => setShowPaymentConfirmModal(false)}
                disabled={isSubmitting}
              >
                বাতিল
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="font-bengali"
                onClick={submitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    অর্ডার হচ্ছে...
                  </span>
                ) : (
                  "নিশ্চিত করুন"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
