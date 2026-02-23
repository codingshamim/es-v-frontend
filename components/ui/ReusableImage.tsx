"use client";

import Image from "next/image";
import { useState, useCallback, ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface Thumbnail {
  src: string; // Small thumbnail image (for thumbnail display)
  fullSrc: string; // Full resolution image (for main display)
  alt: string;
}

interface ReusableImageProps {
  mainSrc: string;
  mainAlt: string;
  thumbnails: Thumbnail[];
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onImageError?: (error: Error) => void;
  overlayBadges?: {
    topLeft?: ReactNode;
    topRight?: ReactNode;
  };
  className?: string;
  containerClassName?: string;
  thumbnailClassName?: string;
}

const LoadingPlaceholder = () => (
  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 flex items-center justify-center backdrop-blur-sm z-10">
    <div className="flex flex-col items-center gap-3">
      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white animate-spin" />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
        Loading image...
      </p>
    </div>
  </div>
);

const ErrorPlaceholder = () => (
  <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="text-4xl mb-2">⚠️</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Failed to load image
      </p>
    </div>
  </div>
);

export function ReusableImage({
  mainSrc,
  mainAlt,
  thumbnails,
  blurDataURL,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px",
  quality = 100,
  onImageError,
  overlayBadges,
  className = "",
  containerClassName = "bg-gray-100 dark:bg-gray-100 rounded-2xl overflow-hidden",
  thumbnailClassName = "",
}: ReusableImageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [isMainImageLoading, setIsMainImageLoading] = useState(true);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<number>>(
    new Set(),
  );

  const handleMainImageLoad = useCallback(() => {
    setIsMainImageLoading(false);
  }, []);

  const handleMainImageError = useCallback(
    (error: Error) => {
      setMainImageError(true);
      setIsMainImageLoading(false);
      onImageError?.(error);
    },
    [onImageError],
  );

  const handleThumbnailError = useCallback((index: number) => {
    setThumbnailErrors((prev) => new Set(prev).add(index));
  }, []);

  const handlePreviousThumbnail = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? Math.max(0, thumbnails.length - 3) : Math.max(0, prev - 1),
    );
  }, [thumbnails.length]);

  const handleNextThumbnail = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev < thumbnails.length - 1 ? prev + 1 : 0,
    );
  }, [thumbnails.length]);

  const selectThumbnail = useCallback((index: number) => {
    setSelectedThumbnailIndex(index);
    setIsMainImageLoading(true);
    setMainImageError(false);
  }, []);

  const visibleThumbnails = thumbnails.slice(
    currentImageIndex,
    currentImageIndex + 3,
  );

  return (
    <div className={`order-1 lg:order-2 ${thumbnailClassName}`}>
      {/* Main Image Container */}
      <div className={containerClassName}>
        <div className={`aspect-square relative ${className}`}>
          {/* Loading Skeleton */}
          {isMainImageLoading && !mainImageError && <LoadingPlaceholder />}

          {/* Error State */}
          {mainImageError && <ErrorPlaceholder />}

          {/* Main Image */}
          <Image
            src={thumbnails[selectedThumbnailIndex]?.fullSrc || mainSrc}
            alt={thumbnails[selectedThumbnailIndex]?.alt || mainAlt}
            fill
            className="object-cover"
            priority={priority}
            sizes={sizes}
            quality={quality}
            unoptimized
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            onLoad={handleMainImageLoad}
            onError={() => {
              handleMainImageError(new Error("Failed to load main image"));
            }}
          />

          {/* Overlay Badges */}
          {overlayBadges?.topLeft && (
            <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {overlayBadges.topLeft}
            </div>
          )}

          {overlayBadges?.topRight && (
            <div className="absolute top-4 right-4 bg-black/70 text-accent-teal text-xs px-2 py-1 rounded rotate-90 origin-top-right translate-x-full -translate-y-full">
              {overlayBadges.topRight}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {thumbnails.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          {visibleThumbnails.map((thumb, displayIndex) => {
            const actualIndex = currentImageIndex + displayIndex;
            const isSelected = actualIndex === selectedThumbnailIndex;
            const hasError = thumbnailErrors.has(actualIndex);

            return (
              <button
                key={actualIndex}
                onClick={() => selectThumbnail(actualIndex)}
                className={`w-16 h-16 rounded-lg overflow-hidden border cursor-pointer image-gallery-thumb focus:outline-none focus:ring-2 focus:ring-accent-teal transition-all ${
                  isSelected
                    ? "border-accent-teal opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`View image ${actualIndex + 1}`}
                aria-current={isSelected ? "true" : "false"}
              >
                {hasError ? (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                    ✕
                  </div>
                ) : (
                  <Image
                    src={thumb.src}
                    alt={thumb.alt}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    quality={quality}
                    unoptimized
                    onError={() => handleThumbnailError(actualIndex)}
                  />
                )}
              </button>
            );
          })}

          {/* Navigation Arrows */}
          {thumbnails.length > 3 && (
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={handlePreviousThumbnail}
                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-500 hover:text-black dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal"
                aria-label="Previous images"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextThumbnail}
                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-500 hover:text-black dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal"
                aria-label="Next images"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
