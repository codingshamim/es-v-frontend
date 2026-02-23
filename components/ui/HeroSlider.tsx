"use client";

import { useEffect, useState, useCallback } from "react";

import { ShoppingCartIcon } from "@/components/icons";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { ReusableImage } from "@/components/ui/ReusableImage";

interface Thumbnail {
  src: string;
  fullSrc: string;
  alt: string;
}

interface Product {
  _id: string;
  name: string;
  pricing: {
    regularPrice: number;
    salePrice: number | null;
    discount: number;
  };
  images: {
    main: string;
    gallery: string[];
  };
  features: string[];
}

interface HeroSliderProps {
  products: Product[];
}

const SLIDE_INTERVAL = 5000; // 5 seconds auto-play

export function HeroSlider({ products }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);

  // Generate thumbnails for current product
  useEffect(() => {
    const product = products[currentIndex];
    if (!product) return;

    const mainImageUrl = product.images?.main || "";
    const galleryImages = product.images?.gallery || [];

    const mainThumbnail: Thumbnail = {
      src: mainImageUrl.includes("w=")
        ? mainImageUrl.replace(/w=\d+/g, "w=200").replace(/h=\d+/g, "h=200")
        : `${mainImageUrl}?w=200&h=200&fit=crop&q=100`,
      fullSrc: mainImageUrl.includes("w=")
        ? mainImageUrl.replace(/w=\d+/g, "w=1200").replace(/h=\d+/g, "h=1200")
        : `${mainImageUrl}?w=1200&h=1200&fit=crop&q=100`,
      alt: "Product main image",
    };

    const galleryThumbnails: Thumbnail[] = galleryImages
      .slice(0, 3)
      .map((img: string, index: number) => ({
        src: img.includes("w=")
          ? img.replace(/w=\d+/g, "w=200").replace(/h=\d+/g, "h=200")
          : `${img}?w=200&h=200&fit=crop&q=100`,
        fullSrc: img.includes("w=")
          ? img.replace(/w=\d+/g, "w=1200").replace(/h=\d+/g, "h=1200")
          : `${img}?w=1200&h=1200&fit=crop&q=100`,
        alt: `Product view ${index + 1}`,
      }));

    setTimeout(() => {
      setThumbnails([mainThumbnail, ...galleryThumbnails]);
    }, 0);
  }, [currentIndex, products]);

  const handlePrevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));

    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, products.length]);

  const handleNextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));

    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, products.length]);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlay || products.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoPlay, products.length]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning],
  );

  if (!products || products.length === 0) return null;

  const product = products[currentIndex];
  const currentPrice =
    product.pricing.salePrice || product.pricing.regularPrice;
  const originalPrice = product.pricing.regularPrice;
  const discount = product.pricing.discount;
  const displayDiscount = discount > 0 ? `-${discount}%` : "";

  return (
    <section
      className="py-8 lg:py-16 bg-white dark:bg-black"
      aria-label="Featured products slider"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Product Info */}
          <div className="order-2 lg:order-1">
            {/* Discount Badge */}
            {discount > 0 && (
              <span className="inline-block px-4 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 mb-4 font-bengali">
                {displayDiscount} ডিসকাউন্ট
              </span>
            )}

            {/* Product Title */}
            <h2 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-6">
              {product.name}
            </h2>

            {/* Features Section */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-1 h-6 bg-accent-teal rounded-full"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Features
                  </h3>
                </div>

                <ul
                  className="space-y-2.5 text-gray-600 dark:text-gray-400"
                  role="list"
                >
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span
                        className="w-2 h-2 rounded-full bg-accent-teal mt-2 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              {originalPrice !== currentPrice && (
                <span
                  className="text-gray-400 dark:text-gray-500 line-through text-lg"
                  aria-label="Original price"
                >
                  BDT {originalPrice.toFixed(2)}
                </span>
              )}
              <span
                className="text-2xl font-bold text-black dark:text-white"
                aria-label="Current price"
              >
                BDT {currentPrice.toFixed(2)}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-white dark:bg-black cursor-pointer active:scale-[98%] border dark:border-[#333333] rounded-lg text-black dark:text-white font-medium transition-all hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:shadow-lg"
              aria-label="Add to cart"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span className="font-bengali">এখনই কিনুন</span>
            </button>

            {/* Divider */}
            <hr
              className="border-gray-200 dark:border-gray-800 my-6"
              aria-hidden="true"
            />

            {/* Slide Counter and Navigation */}
            <div className="flex items-center justify-between">
              {/* Slide Counter */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-black dark:text-white">
                  {currentIndex + 1}
                </span>
                /<span className="ml-1">{products.length}</span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevSlide}
                  disabled={isTransitioning}
                  className="w-10 h-10 rounded-full cursor-pointer border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 dark:hover:border-white hover:text-black hover:border-black dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous product"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={isTransitioning}
                  className="w-10 h-10 rounded-full cursor-pointer border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 dark:hover:border-white hover:text-black hover:border-black dark:hover:text-white  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next product"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dot Indicators */}
            {products.length > 1 && (
              <div className="flex items-center gap-2 mt-6">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    disabled={isTransitioning}
                    className={`transition-all disabled:cursor-not-allowed ${
                      index === currentIndex
                        ? "bg-black dark:bg-white w-8 h-2 rounded-full"
                        : "bg-gray-300 dark:bg-gray-700 w-2 h-2 rounded-full hover:bg-accent-teal/50"
                    }`}
                    aria-label={`Go to product ${index + 1}`}
                    aria-current={index === currentIndex ? "true" : "false"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Image Gallery */}
          {thumbnails.length > 0 && (
            <ReusableImage
              mainSrc={thumbnails[0].fullSrc}
              mainAlt={product.name}
              priority
              quality={100}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px"
              thumbnails={thumbnails}
              overlayBadges={{
                topLeft: "FEATURED",
                topRight: "FABRILIFE",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
