import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-white dark:bg-[#1a1a1a] border dark:border-[#333333] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]",
    secondary:
      "dark:bg-white cursor-pointer dark:text-black dark:hover:bg-white/80 bg-black text-white hover:bg-[#1a1a1a]/80 border dark:border-[#333333]",
    outline:
      "border border-gray-300 dark:border-[#333333] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""} ${variantStyles[variant]} ${sizeStyles[size]} rounded-lg font-medium transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:opacity-70 ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
