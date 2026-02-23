interface ProductBadgeProps {
  text: string;
  variant?: 'discount' | 'new';
  className?: string;
}

export function ProductBadge({ text, variant = 'discount', className = '' }: ProductBadgeProps) {
  const variantStyles = {
    discount: 'bg-red-500',
    new: 'bg-accent-blue',
  };

  return (
    <span className={`absolute top-4 left-4 ${variantStyles[variant]} text-white text-xs font-bold px-2 py-1 rounded ${className}`}>
      {text}
    </span>
  );
}
