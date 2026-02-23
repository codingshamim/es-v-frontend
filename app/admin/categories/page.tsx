"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface CategoryForm {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
}

const initialForm: CategoryForm = {
  name: "",
  description: "",
  image: "",
  isActive: true,
  sortOrder: 0,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      const list = json?.data ?? json?.categories ?? json;
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const slug = generateSlug(form.name);

  const categoryList = Array.isArray(categories) ? categories : [];
  const totalProducts = categoryList.reduce(
    (sum, c) => sum + (c.productCount || 0),
    0,
  );
  const activeCount = categoryList.filter((c) => c.isActive).length;

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setImagePreview(cat.image);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setImagePreview("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
        setImagePreview(data.url);
      }
    } catch {
      console.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });

      if (res.ok) {
        closeModal();
        fetchCategories();
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
      const res = await fetch(`/api/admin/categories/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        fetchCategories();
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
          { label: "Total Categories", value: categoryList.length },
          { label: "Active Categories", value: activeCount },
          { label: "Total Products", value: totalProducts },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5"
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
          All Categories
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categoryList.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-12 text-center">
          <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No categories yet. Create your first category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categoryList.map((cat) => (
            <div
              key={cat._id}
              className="group relative bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-100 dark:bg-[#0a0a0a]">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <PhotoIcon className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat._id)}
                    className="p-2 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {cat.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  /{cat.slug}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {cat.productCount || 0}{" "}
                  {cat.productCount === 1 ? "product" : "products"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#1a1a1a]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Category" : "Create Category"}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Category name"
                  className="w-full rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  readOnly
                  value={slug}
                  className="w-full rounded-xl border border-gray-300 dark:border-[#222] bg-gray-50 dark:bg-[#0a0a0a]/50 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Category description"
                  className="w-full rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Image
                </label>
                {imagePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-[#222] mb-2">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setForm((prev) => ({ ...prev, image: "" }));
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-[#222] cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    {uploading ? (
                      <Spinner size="md" />
                    ) : (
                      <>
                        <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-gray-600 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Active Toggle & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                      form.isActive ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        form.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-[#222] bg-white dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
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
                  disabled={saving || !form.name.trim()}
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
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Category
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this category? This action cannot
              be undone.
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
