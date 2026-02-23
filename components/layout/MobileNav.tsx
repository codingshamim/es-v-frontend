import Link from 'next/link';
import { HomeIcon, ShopIcon, ContactIcon, ShoppingCartIcon } from '@/components/icons';

export function MobileNav() {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 lg:border backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 lg:w-[30%] mx-auto z-50"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        <Link 
          href="/" 
          className="flex flex-col items-center gap-1 px-4 py-2 text-black dark:text-white"
          aria-label="Home"
        >
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
            <HomeIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Home</span>
        </Link>
        
        <Link 
          href="/shop" 
          className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Shop"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <ShopIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Shop</span>
        </Link>
        
        <Link 
          href="/contact" 
          className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Contact"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <ContactIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Contact</span>
        </Link>
        
        <Link 
          href="/cart" 
          className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Shopping cart"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <ShoppingCartIcon className="w-5 h-5" />
          </div>
          <span className="text-xs">Cart</span>
        </Link>
      </div>
    </nav>
  );
}
