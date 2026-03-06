"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { CartProvider } from "@/lib/cart";
import { PendingCartActionHandler } from "@/components/PendingCartActionHandler";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          <PendingCartActionHandler />
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
