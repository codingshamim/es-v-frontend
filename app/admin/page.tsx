"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/admin/StatsCard";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import Image from "next/image";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalReviews: number;
  monthlyOrders: number;
}

interface RecentOrder {
  _id: string;
  orderId: string;
  customer: string;
  items: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface TopProduct {
  _id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

interface SalesByDay {
  _id: number;
  total: number;
  count: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  salesByDay: SalesByDay[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

function formatBDT(amount: number | null | undefined): string {
  const n = amount ?? 0;
  return "৳" + (Number.isFinite(n) ? n : 0).toLocaleString("en-IN");
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to load dashboard");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" className="text-teal-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">{error || "Failed to load dashboard"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentOrders, topProducts, salesByDay = [] } = data;

  const salesMap = new Map((salesByDay || []).map((d) => [d._id, d.total]));
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: DAY_LABELS[i],
    total: salesMap.get(i + 1) || 0,
  }));
  const maxSale = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatBDT(stats.totalRevenue)}
          icon={
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-green-500/10"
          change="+12.5%"
          changeType="up"
        />
        <StatsCard
          title="Total Orders"
          value={(stats.totalOrders ?? 0).toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          iconBg="bg-teal-500/10"
          change={`${stats.monthlyOrders ?? 0} this month`}
          changeType="neutral"
        />
        <StatsCard
          title="Total Customers"
          value={(stats.totalCustomers ?? 0).toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBg="bg-purple-500/10"
          change="+8.2%"
          changeType="up"
        />
        <StatsCard
          title="Pending Orders"
          value={(stats.pendingOrders ?? 0).toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-orange-500/10"
          change="Needs attention"
          changeType="neutral"
        />
      </div>

      {/* Chart & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales Overview Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111111] rounded-2xl p-5 border border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">Sales Overview</h2>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {chartData.map((bar) => {
              const height = maxSale > 0 ? (bar.total / maxSale) * 100 : 0;
              return (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {bar.total > 0 ? formatBDT(bar.total) : "—"}
                  </span>
                  <div className="w-full flex justify-center" style={{ height: "140px" }}>
                    <div
                      className="w-full max-w-[40px] rounded-t-lg bg-teal-500/80 hover:bg-teal-500 transition-colors self-end"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${bar.day}: ${formatBDT(bar.total)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">Top Products</h2>
            <Link
              href="/admin/products"
              className="text-xs text-teal-500 hover:text-teal-400 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map((product) => (
              <div key={product._id} className="flex items-center gap-3">
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
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">{product.soldCount} sold</p>
                </div>
                <p className="text-sm font-semibold text-black dark:text-white shrink-0">
                  {formatBDT(product.revenue)}
                </p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No products yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-black dark:text-white">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs text-teal-500 hover:text-teal-400 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#1a1a1a]">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Product
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1a1a1a]">
              {recentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-black dark:text-white whitespace-nowrap">
                    #{order.orderId}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {order.customer}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                    {order.items}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-black dark:text-white whitespace-nowrap">
                    {formatBDT(order.total)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_STYLES[order.status] || "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-xs font-medium text-teal-500 hover:text-teal-400 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
