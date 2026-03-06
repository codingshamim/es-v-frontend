"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import {
  getPendingCartAction,
  clearPendingCartAction,
} from "@/lib/pending-cart-action";

/**
 * After login redirect, if there was a pending add-to-cart or buy-now action,
 * execute it and navigate accordingly.
 */
export function PendingCartActionHandler() {
  const { data: session, status } = useSession();
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const pending = getPendingCartAction();
    if (!pending) return;

    clearPendingCartAction();

    addToCart({
      productId: pending.selection.productId,
      name: pending.selection.name,
      image: pending.selection.image,
      size: pending.selection.size,
      color: pending.selection.color,
      colorName: pending.selection.colorName,
      quantity: pending.selection.quantity,
      unitPrice: pending.selection.unitPrice,
      originalPrice: pending.selection.originalPrice,
    });

    if (pending.action === "buyNow") {
      router.push("/checkout");
    } else {
      router.push("/cart");
    }
  }, [status, session, addToCart, router]);

  return null;
}
