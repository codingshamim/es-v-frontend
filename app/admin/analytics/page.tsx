"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import {
  ChartBarIcon,
  CurrencyBangladeshiIcon,
} from "@heroicons/react/24/outline";

interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
}

interface TopProduct {
  _id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

interface PaymentMethod {
  method: string;
  count: number;
  total: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  pageViews: number;
  conversionRate: number;
  revenueByDay: RevenueByDay[];
  ordersByStatus: OrdersByStatus[];
  topProducts: TopProduct[];
  paymentMethods: PaymentMethod[];
}

const PERIODS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f97316",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#a855f7",
  delivered: "#10b981",
  cancelled: "#ef4444",
  returned: "#6b7280",
};

const PAYMENT_COLORS: Record<string, string> = {
  cod: "#10b981",
  bkash: "#e91e8e",
  nagad: "#f97316",
  card: "#3b82f6",
  ssl: "#6366f1",
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  ssl: "SSLCommerz",
};

function formatBDT(amount: number | undefined | null): string {
  const n = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : 0;
  return "৳" + n.toLocaleString("en-IN");
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data || json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" className="text-teal-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Failed to load analytics data
        </p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxRevenue = Math.max(...(data.revenueByDay?.map((d) => d.revenue ?? 0) || []), 1);

  const totalStatusCount = data.ordersByStatus?.reduce((sum, s) => sum + (s.count ?? 0), 0) || 1;

  const maxPaymentTotal = Math.max(...(data.paymentMethods?.map((p) => p.total ?? 0) || []), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your store performance
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatBDT(data.totalRevenue)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <CurrencyBangladeshiIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(data.totalOrders ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(data.pageViews ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(data.conversionRate ?? 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <ChartBarIcon className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart + Orders by Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Bar Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Revenue by Day
            </h2>
            <span className="text-xs text-gray-500">Last {period} days</span>
          </div>

          {data.revenueByDay && data.revenueByDay.length > 0 ? (
            <div className="overflow-x-auto">
              <div
                className="flex items-end gap-1 min-w-[600px]"
                style={{ height: "240px" }}
              >
                {data.revenueByDay.map((day, idx) => {
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  const dateLabel = new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <div
                      key={day.date ?? `revenue-day-${idx}`}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-500 font-medium truncate max-w-full">
                        {day.revenue > 0 ? formatBDT(day.revenue) : ""}
                      </span>
                      <div className="w-full flex justify-center" style={{ height: "180px" }}>
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-teal-500/80 hover:bg-teal-500 transition-colors self-end"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${dateLabel}: ${formatBDT(day.revenue)} (${day.orders} orders)`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 truncate max-w-full">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500 text-sm">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* Orders by Status - Donut Chart */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-6">
            Orders by Status
          </h2>

          {data.ordersByStatus && data.ordersByStatus.length > 0 ? (
            <div className="space-y-6">
              {/* CSS Donut */}
              <div className="flex justify-center">
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let cumulative = 0;
                      return data.ordersByStatus.map((s, idx) => {
                        const pct = ((s.count ?? 0) / totalStatusCount) * 100;
                        const offset = cumulative;
                        cumulative += pct;
                        return (
                          <circle
                            key={`orders-by-status-${idx}`}
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={STATUS_COLORS[s.status] || "#6b7280"}
                            strokeWidth="4"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={`${-offset}`}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalStatusCount}
                    </span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {data.ordersByStatus.map((s, idx) => (
                  <div key={`orders-legend-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {s.count ?? 0}
                      </span>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {(((s.count ?? 0) / totalStatusCount) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500 text-sm">
              No order data
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Payment Methods */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Top Selling Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs text-teal-500 hover:text-teal-400 transition-colors"
            >
              View All
            </Link>
          </div>

          {data.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.slice(0, 10).map((product, idx) => (
                <div
                  key={product._id ?? `top-product-${idx}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors"
                >
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.soldCount} sold</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                    {formatBDT(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
              No product data
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-6">
            Payment Methods
          </h2>

          {data.paymentMethods && data.paymentMethods.length > 0 ? (
            <div className="space-y-5">
              {data.paymentMethods.map((pm, idx) => {
                const pct = maxPaymentTotal > 0 ? ((pm.total ?? 0) / maxPaymentTotal) * 100 : 0;
                const color = PAYMENT_COLORS[pm.method] || "#6b7280";
                return (
                  <div key={pm.method ? `payment-${String(pm.method)}-${idx}` : `payment-${idx}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {PAYMENT_LABELS[pm.method] || pm.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {pm.count} orders
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatBDT(pm.total)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
              No payment data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
