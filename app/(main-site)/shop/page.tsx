"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import { useSession } from "next-auth/react";
import {
  ProductDetailModal,
  SizeChartModal,
  QuickLoginModal,
  type ProductSelection,
} from "@/components/modals";
import { savePendingCartAction } from "@/lib/pending-cart-action";
import type { ProductColor, ProductSize } from "@/lib/types";
import { ReusableImage } from "@/components/ui/ReusableImage";

interface ShopProduct {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  pricing: {
    regularPrice: number;
    salePrice: number | null;
    discount: number;
  };
  images: { main: string; gallery?: string[] };
  colors: ProductColor[];
  sizes: ProductSize[];
  totalStock: number;
  status: string;
  ratings: { average: number; count: number };
  soldCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ShopCategory {
  name: string;
  slug: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "নতুন প্রথমে" },
  { value: "popular", label: "জনপ্রিয়" },
  { value: "price-low", label: "দাম: কম থেকে বেশি" },
  { value: "price-high", label: "দাম: বেশি থেকে কম" },
  { value: "rating", label: "সর্বোচ্চ রেটিং" },
];

function ProductCard({
  product,
  onQuickBuy,
}: {
  product: ShopProduct;
  onQuickBuy: (p: ShopProduct) => void;
}) {
  const currentPrice = product.pricing.salePrice ?? product.pricing.regularPrice;
  const isOutOfStock = product.totalStock === 0 || product.status === "Out of Stock";

  return (
    <div className="group h-full bg-white dark:bg-black rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 flex flex-col">
      <Link href={`/products/${product.slug}`} className="block">
        <ReusableImage
          mainSrc={product.images.main}
          mainAlt={product.name}
          thumbnails={[]}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          containerClassName="relative aspect-square overflow-hidden bg-gray-100 dark:bg-black"
          className=""
          overlayBadges={{
            topLeft: (
              <>
                {isOutOfStock && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold.bg-black/80 text-white">
                    Out of Stock
                  </span>
                )}
                {!isOutOfStock && product.pricing.discount > 0 && (
                  <span className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                    -{product.pricing.discount}%
                  </span>
                )}
              </>
            ),
          }}
        />
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-black dark:text-white mb-1 hover:text-black/70 dark:hover:text-white/80 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 dark:text-[#888888] text-xs mb-2 line-clamp-2">
          {product.shortDescription}
        </p>
        {product.ratings.count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {product.ratings.average.toFixed(1)} ({product.ratings.count})
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          {product.pricing.salePrice && (
            <span className="text-xs text-gray-400 line-through">
              BDT {product.pricing.regularPrice}
            </span>
          )}
          <span className="text-base font-bold text-black dark:text-white">
            BDT {currentPrice}
          </span>
        </div>
        <button
          disabled={isOutOfStock}
          onClick={() => onQuickBuy(product)}
          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {isOutOfStock ? "স্টক নেই" : "এখনই কিনুন"}
        </button>
      </div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-black rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 animate-pulse">
          <div className="aspect-square bg-black/5 dark:bg-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-1/2" />
            <div className="h-5 bg-black/5 dark:bg-white/5 rounded w-1/3" />
            <div className="h-9 bg-black/5 dark:bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [cartToast, setCartToast] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (category) params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      params.set("sort", sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setPagination(json.pagination);
      } else {
        setError(json.message || "পণ্য লোড করতে ব্যর্থ");
      }
    } catch {
      setError("পণ্য লোড করতে ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, [page, category, search, sort]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategories([]);
      const res = await fetch("/api/categories", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        const list = Array.isArray(json.data) ? (json.data as ShopCategory[]) : [];
        const normalized = list
          .filter((c) => c && typeof c.name === "string" && typeof c.slug === "string")
          .map((c) => ({ name: c.name, slug: c.slug }));

        const seen = new Set<string>();
        const unique = normalized.filter((c) => {
          const key = c.slug;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setCategories(unique);
      }
    } catch {
      // keep sidebar usable even if categories fail
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, category, sort, page, router]);

  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(false), 2000);
    return () => clearTimeout(t);
  }, [cartToast]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat === category ? "" : cat);
    setPage(1);
  }

  function handleQuickBuy(product: ShopProduct) {
    setSelectedProduct(product);
    setProductModalOpen(true);
  }

  function handleBuyNow(selection: ProductSelection) {
    if (!session) {
      savePendingCartAction({ action: "buyNow", selection });
      setProductModalOpen(false);
      setLoginModalOpen(true);
      return;
    }
    addToCart(selection);
    setProductModalOpen(false);
    router.push("/checkout");
  }

  function handleAddToCart(selection: ProductSelection) {
    if (!session) {
      savePendingCartAction({ action: "addToCart", selection });
      setProductModalOpen(false);
      setLoginModalOpen(true);
      return;
    }
    addToCart(selection);
    setProductModalOpen(false);
    setCartToast(true);
  }

  const modalProduct = useMemo(() => {
    if (!selectedProduct) return null;
    const sp = selectedProduct;
    return {
      id: sp._id,
      name: sp.name,
      description: sp.shortDescription,
      image: sp.images.main,
      originalPrice: sp.pricing.regularPrice,
      currentPrice: sp.pricing.salePrice ?? sp.pricing.regularPrice,
      sizes: sp.sizes.map((s) => ({
        label: s.label,
        stock: s.stock,
        lowStockAlert: s.lowStockAlert ?? 10,
        measurement: s.measurement,
      })),
      colors: sp.colors,
      totalStock: sp.totalStock,
      status: sp.status as "Active" | "Draft" | "Out of Stock" | "Archived",
    };
  }, [selectedProduct]);

  return (
    <>
      <main className="min-h-[60vh] pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2 font-bengali">
              সব প্রোডাক্ট
            </h1>
            <p className="text-black/70 dark:text-white/70 font-bengali">
              ES FITT-এর প্রিমিয়াম কালেকশন ব্রাউজ করুন
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="প্রোডাক্ট খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/50 outline-none transition-colors focus:border-black/40 dark:focus:border-white/40 font-bengali"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
            <div className="flex gap-3">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black text-sm text-black dark:text-white outline-none focus:border-black/40 dark:focus:border-white/40 font-bengali appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black text-sm text-black dark:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
            {/* Sidebar Filters */}
            <aside className={`${mobileFilterOpen ? "block" : "hidden"} lg:block mb-6 lg:mb-0`}>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
                <h3 className="text-sm font-bold text-black dark:text-white mb-4 font-bengali">ক্যাটাগরি</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-bengali ${
                      !category
                        ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium"
                        : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    সব পণ্য
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === cat.slug
                          ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium"
                          : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {(category || search.trim()) && (
                  <button
                    onClick={() => {
                      setCategory("");
                      setSearch("");
                      setSort("newest");
                      setPage(1);
                    }}
                    className="mt-4 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bengali"
                  >
                    ফিল্টার রিসেট
                  </button>
                )}
              </div>
            </aside>

            {/* Product Grid */}
            <div>
              {loading && <ShopSkeleton />}

              {error && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 text-center">
                  <p className="text-red-700 dark:text-red-300 mb-4 font-bengali">{error}</p>
                  <Button variant="outline" size="md" onClick={fetchProducts}>
                    আবার চেষ্টা করুন
                  </Button>
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-12 text-center">
                  <svg className="mx-auto mb-4 w-12 h-12 text-black/10 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-black/70 dark:text-white/70 font-bengali mb-2">কোনো পণ্য পাওয়া যায়নি</p>
                  <p className="text-sm text-black/50 dark:text-white/60 font-bengali">
                    অন্য কীওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন
                  </p>
                </div>
              )}

              {!loading && !error && products.length > 0 && (
                <>
                  {pagination && (
                    <p className="text-sm text-black/60 dark:text-white/70 mb-4 font-bengali">
                      মোট {pagination.total}টি পণ্য
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onQuickBuy={handleQuickBuy}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← আগে
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                page === pageNum
                                  ? "bg-black text-white dark:bg-white dark:text-black"
                                  : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        disabled={page >= (pagination?.totalPages ?? 1)}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        পরে →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalProduct && (
        <ProductDetailModal
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          product={modalProduct}
          onBuyNow={handleBuyNow}
          onAddToCart={handleAddToCart}
          onSizeDetailsClick={() => setSizeChartOpen(true)}
        />
      )}
      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
      <QuickLoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {cartToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 px-5 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-semibold font-bengali shadow-lg animate-fade-in-up pointer-events-none">
          কার্টে যোগ করা হয়েছে!
        </div>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" className="text-black dark:text-white" />
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
