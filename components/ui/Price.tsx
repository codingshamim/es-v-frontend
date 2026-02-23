interface PriceProps {
  originalPrice?: number;
  currentPrice: number;
  currency?: string;
  showSavings?: boolean;
  className?: string;
}

export function Price({
  originalPrice,
  currentPrice,
  currency = 'BDT',
  showSavings = false,
  className = '',
}: PriceProps) {
  const savings = originalPrice && originalPrice > currentPrice ? originalPrice - currentPrice : 0;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {originalPrice && originalPrice > currentPrice && (
        <span className="text-gray-400 dark:text-gray-500 line-through text-lg" aria-label="Original price">
          {currency} {originalPrice.toFixed(2)}
        </span>
      )}
      <span className="text-2xl font-bold text-black dark:text-white" aria-label="Current price">
        {currency} {currentPrice.toFixed(2)}
      </span>
      {showSavings && savings > 0 && (
        <span className="text-accent-green text-sm font-medium">
          Save {currency} {savings.toFixed(2)}
        </span>
      )}
    </div>
  );
}
