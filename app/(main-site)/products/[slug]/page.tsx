"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart";
import { addReview } from "@/app/actions/reviews";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import {
  QuickLoginModal,
  SizeChartModal,
} from "@/components/modals";

interface ProductColor {
  name: string;
  hex: string;
  image?: string | null;
}

interface ProductSize {
  label: string;
  stock: number;
  lowStockAlert: number;
  measurement?: string | null;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  pricing: {
    regularPrice: number;
    salePrice: number | null;
    discount: number;
  };
  images: { main: string; gallery: string[] };
  colors: ProductColor[];
  sizes: ProductSize[];
  features: string[];
  totalStock: number;
  status: string;
  ratings: { average: number; count: number };
  soldCount: number;
  category: string;
}

interface ReviewData {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: { regularPrice: number; salePrice: number | null; discount: number };
  images: { main: string };
  ratings: { average: number; count: number };
}

const COLORS_FOR_AVATAR = [
  "bg-accent-teal",
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-green-600",
  "bg-indigo-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-yellow-500",
];

function StarRating({
  rating,
  size = "sm",
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const cls = size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <svg
            className={`${cls} ${star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: ReviewData; index: number }) {
  const initial = review.name.charAt(0).toUpperCase();
  const bgColor = COLORS_FOR_AVATAR[index % COLORS_FOR_AVATAR.length];
  const date = new Date(review.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="bg-gray-50 dark:bg-[#111111] rounded-xl p-4 border border-gray-200 dark:border-[#222222]">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold shrink-0`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-black dark:text-white text-sm">{review.name}</h4>
              {review.isVerifiedPurchase && (
                <span className="text-[10px] text-accent-green font-medium bg-accent-green/10 px-1.5 py-0.5 rounded-full">
                  ক্রেতা
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-[#666666] shrink-0">{timeAgo}</span>
          </div>
          <div className="mb-2">
            <StarRating rating={review.rating} />
          </div>
          <p className="text-sm text-gray-600 dark:text-[#a0a0a0] leading-relaxed">
            {review.comment}
          </p>
          {review.images.length > 0 && (
            <div className="flex gap-2 mt-3">
              {review.images.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                  <Image src={img} alt="Review" width={64} height={64} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘন্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} দিন আগে`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} সপ্তাহ আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} মাস আগে`;
  return `${Math.floor(months / 12)} বছর আগে`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart } = useCart();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorName, setSelectedColorName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [validationMsg, setValidationMsg] = useState("");
  const [cartToast, setCartToast] = useState(false);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProduct(json.data);
        setMainImage(json.data.images.main);
      } else {
        setError(json.message || "পণ্য খুঁজে পাওয়া যায়নি");
      }
    } catch {
      setError("পণ্য লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        const res = await fetch(
          `/api/products/${slug}/reviews?page=${page}&limit=10`,
        );
        const json = await res.json();
        if (json.success) {
          if (page === 1) {
            setReviews(json.data);
          } else {
            setReviews((prev) => [...prev, ...json.data]);
          }
          setReviewTotal(json.pagination.total);
        }
      } catch {
        /* silent */
      }
    },
    [slug],
  );

  useEffect(() => {
    if (!slug) return;
    fetchProduct();
    fetchReviews(1);
  }, [slug, fetchProduct, fetchReviews]);

  useEffect(() => {
    if (!product) return;
    fetch(`/api/products?category=${encodeURIComponent(product.category)}&limit=6`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setRelatedProducts(
            json.data.filter(
              (p: RelatedProduct) => p._id !== product._id,
            ).slice(0, 5),
          );
        }
      })
      .catch(() => {});
  }, [product]);

  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(false), 2000);
    return () => clearTimeout(t);
  }, [cartToast]);

  function handleBuyNow() {
    if (!product) return;
    const hasColors = product.colors.length > 0;
    if (!selectedSize || (hasColors && !selectedColor)) {
      setValidationMsg(
        !selectedSize && hasColors && !selectedColor
          ? "সাইজ এবং কালার নির্বাচন করুন"
          : !selectedSize
            ? "সাইজ নির্বাচন করুন"
            : "কালার নির্বাচন করুন",
      );
      return;
    }
    if (!session) {
      setLoginModalOpen(true);
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      image: product.images.main,
      size: selectedSize,
      color: selectedColor || "default",
      colorName: selectedColorName || "Default",
      quantity,
      unitPrice: product.pricing.salePrice ?? product.pricing.regularPrice,
      originalPrice: product.pricing.regularPrice,
    });
    router.push("/checkout");
  }

  function handleAddToCart() {
    if (!product) return;
    const hasColors = product.colors.length > 0;
    if (!selectedSize || (hasColors && !selectedColor)) {
      setValidationMsg(
        !selectedSize && hasColors && !selectedColor
          ? "সাইজ এবং কালার নির্বাচন করুন"
          : !selectedSize
            ? "সাইজ নির্বাচন করুন"
            : "কালার নির্বাচন করুন",
      );
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      image: product.images.main,
      size: selectedSize,
      color: selectedColor || "default",
      colorName: selectedColorName || "Default",
      quantity,
      unitPrice: product.pricing.salePrice ?? product.pricing.regularPrice,
      originalPrice: product.pricing.regularPrice,
    });
    setCartToast(true);
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setLoginModalOpen(true);
      return;
    }
    if (!product) return;
    if (reviewRating < 1) {
      setReviewError("রেটিং দিন");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("মতামত লিখুন");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    const productId =
      typeof product._id === "string" ? product._id : (product._id as { toString?: () => string })?.toString?.() ?? String(product._id);
    const result = await addReview({
      productId,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    if (result.success) {
      setReviewSuccess("রিভিউ সফলভাবে যোগ হয়েছে!");
      setReviewRating(0);
      setReviewComment("");
      fetchReviews(1);
      setReviewPage(1);
    } else {
      setReviewError(result.message || "রিভিউ যোগ করতে ব্যর্থ");
    }
    setReviewSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-accent-teal" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bengali">পণ্য লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400 font-bengali">
            পণ্য পাওয়া যায়নি
          </h2>
          <p className="mb-6 text-sm text-red-600 dark:text-red-400/80 font-bengali">{error}</p>
          <Link href="/shop">
            <Button variant="outline" size="md">
              <span className="font-bengali">শপে ফিরে যান</span>
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const currentPrice = product.pricing.salePrice ?? product.pricing.regularPrice;
  const isOutOfStock = product.totalStock === 0 || product.status === "Out of Stock";
  const allImages = [product.images.main, ...product.images.gallery];

  return (
    <>
      <main className="pb-24 lg:pb-12">
        {/* Product Detail */}
        <section className="py-6 lg:py-12 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              {/* Image Gallery */}
              <div className="relative">
                <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl overflow-hidden aspect-square lg:aspect-[4/5]">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                {isOutOfStock && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-gray-600 text-white text-sm font-bold rounded-full">
                    Out of Stock
                  </div>
                )}
                {!isOutOfStock && product.pricing.discount > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full">
                    -{product.pricing.discount}%
                  </div>
                )}
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/50 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 dark:hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                {allImages.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setMainImage(img)}
                        className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          mainImage === img
                            ? "border-accent-teal"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={img} alt={`${product.name} ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {product.pricing.discount > 0 && (
                  <span className="inline-block px-4 py-1.5 border border-gray-300 dark:border-[#3a3a3a] rounded-full text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {product.pricing.discount}% Discount
                  </span>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-black dark:text-white mb-4">
                  {product.name}
                </h1>
                <p className="text-gray-600 dark:text-[#a0a0a0] text-sm lg:text-base leading-relaxed mb-6">
                  {product.fullDescription || product.shortDescription}
                </p>

                {/* Price */}
                <div className="flex items-center gap-4 mb-6">
                  {product.pricing.salePrice && (
                    <span className="text-gray-400 dark:text-[#666666] line-through text-lg">
                      BDT {product.pricing.regularPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-black dark:text-white">
                    BDT {currentPrice.toFixed(2)}
                  </span>
                </div>

                {/* Ratings */}
                {(product.ratings?.count ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <StarRating rating={Math.round(product.ratings?.average ?? 0)} size="sm" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {(product.ratings?.average ?? 0).toFixed(1)} ({product.ratings?.count ?? 0} রিভিউ)
                    </span>
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-black dark:text-white font-bengali">সাইজ</span>
                      <button
                        onClick={() => setSizeChartOpen(true)}
                        className="text-sm text-accent-teal hover:underline font-bengali"
                      >
                        সাইজ বিস্তারিত
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => {
                        const isOOS = size.stock <= 0;
                        const isSelected = selectedSize === size.label;
                        return (
                          <button
                            key={size.label}
                            disabled={isOOS}
                            onClick={() => {
                              setSelectedSize(size.label);
                              if (validationMsg) setValidationMsg("");
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                              isOOS
                                ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                                : isSelected
                                  ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                                  : "border-gray-300 dark:border-[#3a3a3a] text-gray-700 dark:text-white hover:border-accent-teal hover:text-accent-teal"
                            }`}
                          >
                            {size.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors.length > 0 && (
                  <div className="mb-6">
                    <span className="block text-sm font-medium text-black dark:text-white mb-3 font-bengali">
                      কালার
                      {selectedColorName && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          — {selectedColorName}
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => {
                        const isSelected = selectedColor === color.hex;
                        return (
                          <button
                            key={color.hex}
                            onClick={() => {
                              setSelectedColor(color.hex);
                              setSelectedColorName(color.name);
                              if (validationMsg && selectedSize) setValidationMsg("");
                            }}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                              isSelected
                                ? "ring-2 ring-accent-teal ring-offset-2 ring-offset-white dark:ring-offset-black border-transparent"
                                : "border-gray-300 dark:border-[#3a3a3a] hover:scale-110"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-md border border-gray-300 dark:border-[#3a3a3a] text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) setQuantity(Math.max(1, Math.min(10, v)));
                    }}
                    className="w-16 h-10 rounded-md border border-gray-300 dark:border-[#3a3a3a] bg-transparent text-center text-black dark:text-white focus:outline-none focus:border-accent-teal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    className="w-10 h-10 rounded-md border border-gray-300 dark:border-[#3a3a3a] text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {validationMsg && (
                  <p className="text-sm text-red-500 mb-4 font-bengali">{validationMsg}</p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <button
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-[#3a3a3a] rounded-md text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors font-bengali disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    এখনই কিনুন
                  </button>
                  <button
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#3a3a3a] rounded-md text-black dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-bengali">কার্টে যোগ করুন</span>
                  </button>
                </div>

                {/* Features */}
                {product.features.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Features</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-[#a0a0a0] text-sm">
                      {product.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-2 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Size Chart */}
                {product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Size Chart
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-[#1a1a1a]">
                            <th className="px-4 py-3 text-left text-gray-700 dark:text-white font-medium">Size</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-white font-medium">Measurement</th>
                            <th className="px-4 py-3 text-center text-gray-700 dark:text-white font-medium">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                          {product.sizes.map((size) => (
                            <tr key={size.label} className="hover:bg-gray-50 dark:hover:bg-[#111111]">
                              <td className="px-4 py-3 text-gray-700 dark:text-white">{size.label}</td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-[#a0a0a0]">
                                {size.measurement || "—"}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-[#a0a0a0]">
                                {size.stock > 0 ? size.stock : "Out"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-8 lg:py-12 bg-white dark:bg-black border-t border-gray-200 dark:border-[#1a1a1a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent-teal to-blue-500 rounded-full" />
                  <h2 className="text-xl lg:text-2xl font-bold text-black dark:text-white font-bengali">
                    আপনার পছন্দ হতে পারে
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="flex items-center gap-1 text-accent-teal text-sm hover:gap-2 transition-all"
                >
                  সব দেখুন
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {relatedProducts.map((rp) => {
                  const rpPrice = rp.pricing.salePrice ?? rp.pricing.regularPrice;
                  return (
                    <Link
                      key={rp._id}
                      href={`/products/${rp.slug}`}
                      className="shrink-0 w-[180px] sm:w-[220px] group snap-start"
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-[#2a2a2a] transition-all duration-300 hover:border-accent-teal/50 hover:shadow-xl hover:shadow-accent-teal/5">
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={rp.images.main}
                            alt={rp.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="220px"
                          />
                          {rp.pricing.discount > 0 && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                                -{rp.pricing.discount}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {rp.ratings.count > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <StarRating rating={Math.round(rp.ratings.average)} size="sm" />
                              <span className="text-[10px] text-gray-400">({rp.ratings.count})</span>
                            </div>
                          )}
                          <h3 className="text-sm font-semibold text-black dark:text-white truncate mb-2 group-hover:text-accent-teal transition-colors">
                            {rp.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {rp.pricing.salePrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ৳{rp.pricing.regularPrice}
                              </span>
                            )}
                            <span className="text-base font-bold text-accent-teal">৳{rpPrice}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="py-8 lg:py-12 bg-white dark:bg-black border-t border-gray-200 dark:border-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-black dark:text-white mb-2 font-bengali">
                  রিভিউ সমূহ
                </h2>
                <div className="flex items-center gap-3">
                  <StarRating rating={Math.round(product.ratings?.average ?? 0)} size="md" />
                  <span className="text-gray-600 dark:text-[#888888] text-sm">
                    {(product.ratings?.average ?? 0).toFixed(1)} ({product.ratings?.count ?? 0} রিভিউ)
                  </span>
                </div>
              </div>
            </div>

            {/* Write Review Form */}
            {session ? (
              <form
                onSubmit={handleReviewSubmit}
                className="bg-gray-50 dark:bg-[#111111] rounded-2xl p-4 sm:p-6 mb-8 border border-gray-200 dark:border-[#222222]"
              >
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4 font-bengali">
                  আপনার রিভিউ লিখুন
                </h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-[#888888] mb-2 font-bengali">
                    রেটিং দিন
                  </label>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onChange={setReviewRating}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-[#888888] mb-2 font-bengali">
                    আপনার মতামত
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="এই প্রোডাক্ট সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
                    className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333333] rounded-xl text-black dark:text-white placeholder-gray-400 dark:placeholder-[#666666] focus:outline-none focus:border-accent-teal resize-none text-sm"
                    maxLength={2000}
                  />
                </div>
                {reviewError && (
                  <p className="text-sm text-red-500 mb-3 font-bengali">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-sm text-accent-green mb-3 font-bengali">{reviewSuccess}</p>
                )}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-accent-teal text-white rounded-xl text-sm font-medium hover:bg-accent-teal/90 transition-colors font-bengali disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {reviewSubmitting && <Spinner size="sm" className="text-white" />}
                  রিভিউ সাবমিট করুন
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 dark:bg-[#111111] rounded-2xl p-6 mb-8 border border-gray-200 dark:border-[#222222] text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4 font-bengali">
                  রিভিউ দিতে লগিন করুন
                </p>
                <Button variant="secondary" size="sm" onClick={() => setLoginModalOpen(true)}>
                  <span className="font-bengali">লগিন করুন</span>
                </Button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <ReviewCard key={review._id} review={review} index={i} />
                ))}
                {reviews.length < reviewTotal && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        const next = reviewPage + 1;
                        setReviewPage(next);
                        fetchReviews(next);
                      }}
                      className="px-8 py-3 border border-gray-300 dark:border-[#3a3a3a] rounded-xl text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors font-bengali"
                    >
                      আরো দেখুন
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 font-bengali">
                এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
      <QuickLoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Cart Toast */}
      {cartToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 px-5 py-3 rounded-xl bg-accent-green text-white text-sm font-semibold font-bengali shadow-lg animate-fade-in-up pointer-events-none">
          কার্টে যোগ করা হয়েছে!
        </div>
      )}
    </>
  );
}
