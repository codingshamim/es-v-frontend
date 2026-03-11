"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, CartItem } from "@/lib/cart";
import { Button } from "@/components/ui/Button";

function formatPrice(amount: number) {
  return `BDT ${amount.toLocaleString("en-US")}`;
}

function getDiscountPercent(original: number, current: number) {
  if (original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

function DeleteModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <svg
              className="h-7 w-7 text-accent-red"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-black dark:text-white font-bengali">
            আইটেম মুছে ফেলবেন?
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 font-bengali">
            এই আইটেমটি আপনার কার্ট থেকে সরানো হবে।
          </p>
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onCancel}
              className="font-bengali"
            >
              বাতিল
            </Button>
            <button
              onClick={onConfirm}
              className="w-full cursor-pointer rounded-lg bg-accent-red px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 font-bengali"
            >
              মুছে ফেলুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}) {
  const discount = getDiscountPercent(item.originalPrice, item.unitPrice);
  const hasDiscount = discount > 0;

  return (
    <div className="group relative rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-4 transition-shadow hover:shadow-md">
      {/* Desktop delete button */}
      <button
        onClick={() => onRemove(item.cartItemId)}
        className="absolute right-3 top-3 hidden rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-accent-red dark:hover:bg-red-900/20 sm:block"
        aria-label="Remove item"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>

      <div className="flex gap-4">
        {/* Product image */}
        <Link href={`/product/${item.productId}`} className="shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl sm:h-32 sm:w-32">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
            />
              {hasDiscount && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-accent-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{discount}%
                </span>
              )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Link href={`/product/${item.productId}`}>
              <h3 className="line-clamp-2 text-sm font-semibold text-black dark:text-white sm:text-base font-bengali">
                {item.name}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-bengali">
              সাইজ: {item.size} | কালার: {item.colorName}
            </p>
          </div>

          <div className="mt-2 flex items-end justify-between gap-2">
            {/* Price */}
            <div>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(item.originalPrice)}
                </span>
              )}
              <p className="text-lg font-bold text-black dark:text-white sm:text-xl">
                {formatPrice(item.unitPrice)}
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-[#1a1a1a]">
              <button
                onClick={() =>
                  onUpdateQuantity(item.cartItemId, item.quantity - 1)
                }
                disabled={item.quantity <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-l-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-[#1a1a1a]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14"
                  />
                </svg>
              </button>
              <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-black dark:text-white">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  onUpdateQuantity(item.cartItemId, item.quantity + 1)
                }
                className="flex h-8 w-8 items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1a1a1a]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile delete button */}
          <button
            onClick={() => onRemove(item.cartItemId)}
            className="mt-3 flex items-center gap-1 self-start text-xs text-gray-400 transition-colors hover:text-accent-red sm:hidden font-bengali"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <main className="min-h-[60vh] pb-48 lg:pb-12">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gray-50 dark:bg-[#0a0a0a]">
          <svg
            className="h-14 w-14 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-black dark:text-white font-bengali">
          আপনার কার্ট খালি
        </h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 font-bengali">
          আপনার পছন্দের প্রোডাক্ট যোগ করুন
        </p>
        <Link href="/shop">
          <Button variant="secondary" size="sm" className="font-bengali">
            এখনই শপিং শুরু করুন
          </Button>
        </Link>
      </div>
    </main>
  );
}

function OrderSummary({
  subtotal,
  savings,
  itemCount,
  totalQuantity,
  deliveryCharge,
  couponDiscount = 0,
}: {
  subtotal: number;
  savings: number;
  itemCount: number;
  totalQuantity: number;
  deliveryCharge: number;
  couponDiscount?: number;
}) {
  const total = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const totalSavings = savings + couponDiscount;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5">
      <h2 className="mb-4 text-lg font-bold text-black dark:text-white font-bengali">
        অর্ডার সামারি
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 font-bengali">
            সাবটোটাল ({itemCount} পণ্য, মোট {totalQuantity} পিস)
          </span>
          <span className="font-medium text-black dark:text-white">
            {formatPrice(subtotal)}
          </span>
        </div>

        {savings > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-bengali">
              প্রোডাক্ট ডিসকাউন্ট
            </span>
            <span className="font-medium text-black dark:text-white">
              -{formatPrice(savings)}
            </span>
          </div>
        )}

        {couponDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-bengali">
              কুপন ডিসকাউন্ট
            </span>
            <span className="font-medium text-black dark:text-white">
              -{formatPrice(couponDiscount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 font-bengali">
            ডেলিভারি চার্জ
          </span>
          <span className="font-medium text-black dark:text-white">
            {formatPrice(deliveryCharge)}
          </span>
        </div>

        <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-black dark:text-white font-bengali">
              মোট
            </span>
            <span className="text-xl font-bold text-black dark:text-white">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {totalSavings > 0 && (
        <div className="mt-4 rounded-xl bg-black/5 dark:bg-white/10 border border-gray-200 dark:border-[#1a1a1a] px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-black dark:text-white font-bengali">
            আপনি সেভ করছেন {formatPrice(totalSavings)}!
          </p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <Link href="/checkout" className="block">
          <Button variant="secondary" fullWidth className="font-bengali">
            চেকআউট করুন
          </Button>
        </Link>
        <Link href="/shop" className="block">
          <Button variant="outline" fullWidth className="font-bengali">
            শপিং চালিয়ে যান
          </Button>
        </Link>
      </div>

      {/* Trust badges */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-[#111]">
            <svg
              className="h-5 w-5 text-black dark:text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-bengali">
            সিকিউর
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-[#111]">
            <svg
              className="h-5 w-5 text-black dark:text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-bengali">
            ফ্রি ডেলিভারি
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-[#111]">
            <svg
              className="h-5 w-5 text-black dark:text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-bengali">
            ইজি রিটার্ন
          </span>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_DELIVERY_CHARGE = 120;

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartSavings,
    getCartCount,
  } = useCart();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const totalQuantity = getCartCount();
  const itemCount = items.length;
  const deliveryCharge = DEFAULT_DELIVERY_CHARGE;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("কুপন কোড লিখুন");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid && data.discount != null) {
        setAppliedCoupon({ code: data.code || code, discount: data.discount });
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || "কুপন প্রয়োগ করা যায়নি");
      }
    } catch {
      setCouponError("কুপন যাচাই করতে ব্যর্থ");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  function handleDeleteClick(cartItemId: string) {
    setDeleteTarget(cartItemId);
  }

  function confirmDelete() {
    if (deleteTarget) {
      removeFromCart(deleteTarget);
      setDeleteTarget(null);
    }
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <>
      <main className="min-h-[60vh] pb-48 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-0">
            {/* Step 1 - কার্ট (current) */}
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center dark:bg-white dark:text-black justify-center rounded-full bg-black text-white text-sm font-bold">
                  ১
                </div>
                <span className="text-sm font-bold text-black dark:text-white  font-bengali">
                  কার্ট
                </span>
            </div>

            <div className="mx-3 h-px w-12 bg-gray-300 dark:bg-gray-600 sm:w-20" />

            {/* Step 2 - চেকআউট (upcoming, tab) */}
            <Link href="/checkout" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 text-sm font-bold">
                ২
              </div>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 font-bengali">চেকআউট</span>
            </Link>

            <div className="mx-3 h-px w-12 bg-gray-300 dark:bg-gray-600 sm:w-20" />

            {/* Step 3 - সম্পন্ন (upcoming, tab) */}
            <Link href="/order-confirmed" className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 text-sm font-bold">
                ৩
              </div>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 font-bengali">সম্পন্ন</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            {/* Mobile item count */}
            <h1 className="text-lg font-bold text-black dark:text-white sm:hidden font-bengali">
              {itemCount}টি আইটেম
            </h1>
            {/* Desktop header */}
            <h1 className="hidden text-2xl font-bold text-black dark:text-white sm:block font-bengali">
              কার্টে আইটেম ({itemCount})
            </h1>
            <button
              onClick={clearCart}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-accent-red dark:text-gray-400 dark:hover:bg-red-900/20 font-bengali"
            >
              সব মুছুন
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart items column */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    onRemove={handleDeleteClick}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>

              {/* Coupon section */}
              <div className="mt-6 rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-4">
                <h3 className="mb-3 text-sm font-semibold text-black dark:text-white font-bengali">
                  কুপন কোড
                </h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 px-4 py-2.5">
                    <span className="text-sm font-medium text-accent-green font-bengali">
                      {appliedCoupon.code} — {formatPrice(appliedCoupon.discount)} ডিসকাউন্ট
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-medium text-gray-500 hover:text-accent-red dark:text-gray-400 dark:hover:text-red-400 transition-colors font-bengali"
                    >
                      সরান
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="কুপন কোড লিখুন"
                        className="flex-1 rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#111] px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-black/40 dark:focus:border-white/40 font-bengali"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-bengali"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? "..." : "প্রয়োগ"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-bengali">
                        {couponError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <OrderSummary
                  subtotal={subtotal}
                  savings={savings}
                  itemCount={itemCount}
                  totalQuantity={totalQuantity}
                  deliveryCharge={deliveryCharge}
                  couponDiscount={couponDiscount}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-[#1a1a1a] bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
              মোট
            </p>
            <p className="text-lg font-bold text-black dark:text-white">
              {formatPrice(total)}
            </p>
            {savings + couponDiscount > 0 && (
              <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bengali">
                সেভ {formatPrice(savings + couponDiscount)}
              </p>
            )}
          </div>
          <Link href="/checkout" className="flex-1">
            <Button variant="secondary" fullWidth className="font-bengali">
              চেকআউট করুন
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
