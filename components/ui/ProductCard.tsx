"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProductImage } from "./ProductImage";
import { ProductBadge } from "./ProductBadge";
import { ProductPrice } from "./ProductPrice";
import { Button } from "./Button";
import { ShoppingCartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import {
  ProductDetailModal,
  SizeChartModal,
  QuickLoginModal,
  type ProductSelection,
} from "@/components/modals";
import { savePendingCartAction } from "@/lib/pending-cart-action";
import type { Product } from "@/lib/types";

interface ProductCardProps extends Product {
  badgeColor?: "red" | "blue";
}

export function ProductCard({
  id,
  name,
  description,
  image,
  slug,
  originalPrice,
  currentPrice,
  badge,
  badgeColor = "red",
  savings,
  sizes = [],
  totalStock,
  status,
  colors = [],
}: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();

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

  const handleSizeDetailsClick = useCallback(() => {
    setSizeChartOpen(true);
  }, []);

  const badgeVariant = badgeColor === "red" ? "discount" : "new";
  const isOutOfStock = (totalStock ?? 0) === 0 || status === "Out of Stock";
  const hasLowStock =
    !isOutOfStock &&
    sizes.some((s) => s.stock > 0 && s.stock <= (s.lowStockAlert ?? 10));

  return (
    <>
      <article className="product-card bg-gray-50 dark:bg-black rounded-2xl overflow-hidden border border-gray-200 dark:border-[#222222]">
        <Link href={`/products/${id}`} className="block">
          <div className="relative">
            <ProductImage src={image} alt={name} />
            {isOutOfStock && (
              <ProductBadge
                text="Out of stock"
                variant="discount"
                className="bg-gray-600! dark:bg-gray-500! text-white!"
              />
            )}
            {!isOutOfStock && badge && (
              <ProductBadge text={badge} variant={badgeVariant} />
            )}
            {hasLowStock && (
              <ProductBadge
                text="Low stock"
                variant="discount"
                className="top-4 left-auto right-4 bg-amber-500! dark:bg-amber-600! text-white!"
              />
            )}
          </div>
        </Link>
        <div className="p-4">
          <Link href={`/products/${slug}`}>
            <h3 className="font-semibold text-black dark:text-white mb-2 hover:text-accent-teal transition-colors">
              {name}
            </h3>
          </Link>
          <p className="text-gray-500 dark:text-[#888888] text-sm mb-3 line-clamp-2">
            {description}
          </p>
          {sizes.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5 mb-3"
              role="list"
              aria-label="Available sizes"
            >
              {sizes.map((size) => {
                const outOfStock = size.stock === 0;
                const alertThreshold = size.lowStockAlert ?? 10;
                const lowStock = !outOfStock && size.stock <= alertThreshold;
                return (
                  <span
                    key={size.label}
                    role="listitem"
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${outOfStock
                        ? "bg-gray-200 dark:bg-[#1b1b1b] text-gray-500 dark:text-gray-400 line-through"
                        : lowStock
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#333333]"
                      }`}
                    title={
                      outOfStock
                        ? `${size.label} – Out of stock`
                        : lowStock
                          ? `${size.label} – Low stock (${size.stock} left)`
                          : size.label
                    }
                  >
                    {size.label}
                    {outOfStock && (
                      <span className="ml-1 text-[10px] opacity-80">
                        (Out of stock)
                      </span>
                    )}
                    {lowStock && (
                      <span className="ml-1 text-[10px] font-medium">
                        (Low stock)
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          <ProductPrice
            originalPrice={originalPrice}
            currentPrice={currentPrice}
            savings={savings}
          />
          <Button
            icon={<ShoppingCartIcon className="w-4 h-4" />}
            variant="secondary"
            size="sm"
            fullWidth
            disabled={isOutOfStock}
            aria-label={
              isOutOfStock ? `${name} is out of stock` : `Add ${name} to cart`
            }
            className={isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}
            onClick={isOutOfStock ? undefined : () => setProductModalOpen(true)}
          >
            <span className="font-bengali">
              {isOutOfStock ? "স্টক নেই" : "এখনই কিনুন"}
            </span>
          </Button>
        </div>
      </article>

      <ProductDetailModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={{ id, name, description, image, originalPrice, currentPrice, sizes, totalStock, status, colors }}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onSizeDetailsClick={handleSizeDetailsClick}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 px-5 py-3 rounded-xl bg-accent-green text-white text-sm font-semibold font-bengali shadow-lg animate-fade-in-up pointer-events-none">
          কার্টে যোগ করা হয়েছে!
        </div>
      )}
    </>
  );
}
