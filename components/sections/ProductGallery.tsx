import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

interface Thumbnail {
  src: string;
  alt: string;
  active?: boolean;
}

interface ProductGalleryProps {
  mainImage: string;
  mainImageAlt: string;
  thumbnails: Thumbnail[];
  badges?: Array<{ text: string; position: 'top-left' | 'top-right'; className?: string }>;
}

export function ProductGallery({
  mainImage,
  mainImageAlt,
  thumbnails,
  badges = [],
}: ProductGalleryProps) {
  return (
    <div className="order-1 lg:order-2">
      <div className="bg-gray-100 dark:bg-gray-100 rounded-2xl overflow-hidden">
        <div className="aspect-square relative">
          <Image
            src={mainImage}
            alt={mainImageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {badges.map((badge, index) => {
            const positionStyles = {
              'top-left': 'top-4 left-4',
              'top-right': 'top-4 right-4',
            };
            return (
              <div
                key={index}
                className={`absolute ${positionStyles[badge.position]} bg-black/70 text-white text-xs px-2 py-1 rounded ${badge.className || ''}`}
              >
                {badge.text}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        {thumbnails.map((thumbnail, index) => (
          <button
            key={index}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
              thumbnail.active
                ? 'border-accent-teal opacity-100'
                : 'border-transparent opacity-60 hover:opacity-100'
            } cursor-pointer image-gallery-thumb focus:outline-none focus:ring-2 focus:ring-accent-teal`}
            aria-label={`View thumbnail ${index + 1}`}
          >
            <Image
              src={thumbnail.src}
              alt={thumbnail.alt}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <button
            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-500 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
          <button
            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-500 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
