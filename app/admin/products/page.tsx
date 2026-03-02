"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: "active" | "draft" | "out_of_stock" | "archived";
  category: string;
  images: ProductImage[];
  featured?: boolean;
}

/** Map API product (pricing, images object, totalStock) to UI Product shape */
function mapApiProduct(p: Record<string, unknown>): Product {
  const pricing = (p.pricing as { regularPrice?: number; salePrice?: number }) || {};
  const images = (p.images as { main?: string; gallery?: string[] }) || {};
  const mainUrl = images.main || (Array.isArray(images.gallery) ? images.gallery[0] : null);
  return {
    _id: String(p._id),
    name: String(p.name ?? ""),
    sku: String(p.sku ?? ""),
    price: Number(pricing.regularPrice) || 0,
    salePrice: pricing.salePrice != null ? Number(pricing.salePrice) : undefined,
    stock: Number(p.totalStock) ?? 0,
    status: (String(p.status ?? "draft").toLowerCase().replace(/\s/g, "_") as Product["status"]) || "draft",
    category: String(p.category ?? ""),
    images: mainUrl ? [{ url: mainUrl }] : [],
    featured: Boolean(p.isFeatured),
  };
}

const CATEGORIES = [
  "T-Shirts",
  "Polo Shirts",
  "Hoodies",
  "Tank Tops",
  "Long Sleeves",
];

const STATUSES = ["All", "Active", "Draft", "Out of Stock", "Archived"];

function statusToQuery(status: string): string {
  if (status === "All") return "";
  if (status === "Out of Stock") return "out_of_stock";
  return status.toLowerCase();
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500",
    draft: "bg-yellow-500/10 text-yellow-500",
    out_of_stock: "bg-red-500/10 text-red-500",
    archived: "bg-gray-500/10 text-gray-400",
  };
  const labels: Record<string, string> = {
    active: "Active",
    draft: "Draft",
    out_of_stock: "Out of Stock",
    archived: "Archived",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const s = statusToQuery(status);
      if (s) params.set("status", s);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch");
      const rawList = Array.isArray(json.data) ? json.data : [];
      const pagination = json.pagination || {};
      setProducts(rawList.map((p: Record<string, unknown>) => mapApiProduct(p)));
      setTotal(pagination.total ?? 0);
      setTotalPages(pagination.totalPages ?? 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchProducts();
    } catch {
      /* silently fail */
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} total products
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 min-w-[160px]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 min-w-[160px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-white dark:text-white" />
        </div>
      ) : !products?.length ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="group bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100 dark:bg-[#0a0a0a]">
                {product.images?.[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-300 dark:text-gray-600 text-4xl">
                      📷
                    </span>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      router.push(`/admin/products/${product._id}/edit`)
                    }
                    className="bg-white dark:bg-white/5 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {product.name}
                  </h3>
                  {statusBadge(product.status)}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  SKU: {product.sku}
                </p>

                <div className="flex items-center gap-2">
                  {product.salePrice ? (
                    <>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ${product.salePrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-xs ${
                      product.stock > 10
                        ? "text-emerald-500"
                        : product.stock > 0
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1),
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
                  className="px-2 text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-white text-black dark:bg-white dark:text-black border border-white dark:border-white"
                      : "bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Product
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
