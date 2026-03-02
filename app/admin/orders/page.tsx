"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  ChevronDownIcon,
  PlusIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { InvoicePrintButton } from "@/components/invoice/InvoicePrintButton";
import type { InvoiceOrder } from "@/components/invoice/InvoicePrintButton";
import {
  getDistricts,
  getCitiesForDistrict,
} from "@/lib/data/bangladesh-locations";

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

// ─── Create Custom Order types ────────────────────────────────────────────────

interface CreateOrderLineItem {
  product: string;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

interface ProductOption {
  _id: string;
  name: string;
  images?: { main?: string; gallery?: string[] };
  pricing?: { regularPrice?: number; salePrice?: number | null };
  sizes?: { label: string; stock: number }[];
  colors?: { name: string; hex: string }[];
}

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

/** Map admin Order to InvoiceOrder for InvoicePrintButton */
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

  // Create Custom Order modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLineItems, setCreateLineItems] = useState<CreateOrderLineItem[]>([]);
  const [createShipping, setCreateShipping] = useState({
    name: "",
    phone: "",
    email: "",
    district: "",
    city: "",
    address: "",
    notes: "",
  });
  const [createPaymentMethod, setCreatePaymentMethod] = useState<"cod" | "bkash" | "nagad" | "rocket">("cod");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Product search for add item
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [addItemSize, setAddItemSize] = useState("");
  const [addItemColor, setAddItemColor] = useState<{ name: string; hex: string } | null>(null);
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemPrice, setAddItemPrice] = useState(0);

  const createDistricts = getDistricts();
  const createCities = getCitiesForDistrict(createShipping.district);
  const createSubtotal = createLineItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
  const isCreateDhaka =
    createShipping.district?.toLowerCase() === "dhaka" ||
    createShipping.district?.toLowerCase() === "ঢাকা";
  const createDeliveryCharge = isCreateDhaka ? 120 : 150;
  const createTotal = createSubtotal + createDeliveryCharge;

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

      const apiOrder = updated.order || updated.data;
      const merged = (o: Order) =>
        o._id === orderId && apiOrder
          ? normalizeOrder({ ...o, ...apiOrder } as Record<string, unknown>)
          : o;

      setOrders((prev) => prev.map(merged));
      if (selectedOrder?._id === orderId && apiOrder) {
        setSelectedOrder(normalizeOrder({ ...selectedOrder, ...apiOrder } as Record<string, unknown>));
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

  // Product search for create order
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setProductSearching(true);
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(productSearch)}&limit=10`
        );
        const data = await res.json();
        setProductResults(Array.isArray(data.data) ? data.data : []);
      } catch {
        setProductResults([]);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProductToOrder = () => {
    if (!selectedProduct || !addItemSize || !addItemColor || addItemQty < 1) return;
    const mainImg =
      (typeof selectedProduct.images === "object" && selectedProduct.images && "main" in selectedProduct.images
        ? (selectedProduct.images as { main?: string }).main
        : Array.isArray(selectedProduct.images)
          ? (selectedProduct.images as string[])[0]
          : "") || "/placeholder-product.png";
    const price = addItemPrice > 0 ? addItemPrice : (selectedProduct.pricing?.salePrice ?? selectedProduct.pricing?.regularPrice ?? 0);
    const origPrice = selectedProduct.pricing?.regularPrice ?? price;
    setCreateLineItems((prev) => [
      ...prev,
      {
        product: selectedProduct._id,
        name: selectedProduct.name,
        image: mainImg,
        size: addItemSize,
        color: addItemColor.hex,
        colorName: addItemColor.name,
        quantity: addItemQty,
        unitPrice: price,
        originalPrice: origPrice,
      },
    ]);
    setSelectedProduct(null);
    setAddItemSize("");
    setAddItemColor(null);
    setAddItemQty(1);
    setAddItemPrice(price);
    setProductSearch("");
    setProductResults([]);
  };

  const removeCreateLineItem = (index: number) => {
    setCreateLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateLineItems([]);
    setCreateShipping({ name: "", phone: "", email: "", district: "", city: "", address: "", notes: "" });
    setCreatePaymentMethod("cod");
    setCreateError(null);
    setSelectedProduct(null);
    setProductSearch("");
    setProductResults([]);
    setAddItemSize("");
    setAddItemColor(null);
    setAddItemQty(1);
    setAddItemPrice(0);
  };

  const handleCreateOrder = async () => {
    setCreateError(null);
    if (createLineItems.length === 0) {
      setCreateError("Add at least one product");
      return;
    }
    if (!createShipping.name.trim()) {
      setCreateError("Customer name is required");
      return;
    }
    if (!createShipping.phone.trim()) {
      setCreateError("Phone number is required");
      return;
    }
    if (!/^(\+88)?01[0-9]{9}$/.test(createShipping.phone.replace(/\s/g, ""))) {
      setCreateError("Valid phone required (01XXXXXXXXX)");
      return;
    }
    if (!createShipping.district) {
      setCreateError("District is required");
      return;
    }
    if (!createShipping.city) {
      setCreateError("City/Upazila is required");
      return;
    }
    if (!createShipping.address.trim()) {
      setCreateError("Address is required");
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: createLineItems,
          shipping: {
            name: createShipping.name.trim(),
            phone: createShipping.phone.trim(),
            email: createShipping.email.trim() || undefined,
            district: createShipping.district,
            city: createShipping.city,
            address: createShipping.address.trim(),
            notes: createShipping.notes.trim() || undefined,
          },
          paymentMethod: createPaymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.message || "Failed to create order");
        return;
      }
      showToast(`Order ${data.orderId} created successfully`, "success");
      setShowCreateModal(false);
      fetchOrders();
    } catch {
      setCreateError("Failed to create order");
    } finally {
      setCreateSubmitting(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 transition-colors shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          Create Custom Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition text-sm"
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
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition text-sm"
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

      {/* Orders - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-white dark:text-white" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 dark:text-gray-500 text-sm">
            No orders found
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    #{order.orderId}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLORS[order.status] || STATUS_COLORS.pending
                    }`}
                  >
                    {order.status}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      PAYMENT_METHOD_COLORS[order.paymentMethod] || PAYMENT_METHOD_COLORS.cod
                    }`}
                  >
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-gray-700 dark:text-white text-sm font-bold shrink-0">
                  {order.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                    {order.customer?.name || "Unknown"}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                    {order.customer?.phone || ""}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                  ৳{order.total?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {getItemsSummary(order.items)}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <InvoicePrintButton
                  order={orderToInvoiceOrder(order)}
                  customClass="!p-2 !rounded-lg !border !border-gray-200 dark:!border-[#1a1a1a] hover:!bg-gray-50 dark:hover:!bg-[#1a1a1a] !min-w-0"
                >
                  <PrinterIcon className="w-4 h-4" />
                </InvoicePrintButton>
                <button
                  onClick={() => openDetail(order)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-white dark:text-white transition"
                  title="View Details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() =>
                      setStatusDropdownId(statusDropdownId === order._id ? null : order._id)
                    }
                    disabled={updatingOrderId === order._id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition"
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
                      <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl py-1">
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                          Order Status
                        </div>
                        {ORDER_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusUpdate(order._id, s)}
                            disabled={order.status === s}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition capitalize ${
                              order.status === s
                                ? "text-white dark:text-white font-medium"
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
            </div>
          ))
        )}
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10">
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
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Spinner size="lg" className="mx-auto text-white dark:text-white" />
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
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
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
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-gray-700 dark:text-white text-xs font-bold shrink-0">
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
                        <InvoicePrintButton
                          order={orderToInvoiceOrder(order)}
                          customClass="!p-2 !rounded-lg !border-0 !bg-transparent hover:!bg-gray-100 dark:hover:!bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:text-white dark:text-white"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </InvoicePrintButton>
                        <button
                          onClick={() => openDetail(order)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-white dark:text-white transition"
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition"
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
                              <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl py-1">
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
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition capitalize ${
                                      order.status === s
                                        ? "text-white dark:text-white font-medium"
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
      </div>

      {/* Pagination - shared for mobile & desktop */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-0 py-4 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 sm:border-t-0 sm:rounded-t-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center justify-center sm:justify-end gap-1.5 order-1 sm:order-2 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                          ? "bg-white text-black border-white dark:bg-white dark:text-black dark:border-white"
                          : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-3xl mx-4 sm:mx-6 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header - responsive: stacks on mobile */}
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Order{" "}
                  <span className="text-gray-900 dark:text-white">
                    #{selectedOrder.orderId}
                  </span>
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${
                    STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.pending
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <InvoicePrintButton
                  order={orderToInvoiceOrder(selectedOrder)}
                  customClass="!px-3 !py-2 sm:!px-4 !rounded-lg !border !border-gray-200 dark:!border-[#1a1a1a] hover:!bg-gray-50 dark:hover:!bg-[#1a1a1a] !text-sm"
                >
                  <PrinterIcon className="w-4 h-4 shrink-0 sm:mr-1" />
                  <span className="hidden sm:inline">Print Invoice</span>
                </InvoicePrintButton>
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
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

              {/* Payment Verification (COD: delivery charge; Online: full payment) */}
              {selectedOrder.paymentStatus === "pending" && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Payment Verification (Manual)
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.payment?.transactionId && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Transaction ID (from user)
                          </p>
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10">
                            {selectedOrder.payment.transactionId}
                          </p>
                        </div>
                      )}
                      {selectedOrder.payment?.senderNumber && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Sender Number
                          </p>
                          <p className="font-mono text-sm text-gray-900 dark:text-white">
                            {selectedOrder.payment.senderNumber}
                          </p>
                        </div>
                      )}
                      {!selectedOrder.payment?.transactionId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No transaction ID submitted yet by customer.
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() =>
                            handlePaymentStatusUpdate(
                              selectedOrder._id,
                              "verified",
                            )
                          }
                          disabled={updatingOrderId === selectedOrder._id}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {updatingOrderId === selectedOrder._id ? (
                            <Spinner size="sm" />
                          ) : (
                            "Verify Payment"
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handlePaymentStatusUpdate(
                              selectedOrder._id,
                              "failed",
                            )
                          }
                          disabled={updatingOrderId === selectedOrder._id}
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
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Customer Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-gray-700 dark:text-white text-sm font-bold shrink-0">
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
                <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {selectedOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0 relative">
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
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-white/10 font-semibold text-gray-900 dark:text-white text-base">
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
                                  ? "bg-white text-black dark:bg-white dark:text-black"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                            {idx <
                              selectedOrder.statusHistory.length - 1 && (
                              <div className="w-px h-full min-h-[32px] bg-gray-200 dark:bg-white/10" />
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition"
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
                        className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
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
                        className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none transition appearance-none disabled:opacity-50"
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
                    <Spinner size="sm" className="text-white dark:text-white" />
                    Updating...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !createSubmitting && setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Custom Order
              </h2>
              <button
                onClick={() => !createSubmitting && setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Products */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Add Products
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent outline-none"
                    />
                    {productSearching && (
                      <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {productResults.length > 0 && !selectedProduct && (
                    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {productResults.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            const sprice = p.pricing?.salePrice ?? p.pricing?.regularPrice ?? 0;
                            setAddItemPrice(sprice);
                            setAddItemSize("");
                            setAddItemColor(null);
                            setAddItemQty(1);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/10 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0 relative">
                            {(() => {
                              const img =
                                typeof p.images === "object" && p.images && "main" in p.images
                                  ? (p.images as { main?: string }).main
                                  : Array.isArray(p.images) && p.images[0];
                              return img ? (
                                <Image
                                  src={img}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              ৳{(p.pricing?.salePrice ?? p.pricing?.regularPrice ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedProduct && (
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.name}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Size</label>
                          <select
                            value={addItemSize}
                            onChange={(e) => setAddItemSize(e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                          >
                            <option value="">Select</option>
                            {(selectedProduct.sizes || []).map((s) => (
                              <option key={s.label} value={s.label}>
                                {s.label} (Stock: {s.stock})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color</label>
                          <select
                            value={addItemColor?.hex ?? ""}
                            onChange={(e) => {
                              const c = (selectedProduct.colors || []).find(
                                (c) => c.hex === e.target.value
                              );
                              setAddItemColor(c || null);
                            }}
                            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                          >
                            <option value="">Select</option>
                            {(selectedProduct.colors || []).map((c) => (
                              <option key={c.hex} value={c.hex}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={addItemQty}
                            onChange={(e) => setAddItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Price (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={addItemPrice}
                            onChange={(e) => setAddItemPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addProductToOrder}
                        disabled={!addItemSize || !addItemColor || addItemQty < 1}
                        className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Order
                      </button>
                    </div>
                  )}
                </div>
                {createLineItems.length > 0 && (
                  <div className="mt-3 border border-gray-200 dark:border-white/10 rounded-lg divide-y divide-gray-100 dark:divide-white/10">
                    {createLineItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0 relative">
                            {item.image ? (
                              <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.size} / {item.colorName} × {item.quantity} @ ৳
                              {item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-sm">
                            ৳{(item.quantity * item.unitPrice).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCreateLineItem(i)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Customer & Shipping
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Name *</label>
                    <input
                      type="text"
                      value={createShipping.name}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Customer name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={createShipping.phone}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, phone: e.target.value }))
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={createShipping.email}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, email: e.target.value }))
                      }
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">District *</label>
                    <select
                      value={createShipping.district}
                      onChange={(e) =>
                        setCreateShipping((s) => ({
                          ...s,
                          district: e.target.value,
                          city: "",
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                    >
                      <option value="">Select district</option>
                      {createDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City/Upazila *</label>
                    <select
                      value={createShipping.city}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, city: e.target.value }))
                      }
                      disabled={!createShipping.district}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm disabled:opacity-50"
                    >
                      <option value="">
                        {createShipping.district ? "Select city" : "Select district first"}
                      </option>
                      {createCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Address *</label>
                    <textarea
                      value={createShipping.address}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, address: e.target.value }))
                      }
                      placeholder="Full address"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Notes</label>
                    <input
                      type="text"
                      value={createShipping.notes}
                      onChange={(e) =>
                        setCreateShipping((s) => ({ ...s, notes: e.target.value }))
                      }
                      placeholder="Optional order notes"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Summary */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
                  <select
                    value={createPaymentMethod}
                    onChange={(e) =>
                      setCreatePaymentMethod(e.target.value as "cod" | "bkash" | "nagad" | "rocket")
                    }
                    className="w-full sm:w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] text-sm"
                  >
                    {(["cod", "bkash", "nagad", "rocket"] as const).map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>৳{createSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-400">
                    <span>Delivery</span>
                    <span>৳{createDeliveryCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4 font-semibold text-gray-900 dark:text-white pt-1">
                    <span>Total</span>
                    <span>৳{createTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {createError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 text-sm">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !createSubmitting && setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={createSubmitting || createLineItems.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    "Create Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
