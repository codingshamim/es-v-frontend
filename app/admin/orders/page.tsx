"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
  };
  variant?: string;
  quantity: number;
  price: number;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  changedBy?: string;
  timestamp: string;
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Map API order shape (user, shipping, payment, pricing) to page Order shape (customer, shippingAddress, paymentMethod, total, etc.) */
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
      _id: user?._id ?? raw.user ?? "",
      name: user?.name ?? shipping?.name ?? "Unknown",
      email: user?.email ?? shipping?.email ?? "",
      phone: shipping?.phone ?? "",
    },
    items: items.map((item: Record<string, unknown>) => ({
      ...item,
      product: {
        _id: typeof item.product === "object" && item.product && "_id" in item.product
          ? String((item.product as { _id: string })._id)
          : String(item.product ?? ""),
        name: (item.name as string) ?? (typeof item.product === "object" && item.product && "name" in item.product ? (item.product as { name: string }).name : "Product"),
        images: (item.image ? [item.image] : (typeof item.product === "object" && item.product && "images" in item.product ? (item.product as { images?: string[] }).images : undefined)) as string[] | undefined,
      },
      quantity: (item.quantity as number) ?? 0,
      price: ((item.unitPrice ?? item.price) as number) ?? 0,
    })),
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

function formatDateTime(dateStr: string) {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      // API returns { success, data: orders[], pagination: { page, limit, total, totalPages } }
      const rawOrders = Array.isArray(data.data) ? data.data : [];
      setOrders(rawOrders.map((o: Record<string, unknown>) => normalizeOrder(o)));
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalCount(data.pagination?.total ?? 0);
    } catch {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentStatusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentStatusFilter]);

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
      setStatusDropdownId(null);
      setUpdateNote("");

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, ...updated.order, ...updated } : o,
        ),
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? { ...prev, ...updated.order, ...updated }
            : prev,
        );
      }
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

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, ...updated.order, ...updated } : o,
        ),
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? { ...prev, ...updated.order, ...updated }
            : prev,
        );
      }
    } catch {
      showToast("Failed to update payment status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setUpdateNote("");
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
    setStatusDropdownId(null);
    setUpdateNote("");
  };

  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return "No items";
    const summary = items
      .slice(0, 2)
      .map((item) => `${(item as { name?: string }).name || item.product?.name || "Product"} ×${item.quantity}`)
      .join(", ");
    if (items.length > 2) return `${summary} +${items.length - 2} more`;
    return summary;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-60 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="hover:opacity-70">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage and track all customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition text-sm"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition text-sm"
            >
              <option value="">All Payment</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#1a1a1a]">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Order ID
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Items
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Total
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Payment
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-right px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Spinner size="lg" className="mx-auto text-accent-teal" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-20 text-center text-gray-400 dark:text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                        #{order.orderId}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {order.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {order.customer?.name || "Unknown"}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                            {order.customer?.phone || ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-4">
                      <p className="text-gray-600 dark:text-gray-300 text-xs max-w-[200px] truncate">
                        {getItemsSummary(order.items)}
                      </p>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{order.total?.toLocaleString()}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          PAYMENT_METHOD_COLORS[order.paymentMethod] ||
                          PAYMENT_METHOD_COLORS.cod
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                          order.paymentMethod?.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[order.status] || STATUS_COLORS.pending
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(order)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:text-accent-teal transition"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setStatusDropdownId(
                                statusDropdownId === order._id
                                  ? null
                                  : order._id,
                              )
                            }
                            disabled={updatingOrderId === order._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-[#222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 transition"
                          >
                            {updatingOrderId === order._id ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                Update
                                <ChevronDownIcon className="w-3 h-3" />
                              </>
                            )}
                          </button>
                          {statusDropdownId === order._id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setStatusDropdownId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#222] shadow-xl py-1">
                                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                  Order Status
                                </div>
                                {ORDER_STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() =>
                                      handleStatusUpdate(order._id, s)
                                    }
                                    disabled={order.status === s}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#222] transition capitalize ${
                                      order.status === s
                                        ? "text-accent-teal font-medium"
                                        : "text-gray-700 dark:text-gray-300"
                                    } disabled:opacity-50`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-[#1a1a1a]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-[#222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1,
                )
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-gray-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                        p === page
                          ? "bg-accent-teal text-white border-accent-teal"
                          : "border-gray-300 dark:border-[#222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-[#222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111]">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order{" "}
                  <span className="text-teal-600 dark:text-teal-400">
                    #{selectedOrder.orderId}
                  </span>
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.pending
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <button
                onClick={closeDetail}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Order Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Payment Method
                  </p>
                  <span
                    className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      PAYMENT_METHOD_COLORS[selectedOrder.paymentMethod] ||
                      PAYMENT_METHOD_COLORS.cod
                    }`}
                  >
                    {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] ||
                      selectedOrder.paymentMethod?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Payment Status
                  </p>
                  <span
                    className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus] ||
                      PAYMENT_STATUS_COLORS.pending
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Customer Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {selectedOrder.customer?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customer?.name || "Unknown"}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {selectedOrder.customer?.email || ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Phone: {selectedOrder.customer?.phone || "—"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Shipping Address
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.shippingAddress?.name}
                    </p>
                    <p>{selectedOrder.shippingAddress?.phone}</p>
                    <p>{selectedOrder.shippingAddress?.address}</p>
                    <p>
                      {[
                        selectedOrder.shippingAddress?.area,
                        selectedOrder.shippingAddress?.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {selectedOrder.shippingAddress?.zone && (
                      <p>Zone: {selectedOrder.shippingAddress.zone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Order Items
                </h3>
                <div className="border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                    {selectedOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden shrink-0 relative">
                          {item.product?.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name || "Product"}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {item.product?.name || "Product"}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Variant: {item.variant}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Qty: {item.quantity} × ৳
                            {item.price?.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          ৳{(item.quantity * item.price).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Pricing Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span>৳{selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>
                        Discount
                        {selectedOrder.couponCode &&
                          ` (${selectedOrder.couponCode})`}
                      </span>
                      <span>
                        -৳{selectedOrder.discount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Delivery Charge</span>
                    <span>
                      ৳{selectedOrder.deliveryCharge?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-[#1a1a1a] font-semibold text-gray-900 dark:text-white text-base">
                    <span>Total</span>
                    <span>৳{selectedOrder.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusHistory &&
                selectedOrder.statusHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Status History
                    </h3>
                    <div className="space-y-0">
                      {selectedOrder.statusHistory.map((entry, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                                idx === 0
                                  ? "bg-accent-teal"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                            {idx <
                              selectedOrder.statusHistory.length - 1 && (
                              <div className="w-px h-full min-h-[32px] bg-gray-200 dark:bg-[#222]" />
                            )}
                          </div>
                          <div className="pb-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                                  STATUS_COLORS[entry.status] ||
                                  STATUS_COLORS.pending
                                }`}
                              >
                                {entry.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTime(entry.timestamp)}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {entry.note}
                              </p>
                            )}
                            {entry.changedBy && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
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
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Update Order
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Add a note for this update..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#111111] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Order Status
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleStatusUpdate(selectedOrder._id, e.target.value)
                        }
                        disabled={updatingOrderId === selectedOrder._id}
                        className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#111111] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
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
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Payment Status
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOrder.paymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusUpdate(
                            selectedOrder._id,
                            e.target.value,
                          )
                        }
                        disabled={updatingOrderId === selectedOrder._id}
                        className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#111111] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
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
                {updatingOrderId === selectedOrder._id && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Spinner size="sm" className="text-accent-teal" />
                    Updating...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
