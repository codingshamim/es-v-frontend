"use client";

import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const PERMISSIONS = [
  { key: "user_management", label: "User Management" },
  { key: "product_management", label: "Product Management" },
  { key: "order_management", label: "Order Management" },
  { key: "category_management", label: "Category Management" },
  { key: "coupon_management", label: "Coupon Management" },
  { key: "review_management", label: "Review Management" },
  { key: "analytics_access", label: "Analytics" },
  { key: "settings_access", label: "Settings" },
  { key: "chat_access", label: "Live Chat" },
];

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin" | "moderator";
  isActive: boolean;
  permissions: string[];
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  adminsAndModerators: number;
  newThisMonth: number;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin" | "moderator";
  permissions: string[];
  isActive: boolean;
}

const INITIAL_FORM: UserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "user",
  permissions: [],
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    adminsAndModerators: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(INITIAL_FORM);
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

  const fetchUsers = useCallback(
    async (opts?: { page?: number }) => {
      const pageToFetch = opts?.page ?? page;
      if (opts?.page != null) setPage(opts.page);
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageToFetch),
          limit: String(limit),
          ...(search && { search }),
          ...(roleFilter && { role: roleFilter }),
          ...(statusFilter && { status: statusFilter }),
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        // API returns { success, data: users[], pagination: { page, limit, total, totalPages } }
        const list = Array.isArray(data.data) ? data.data : [];
        const pagination = data.pagination || {};
        setUsers(list);
        setTotalPages(pagination.totalPages ?? 1);
        setTotalCount(pagination.total ?? 0);
        setStats({
          totalUsers: data.stats?.totalUsers ?? pagination.total ?? 0,
          activeUsers: data.stats?.activeUsers ?? 0,
          adminsAndModerators: data.stats?.adminsAndModerators ?? 0,
          newThisMonth: data.stats?.newThisMonth ?? 0,
        });
      } catch {
        showToast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, search, roleFilter, statusFilter, showToast, limit],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      };
      if (form.role !== "user") body.permissions = form.permissions;
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to create user");
      }
      showToast("User created successfully", "success");
      setShowCreateModal(false);
      setForm(INITIAL_FORM);
      await fetchUsers({ page: 1 });
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : "Failed to create user",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.role !== "user") body.permissions = form.permissions;
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to update user");
      }
      showToast("User updated successfully", "success");
      setShowEditModal(false);
      setSelectedUser(null);
      setForm(INITIAL_FORM);
      await fetchUsers();
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : "Failed to update user",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      showToast("User deleted successfully", "success");
      setShowDeleteDialog(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch {
      showToast("Failed to delete user", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const openDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin:
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
      moderator:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      user: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[role] || styles.user}`}
      >
        {role}
      </span>
    );
  };

  const statusBadge = (active: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: UserIcon,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Admins / Moderators",
      value: stats.adminsAndModerators,
      icon: ShieldCheckIcon,
      color: "text-teal-500",
      bg: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      label: "New This Month",
      value: stats.newThisMonth,
      icon: PlusIcon,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const renderModalFields = (mode: "create" | "edit") => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
          placeholder="Full name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
          placeholder="+880..."
        />
      </div>
      {mode === "create" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
            placeholder="Min 6 characters"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Role
        </label>
        <select
          value={form.role}
          onChange={(e) =>
            setForm({
              ...form,
              role: e.target.value as UserForm["role"],
              permissions:
                e.target.value === "user" ? [] : form.permissions,
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>
      {form.role !== "user" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PERMISSIONS.map((perm) => (
              <label
                key={perm.key}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm.key)}
                  onChange={() => togglePermission(perm.key)}
                  className="rounded border-gray-300 dark:border-[#333] text-accent-teal focus:ring-accent-teal bg-white dark:bg-[#0a0a0a]"
                />
                {perm.label}
              </label>
            ))}
          </div>
        </div>
      )}
      {mode === "edit" && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active
          </span>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isActive
                ? "bg-accent-teal"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => {
                setForm(INITIAL_FORM);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-xl text-sm font-medium transition"
            >
              <PlusIcon className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#1a1a1a]">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Orders
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Total Spent
                </th>
                <th className="text-right px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Spinner size="lg" className="mx-auto text-accent-teal" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center text-gray-400 dark:text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {user.phone || "—"}
                    </td>
                    <td className="px-5 py-4">{roleBadge(user.role)}</td>
                    <td className="px-5 py-4">
                      {statusBadge(user.isActive)}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {user.totalOrders ?? 0}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      ৳{(user.totalSpent ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:text-accent-teal transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(user)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
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
                  if (i > 0 && p - (arr[i - 1] as number) > 1)
                    acc.push("...");
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{renderModalFields("create")}</div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#1a1a1a]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  actionLoading || !form.name || !form.email || !form.password
                }
                className="flex items-center gap-2 px-5 py-2 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {actionLoading && <Spinner size="sm" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit User
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{renderModalFields("edit")}</div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#1a1a1a]">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={actionLoading || !form.name || !form.email}
                className="flex items-center gap-2 px-5 py-2 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {actionLoading && <Spinner size="sm" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteDialog(false);
              setSelectedUser(null);
            }}
          />
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shadow-2xl p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <TrashIcon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete User
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {selectedUser.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition"
              >
                {actionLoading && <Spinner size="sm" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
