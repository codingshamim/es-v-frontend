"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  description?: string;
}

interface CouponForm {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  expiresAt: string;
  description: string;
  isActive: boolean;
}

const initialForm: CouponForm = {
  code: "",
  type: "percentage",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  expiresAt: "",
  description: "",
  isActive: true,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getStatusInfo(coupon: Coupon) {
  if (!coupon.isActive)
    return {
      label: "Inactive",
      cls: "bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400",
    };
  if (isExpired(coupon.expiresAt))
    return {
      label: "Expired",
      cls: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    };
  return {
    label: "Active",
    cls: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      setCoupons(json.data || []);
    } catch {
      console.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const activeCoupons = coupons.filter(
    (c) => c.isActive && !isExpired(c.expiresAt),
  ).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const totalDiscount = coupons.reduce((sum, c) => {
    if (c.type === "fixed") return sum + c.value * (c.usedCount || 0);
    const avg = c.maxDiscount ? Math.min(c.value, c.maxDiscount) : c.value;
    return sum + avg * (c.usedCount || 0);
  }, 0);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount ?? 0,
      usageLimit: coupon.usageLimit,
      expiresAt: toInputDate(coupon.expiresAt),
      description: coupon.description || "",
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/coupons/${editingId}`
        : "/api/admin/coupons";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        maxDiscount:
          form.type === "percentage" && form.maxDiscount > 0
            ? form.maxDiscount
            : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeModal();
        fetchCoupons();
      }
    } catch {
      console.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/coupons/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        fetchCoupons();
      }
    } catch {
      console.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Coupons", value: activeCoupons },
          { label: "Total Uses", value: totalUses },
          {
            label: "Total Discount Given",
            value: `৳${totalDiscount.toLocaleString()}`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Coupons
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Coupon
        </button>
      </div>

      {/* Coupons Grid */}
      {coupons.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <TicketIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No coupons yet. Create your first coupon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const status = getStatusInfo(coupon);
            return (
              <div
                key={coupon._id}
                className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-4"
              >
                {/* Code & Status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-bold font-mono text-gray-900 dark:text-white tracking-wider">
                    {coupon.code}
                  </span>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Type Badge & Value */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      coupon.type === "percentage"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {coupon.type === "percentage" ? "Percentage" : "Fixed"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `৳${coupon.value}`}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Min Order</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      ৳{coupon.minOrderAmount}
                    </span>
                  </div>
                  {coupon.type === "percentage" && coupon.maxDiscount != null && coupon.maxDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Max Discount</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        ৳{coupon.maxDiscount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {coupon.usedCount}
                      {coupon.usageLimit > 0
                        ? ` / ${coupon.usageLimit}`
                        : " / ∞"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(coupon.expiresAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => openEditModal(coupon)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(coupon._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Coupon" : "Create Coupon"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. SAVE20"
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors font-mono tracking-wider uppercase"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Discount Type
                </label>
                <div className="flex gap-4">
                  {(["percentage", "fixed"] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                        form.type === t
                          ? "border-white/50 dark:border-white/30 bg-white/10 dark:bg-white/5 text-gray-900 dark:text-white"
                          : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={() =>
                          setForm((prev) => ({ ...prev, type: t }))
                        }
                        className="sr-only"
                      />
                      {t === "percentage" ? "Percentage (%)" : "Fixed (৳)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Value & Min Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Value {form.type === "percentage" ? "(%)" : "(৳)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={form.value || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Min Order Amount (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.minOrderAmount || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        minOrderAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Max Discount (percentage only) */}
              {form.type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Max Discount (৳)
                    <span className="ml-1 text-xs text-gray-400 font-normal">
                      0 = no limit
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.maxDiscount || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxDiscount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors"
                  />
                </div>
              )}

              {/* Usage Limit & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Usage Limit
                    <span className="ml-1 text-xs text-gray-400 font-normal">
                      0 = unlimited
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.usageLimit || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the coupon"
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-white/50 focus:ring-1 focus:ring-white/50 dark:focus:border-white/50 dark:focus:ring-white/50 outline-none transition-colors resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: !prev.isActive,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    form.isActive
                      ? "bg-white dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      form.isActive ? "translate-x-5 bg-black dark:bg-black" : "translate-x-0 bg-white"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.code.trim() || !form.expiresAt}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving && <Spinner size="sm" />}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Coupon
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this coupon? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting && <Spinner size="sm" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
