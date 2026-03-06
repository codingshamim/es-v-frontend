"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { InvoicePrintButton } from "@/components/invoice/InvoicePrintButton";
import type { InvoiceOrder } from "@/components/invoice/InvoicePrintButton";
interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
  };
  variant?: string;
  name?: string;
  size?: string;
  colorName?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  changedBy?: string;
  timestamp: string | Date;
}

interface Order {
  _id: string;
  orderId: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    area: string;
    zone?: string;
  };
  paymentMethod: "cod" | "bkash" | "nagad" | "rocket";
  paymentStatus: "pending" | "verified" | "failed";
  payment?: { transactionId?: string; senderNumber?: string };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  couponCode?: string;
  note?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const PAYMENT_STATUSES = ["pending", "verified", "failed"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  shipped:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  verified:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cod: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  bkash: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  nagad:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  rocket:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

function formatDateTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Map API order shape (user, shipping, payment, pricing) to page Order shape */
function normalizeOrder(raw: Record<string, unknown>): Order {
  const user = raw.user as { _id?: string; name?: string; email?: string } | undefined;
  const shipping = (raw.shipping || {}) as Record<string, string>;
  const payment = (raw.payment || {}) as Record<string, string>;
  const pricing = (raw.pricing || {}) as Record<string, number>;
  const items = (raw.items || []) as OrderItem[];
  return {
    _id: String(raw._id),
    orderId: String(raw.orderId ?? ""),
    customer: {
      _id: String(user?._id ?? raw.user ?? ""),
      name: user?.name ?? shipping?.name ?? "Unknown",
      email: user?.email ?? shipping?.email ?? "",
      phone: shipping?.phone ?? "",
    },
    items: items.map((item: OrderItem) => {
      const rawImage = (item as unknown as { image?: string }).image;
      return {
        ...item,
        product: {
          _id:
            typeof item.product === "object" &&
            item.product &&
            "_id" in item.product
              ? String((item.product as { _id: string })._id)
              : String(
                  (item.product as unknown as string | undefined) ?? "",
                ),
          name:
            (item.name as string) ??
            (typeof item.product === "object" &&
            item.product &&
            "name" in item.product
              ? (item.product as { name: string }).name
              : "Product"),
          images: (rawImage
            ? [rawImage]
            : typeof item.product === "object" &&
                item.product &&
                "images" in item.product
              ? (item.product as { images?: string[] }).images
              : undefined) as string[] | undefined,
        },
        quantity: (item.quantity as number) ?? 0,
        price: ((item.unitPrice ?? item.price) as number) ?? 0,
      };
    }),
    shippingAddress: {
      name: shipping?.name ?? "",
      phone: shipping?.phone ?? "",
      address: shipping?.address ?? "",
      city: shipping?.city ?? "",
      area: shipping?.district ?? shipping?.city ?? "",
      zone: shipping?.zone,
    },
    paymentMethod: (payment?.method as Order["paymentMethod"]) ?? "cod",
    paymentStatus: (payment?.status as Order["paymentStatus"]) ?? "pending",
    payment: {
      transactionId: payment?.transactionId as string | undefined,
      senderNumber: payment?.senderNumber as string | undefined,
    },
    status: (raw.status as Order["status"]) ?? "pending",
    subtotal: pricing?.subtotal ?? 0,
    discount: pricing?.discount ?? 0,
    deliveryCharge: pricing?.deliveryCharge ?? 0,
    total: pricing?.total ?? 0,
    couponCode: raw.couponCode as string | undefined,
    note: shipping?.notes as string | undefined,
    statusHistory: (raw.statusHistory as Order["statusHistory"]) ?? [],
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

function orderToInvoiceOrder(o: Order): InvoiceOrder {
  return {
    orderId: o.orderId,
    items: o.items.map((item) => ({
      name: item.product?.name || (item as { name?: string }).name || "Product",
      size: item.size ?? "",
      colorName: item.colorName ?? "",
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? item.price ?? 0,
    })),
    shipping: {
      name: o.shippingAddress?.name ?? "",
      phone: o.shippingAddress?.phone ?? o.customer?.phone ?? "",
      district: o.shippingAddress?.area ?? "",
      city: o.shippingAddress?.city ?? "",
      address: o.shippingAddress?.address ?? "",
    },
    payment: {
      method: o.paymentMethod,
      transactionId: o.payment?.transactionId,
    },
    pricing: {
      subtotal: o.subtotal ?? 0,
      discount: o.discount ?? 0,
      deliveryCharge: o.deliveryCharge ?? 0,
      total: o.total ?? 0,
    },
    createdAt: o.createdAt,
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Order ID required");
      return;
    }
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load order");
          setOrder(null);
          return;
        }
        if (data.success && data.data) {
          setOrder(normalizeOrder(data.data));
        } else {
          setError("Order not found");
          setOrder(null);
        }
      } catch {
        setError("Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: string,
    paymentStatus?: string,
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const body: Record<string, string> = { status: newStatus };
      if (paymentStatus) body.paymentStatus = paymentStatus;
      if (updateNote.trim()) body.note = updateNote.trim();

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to update order");
      }
      const updated = await res.json();
      showToast("Order status updated successfully", "success");
      setUpdateNote("");
      const apiOrder = updated.order ?? updated.data ?? updated;
      setOrder((prev) =>
        prev && prev._id === orderId
          ? normalizeOrder({ ...prev, ...apiOrder } as Record<string, unknown>)
          : prev,
      );
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : "Failed to update order",
        "error",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePaymentStatusUpdate = async (
    orderId: string,
    newPaymentStatus: string,
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const body: Record<string, string> = { paymentStatus: newPaymentStatus };
      if (updateNote.trim()) body.note = updateNote.trim();

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update payment status");
      const updated = await res.json();
      showToast("Payment status updated", "success");
      const apiOrder = updated.order ?? updated.data ?? updated;
      setOrder((prev) =>
        prev && prev._id === orderId && apiOrder
          ? normalizeOrder({ ...prev, ...apiOrder } as Record<string, unknown>)
          : prev,
      );
    } catch {
      showToast("Failed to update payment status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-white dark:text-white" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-gray-500 dark:text-gray-400">{error || "Order not found"}</p>
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white truncate">
              Order #{order.orderId}
            </h1>
            <span
              className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                STATUS_COLORS[order.status] || STATUS_COLORS.pending
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <InvoicePrintButton
            order={orderToInvoiceOrder(order)}
            customClass="!px-4 !py-2 !rounded-lg !border !border-white/20 hover:!bg-white/10 !text-sm"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print Invoice
          </InvoicePrintButton>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Order Info */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Order Date</p>
              <p className="font-medium text-white mt-0.5">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
              <span
                className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  PAYMENT_METHOD_COLORS[order.paymentMethod] ||
                  PAYMENT_METHOD_COLORS.cod
                }`}
              >
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                  order.paymentMethod?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Payment Status</p>
              <span
                className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                  PAYMENT_STATUS_COLORS.pending
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Payment Verification */}
          {order.paymentStatus === "pending" && (
            <div className="bg-amber-900/10 border border-amber-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Payment Verification (Manual)
              </h3>
              <div className="space-y-3">
                {order.payment?.transactionId && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Transaction ID (from user)
                    </p>
                    <p className="font-mono text-sm font-medium text-white bg-black/30 px-3 py-2 rounded-lg border border-white/10">
                      {order.payment.transactionId}
                    </p>
                  </div>
                )}
                {order.payment?.senderNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Sender Number
                    </p>
                    <p className="font-mono text-sm text-white">
                      {order.payment.senderNumber}
                    </p>
                  </div>
                )}
                {!order.payment?.transactionId && (
                  <p className="text-sm text-gray-400 italic">
                    No transaction ID submitted yet by customer.
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() =>
                      handlePaymentStatusUpdate(order._id, "verified")
                    }
                    disabled={updatingOrderId === order._id}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {updatingOrderId === order._id ? (
                      <Spinner size="sm" />
                    ) : (
                      "Verify Payment"
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handlePaymentStatusUpdate(order._id, "failed")
                    }
                    disabled={updatingOrderId === order._id}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">
                Customer Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {order.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {order.customer?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {order.customer?.email || ""}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300">
                  Phone: {order.customer?.phone || "—"}
                </p>
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">
                Shipping Address
              </h3>
              <div className="space-y-1 text-sm text-gray-300">
                <p className="font-medium text-white">
                  {order.shippingAddress?.name}
                </p>
                <p>{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.address}</p>
                <p>
                  {[
                    order.shippingAddress?.area,
                    order.shippingAddress?.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shippingAddress?.zone && (
                  <p>Zone: {order.shippingAddress.zone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Order Items
            </h3>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="divide-y divide-white/10">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden shrink-0 relative">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name || "Product"}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {item.product?.name || "Product"}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Variant: {item.variant}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qty: {item.quantity} × ৳{item.price?.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-white whitespace-nowrap">
                      ৳{(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">
              Pricing Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>৳{order.subtotal?.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>
                    Discount
                    {order.couponCode && ` (${order.couponCode})`}
                  </span>
                  <span>-৳{order.discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span>Delivery Charge</span>
                <span>৳{order.deliveryCharge?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-semibold text-white text-base">
                <span>Total</span>
                <span>৳{order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Status History
              </h3>
              <div className="space-y-0">
                {order.statusHistory.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                          idx === 0
                            ? "bg-white"
                            : "bg-gray-600"
                        }`}
                      />
                      {idx < order.statusHistory.length - 1 && (
                        <div className="w-px h-full min-h-[32px] bg-white/10" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            STATUS_COLORS[entry.status] || STATUS_COLORS.pending
                          }`}
                        >
                          {entry.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(
                            entry.timestamp instanceof Date
                              ? entry.timestamp.toISOString()
                              : String(entry.timestamp),
                          )}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-gray-400 mt-1">{entry.note}</p>
                      )}
                      {entry.changedBy && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          by {entry.changedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Actions */}
          <div className="bg-black/30 rounded-xl p-4 space-y-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white">
              Update Order
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Add a note for this update..."
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/50 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Order Status
                </label>
                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order._id, e.target.value)
                    }
                    disabled={updatingOrderId === order._id}
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-white/10 bg-black/50 text-white text-sm focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Payment Status
                </label>
                <div className="relative">
                  <select
                    value={order.paymentStatus}
                    onChange={(e) =>
                      handlePaymentStatusUpdate(order._id, e.target.value)
                    }
                    disabled={updatingOrderId === order._id}
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-white/10 bg-black/50 text-white text-sm focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {updatingOrderId === order._id && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner size="sm" />
                Updating...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
