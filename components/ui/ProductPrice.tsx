interface ProductPriceProps {
  originalPrice?: number;
  currentPrice: number;
  savings?: number;
  currency?: string;
  className?: string;
}

export function ProductPrice({
  originalPrice,
  currentPrice,
  savings,
  currency = 'BDT',
  className = '',
}: ProductPriceProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        {originalPrice && originalPrice > currentPrice && (
          <span className="text-gray-400 dark:text-[#666666] line-through text-sm">
            {currency} {originalPrice.toFixed(2)}
          </span>
        )}
        <span className="text-black dark:text-white font-bold">
          {currency} {currentPrice.toFixed(2)}
        </span>
      </div>
      {savings && savings > 0 && (
        <p className="text-accent-green text-sm font-medium mb-4">
          Save {currency} {savings.toFixed(2)}
        </p>
      )}
      {!savings && originalPrice && originalPrice === currentPrice && (
        <p className="text-accent-blue text-sm font-medium mb-4">New Arrival</p>
      )}
    </div>
  );
}
