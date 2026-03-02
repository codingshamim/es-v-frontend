"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard } from "./OrderCard";
import { Spinner } from "@/components/ui/Spinner";
import { getMyOrders } from "@/app/actions/orders";

function formatOrderDate(createdAt: string): string {
  try {
    return new Date(createdAt).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date(createdAt).toLocaleDateString();
  }
}

function formatPrice(amount: number): string {
  return `৳${Number(amount).toLocaleString("bn-BD")}`;
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Array<{
    _id: string;
    orderId: string;
    status: string;
    createdAt: string;
    items: Array<{
      name: string;
      image: string;
      size: string;
      colorName: string;
      quantity: number;
      unitPrice: number;
    }>;
    pricing: { total: number };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMyOrders();
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        setError(result.message || "অর্ডার লোড করতে ব্যর্থ");
      }
    } catch {
      setError("অর্ডার লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" className="text-accent-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-bengali">{error}</p>
        <button
          type="button"
          onClick={fetchOrders}
          className="mt-3 text-sm font-medium text-accent-teal hover:underline font-bengali"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-8 sm:p-12 border border-gray-200 dark:border-[#1a1a1a] text-center">
        <p className="text-gray-500 dark:text-gray-400 font-bengali mb-2">
          আপনার এখনো কোনো অর্ডার নেই।
        </p>
        <a
          href="/shop"
          className="inline-block mt-3 px-5 py-2.5 bg-accent-teal text-white rounded-xl text-sm font-medium hover:bg-accent-teal/90 transition-colors font-bengali"
        >
          শপে যান
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order._id || order.orderId}
          orderId={order.orderId}
          date={formatOrderDate(order.createdAt)}
          status={
            order.status === "delivered"
              ? "completed"
              : order.status === "cancelled"
                ? "cancelled"
                : (order.status as "pending" | "processing" | "shipped" | "confirmed")
          }
          items={order.items.map((it) => ({
            title: it.name,
            variant: `সাইজ: ${it.size} | কালার: ${it.colorName || "-"}`,
            quantity: it.quantity,
            price: formatPrice(it.unitPrice * it.quantity),
            image: it.image || "/placeholder-product.png",
          }))}
          total={formatPrice(order.pricing?.total ?? 0)}
        />
      ))}
    </div>
  );
}
