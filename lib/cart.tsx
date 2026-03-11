"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

type AddToCartInput = Omit<CartItem, "cartItemId">;

interface CartContextType {
  items: CartItem[];
  addToCart: (item: AddToCartInput) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartSavings: () => number;
  getCartCount: () => number;
}

const STORAGE_KEY = "es-fitt-cart";

function generateCartItemId(productId: string, size: string, color: string) {
  return `${productId}-${size}-${color}`;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Always start with the same value on server and client to avoid hydration mismatches.
  // Then, after mount, load the persisted cart from localStorage.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as CartItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addToCart = useCallback((input: AddToCartInput) => {
    const cartItemId = generateCartItemId(input.productId, input.size, input.color);

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + input.quantity,
        };
        return updated;
      }
      return [...prev, { ...input, cartItemId }];
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getCartTotal = useCallback(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  const getCartSavings = useCallback(
    () =>
      items.reduce(
        (sum, i) => sum + (i.originalPrice - i.unitPrice) * i.quantity,
        0
      ),
    [items]
  );

  const getCartCount = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartSavings,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
