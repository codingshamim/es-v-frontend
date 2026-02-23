import Link from "next/link";
import { ReactNode } from "react";

interface NavButtonProps {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "filled";
  className?: string;
  ariaLabel?: string;
}

export function NavButton({
  href,
  children,
  icon,
  variant = "default",
  className = "",
  ariaLabel,
}: NavButtonProps) {
  const variantStyles = {
    default:
      "border border-gray-300 dark:border-[#3a3a3a] text-gray-700 dark:text-[#e0e0e0] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
    filled:
      "bg-black text-white dark:bg-white dark:text-black border border-gray-300 dark:border-[#3a3a3a] hover:bg-black/90 dark:hover:bg-white/90",
  };

  return (
    <Link
      href={href}
      className={`flex active:scale-[98%] transition-all items-center gap-2 px-4 py-2 rounded-md text-sm  font-bengali ${variantStyles[variant]} ${className}`}
      aria-label={ariaLabel}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}
