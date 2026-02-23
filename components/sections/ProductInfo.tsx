import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { FeatureBadge } from '@/components/ui/FeatureBadge';
import { ShoppingCartIcon } from '@/components/icons';

interface ProductInfoProps {
  title: string;
  discount?: number;
  originalPrice?: number;
  currentPrice: number;
  features?: string[];
  productFeatures?: Array<{ text: string; color?: 'green' | 'blue' | 'teal' }>;
}

export function ProductInfo({
  title,
  discount,
  originalPrice,
  currentPrice,
  features = [],
  productFeatures = [],
}: ProductInfoProps) {
  return (
    <div className="order-2 lg:order-1">
      {discount && (
        <Badge variant="discount" className="mb-4">
          {discount}% ডিসকাউন্ট
        </Badge>
      )}

      <h2 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-6">
        {title}
      </h2>

      {features.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-accent-teal rounded-full" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-black dark:text-white">Fabric</h3>
          </div>

          <ul className="space-y-2.5 text-gray-600 dark:text-gray-400" role="list">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-accent-teal mt-2 flex-shrink-0" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Price originalPrice={originalPrice} currentPrice={currentPrice} className="mb-6" />

      <Button
        icon={<ShoppingCartIcon className="w-5 h-5" />}
        className="w-full sm:w-auto mb-6"
        aria-label="Add to cart"
      >
        <span className="font-bengali">এখনই কিনুন</span>
      </Button>

      <hr className="border-gray-200 dark:border-gray-800 my-6" aria-hidden="true" />

      {productFeatures.length > 0 && (
        <div className="flex flex-wrap items-center gap-6">
          {productFeatures.map((feature, index) => (
            <FeatureBadge key={index} text={feature.text} color={feature.color} />
          ))}
        </div>
      )}
    </div>
  );
}
