"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { mapFeaturedProduct } from "@/lib/products";
import type { Product } from "@/lib/types";

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
                <ProductCard key={product.id} {...product} />
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
