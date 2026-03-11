"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ShopIcon, ContactIcon, ShoppingCartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";

export function MobileNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.length;

  const isHome = pathname === "/" || pathname === "";
  const isShop = pathname.startsWith("/shop") || pathname.startsWith("/products");
  const isContact = pathname.startsWith("/contact");
  const isCart = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto 
                 bg-white/90 dark:bg-black/90 backdrop-blur-xl
                 border-t border-black/10 dark:border-white/10
                 shadow-[0_-8px_30px_rgba(0,0,0,0.18)]
                 lg:bottom-6 lg:w-[360px] lg:rounded-2xl lg:border
                 lg:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2 lg:px-4 lg:py-3">
        <Link
          href="/" 
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            isHome ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"
          }`}
          aria-label="Home"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isHome
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-black/5 dark:bg-white/10"
          }`}>
            <HomeIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Home</span>
        </Link>
        
        <Link
          href="/shop" 
          className={`flex flex-col items-center gap-1 px-4 py-2 hover:text-black dark:hover:text-white transition-colors ${
            isShop ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"
          }`}
          aria-label="Shop"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isShop
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}>
            <ShopIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Shop</span>
        </Link>
        
        <Link
          href="/contact" 
          className={`flex flex-col items-center gap-1 px-4 py-2 hover:text-black dark:hover:text-white transition-colors ${
            isContact ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"
          }`}
          aria-label="Contact"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isContact
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}>
            <ContactIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Contact</span>
        </Link>
        
        <Link
          href="/cart" 
          className={`flex flex-col items-center gap-1 px-4 py-2 hover:text-black dark:hover:text-white transition-colors ${
            isCart ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"
          }`}
          aria-label="Shopping cart"
        >
          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isCart
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}>
            <ShoppingCartIcon className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] font-semibold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-xs">Cart</span>
        </Link>
      </div>
    </nav>
  );
}
