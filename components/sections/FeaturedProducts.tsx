"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { mapFeaturedProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import {
  ProductDetailModal,
  SizeChartModal,
  QuickLoginModal,
  type ProductSelection,
} from "@/components/modals";
import { savePendingCartAction } from "@/lib/pending-cart-action";
import { Spinner } from "@/components/ui/Spinner";
import { ReusableImage } from "@/components/ui/ReusableImage";

const FEATURED_API = "/api/products/featured";
const LIMIT = 8;

import ProductCardSkeleton from "./ProductCardSkeleton";

function FeaturedProductsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 text-center"
      role="alert"
    >
      <p className="text-red-700 dark:text-red-300 mb-4 font-bengali">
        {message}
      </p>
      <Button
        variant="outline"
        size="md"
        onClick={onRetry}
        aria-label="Try again"
      >
        আবার চেষ্টা করুন
      </Button>
    </div>
  );
}

function FeaturedProductsEmpty() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#0a0a0a] p-12 text-center">
      <p className="text-gray-600 dark:text-gray-400 font-bengali mb-2">
        এই মুহূর্তে ফিচার্ড প্রোডাক্ট নেই।
      </p>
      <Link href="/shop">
        <Button variant="outline" size="md">
          সব প্রোডাক্ট দেখুন
        </Button>
      </Link>
    </div>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const handleBuyNow = useCallback(
    (selection: ProductSelection) => {
      if (!session) {
        savePendingCartAction({ action: "buyNow", selection });
        setProductModalOpen(false);
        setLoginModalOpen(true);
        return;
      }
      addToCart(selection);
      setProductModalOpen(false);
      router.push("/checkout");
    },
    [session, addToCart, router],
  );

  const handleAddToCart = useCallback(
    (selection: ProductSelection) => {
      if (!session) {
        savePendingCartAction({ action: "addToCart", selection });
        setProductModalOpen(false);
        setLoginModalOpen(true);
        return;
      }
      addToCart(selection);
      setProductModalOpen(false);
      setToastVisible(true);
    },
    [session, addToCart],
  );

  const handleQuickBuyClick = () => {
    if ((product.totalStock ?? 0) === 0 || product.status === "Out of Stock") {
      return;
    }
    setProductModalOpen(true);
  };

  const currentPrice = product.currentPrice;
  const hasDiscount = (product.discount ?? 0) > 0;
  const isOutOfStock =
    (product.totalStock ?? 0) === 0 || product.status === "Out of Stock";

  return (
    <div className="group h-full bg-white dark:bg-black rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 flex flex-col">
      <Link href={`/products/${product.slug ?? product.id}`} className="block">
        <ReusableImage
          mainSrc={product.image}
          mainAlt={product.name}
          thumbnails={[]}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          containerClassName="relative aspect-square overflow-hidden bg-gray-100 dark:bg-black"
          className=""
          overlayBadges={{
            topLeft: hasDiscount ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                -{product.discount}%
              </span>
            ) : null,
          }}
        />
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/products/${product.slug ?? product.id}`}>
          <h3 className="font-semibold text-black dark:text-white mb-1 hover:text-black/70 dark:hover:text-white/80 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 dark:text-[#888888] text-xs mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center gap-2 mb-3">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              BDT {product.originalPrice.toFixed(0)}
            </span>
          )}
          <span className="text-base font-bold text-black dark:text-white">
            BDT {currentPrice.toFixed(0)}
          </span>
        </div>
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickBuyClick}
          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
        >
          {isOutOfStock ? "স্টক নেই" : "এখনই কিনুন"}
        </button>
      </div>
      <ProductDetailModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          originalPrice: product.originalPrice,
          currentPrice: product.currentPrice,
          sizes: product.sizes ?? [],
          totalStock: product.totalStock ?? 0,
          status: product.status ?? "Active",
          colors: product.colors ?? [],
        }}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onSizeDetailsClick={() => setSizeChartOpen(true)}
      />
      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
      />
      <QuickLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
      {toastVisible && (
        <div className="fixed bottom-6.left-1/2 -translate-x-1/2 z-200 px-5 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-semibold font-bengali shadow-lg animate-fade-in-up pointer-events-none">
          কার্টে যোগ করা হয়েছে!
        </div>
      )}
    </div>
  );
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchFeatured = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch(FEATURED_API, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(
          json?.message ??
            "Failed to load featured products. Please try again.",
        );
        setStatus("error");
        return;
      }

      if (!json?.success || !Array.isArray(json.data)) {
        setProducts([]);
        setStatus("success");
        return;
      }

      const mapped = (json.data as unknown[])
        .slice(0, LIMIT)
        .map((raw) =>
          mapFeaturedProduct(raw as Parameters<typeof mapFeaturedProduct>[0]),
        );
      setProducts(mapped);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Schedule fetch outside effect tick to avoid synchronous setState in effect (cascading renders)
    const tid = setTimeout(() => fetchFeatured(), 0);
    return () => clearTimeout(tid);
  }, [fetchFeatured]);

  const isLoading = status === "loading";
  const isError = status === "error";
  const isEmpty = status === "success" && products.length === 0;

  return (
    <section
      className="py-12 lg:py-20 bg-white dark:bg-black"
      aria-labelledby="featured-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="শুধু আপনার জন্য"
          description="ES FITT-এর সাথে উন্নত করুন আপনার স্টাইল — যেখানে প্রতিটি ডিজাইন ব্যক্তিত্বের প্রতিফলন বহন করে।"
          titleId="featured-heading"
        />

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <FeaturedProductsError
            message={errorMessage}
            onRetry={fetchFeatured}
          />
        )}

        {isEmpty && <FeaturedProductsEmpty />}

        {status === "success" && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-10 text-center flex justify-center items-center">
              <Link href="/shop">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="View all products in shop"
                >
                  <span className="font-bengali">আরও দেখুন</span>
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
