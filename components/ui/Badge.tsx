import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'discount' | 'new' | 'feature';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    discount: 'bg-red-500 text-white',
    new: 'bg-accent-blue text-white',
    feature: 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400',
  };

  return (
    <span className={`inline-block px-4 py-1.5 rounded-md text-sm font-bengali ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
