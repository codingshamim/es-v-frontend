"use client";

import { useState, useCallback } from "react";
import { CloseIcon } from "@/components/icons";
import type { Product, ProductColor } from "@/lib/types";
import { ReusableImage } from "@/components/ui/ReusableImage";

export interface ProductSelection {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product & { id: string };
  onBuyNow: (selection: ProductSelection) => void;
  onAddToCart: (selection: ProductSelection) => void;
  onSizeDetailsClick?: () => void;
}

export function ProductDetailModal({
  open,
  onClose,
  product,
  onBuyNow,
  onAddToCart,
  onSizeDetailsClick,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedColorName, setSelectedColorName] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [validationMsg, setValidationMsg] = useState("");

  const buildSelection = useCallback((): ProductSelection => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    size: selectedSize,
    color: selectedColor,
    colorName: selectedColorName,
    quantity,
    unitPrice: product.currentPrice,
    originalPrice: product.originalPrice,
  }), [product, selectedSize, selectedColor, selectedColorName, quantity]);

  const hasColors = (product.colors ?? []).length > 0;
  const isValid = selectedSize !== "" && (!hasColors || selectedColor !== "");

  const handleAction = (action: (s: ProductSelection) => void) => {
    if (!isValid) {
      if (!selectedSize && hasColors && !selectedColor) {
        setValidationMsg("সাইজ এবং কালার নির্বাচন করুন");
      } else if (!selectedSize) {
        setValidationMsg("সাইজ নির্বাচন করুন");
      } else {
        setValidationMsg("কালার নির্বাচন করুন");
      }
      return;
    }
    setValidationMsg("");
    action(buildSelection());
  };

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColor(color.hex);
    setSelectedColorName(color.name);
    if (validationMsg && selectedSize) setValidationMsg("");
  };

  const handleSizeSelect = (label: string) => {
    setSelectedSize(label);
    if (validationMsg && selectedColor) setValidationMsg("");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2
            id="product-detail-title"
            className="text-lg font-bold text-gray-900 dark:text-white font-bengali"
          >
            প্রোডাক্ট বিস্তারিত
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Product Info */}
          <div className="flex items-start gap-4">
            <ReusableImage
              mainSrc={product.image}
              mainAlt={product.name}
              thumbnails={[]}
              sizes="80px"
              containerClassName="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800"
              className=""
              thumbnailClassName="w-20 h-20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 font-bengali">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400 line-through">
                  BDT {product.originalPrice}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  BDT {product.currentPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-bengali">
              পরিমাণ
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                className="w-14 h-9 text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                disabled={quantity >= 10}
                aria-label="Increase quantity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-bengali">
                সাইজ
              </span>
              {onSizeDetailsClick && (
                <button
                  type="button"
                  onClick={onSizeDetailsClick}
                  className="text-xs text-gray-700 dark:text-gray-300 hover:underline font-bengali"
                >
                  সাইজ বিস্তারিত
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((size) => {
                const isOutOfStock = size.stock <= 0;
                const isSelected = selectedSize === size.label;
                return (
                  <button
                    key={size.label}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleSizeSelect(size.label)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all border
                      ${isOutOfStock
                        ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                        : isSelected
                          ? "border-black bg-black/5 text-black dark:border-white dark:bg-white/10 dark:text-white"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white"
                      }
                    `}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          {hasColors && (
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-bengali">
                কালার
                {selectedColorName && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    — {selectedColorName}
                  </span>
                )}
              </span>
              <div className="flex flex-wrap gap-3">
                {product.colors!.map((color) => {
                  const isSelected = selectedColor === color.hex;
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`
                        w-9 h-9 rounded-full border-2 transition-all
                        ${isSelected
                          ? "ring-2 ring-black/60 dark:ring-white/60 ring-offset-2 ring-offset-white dark:ring-offset-[#111111] border-transparent"
                          : "border-gray-200 dark:border-gray-700 hover:scale-110"
                        }
                      `}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                      title={color.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Validation message */}
          {validationMsg && (
            <p className="text-sm text-red-500 font-bengali">{validationMsg}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleAction(onBuyNow)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-900 text-gray-900 hover:bg-black/5 dark:border-white dark:text-white dark:hover:bg-white/10 transition-colors font-bengali disabled:opacity-50 disabled:cursor-not-allowed"
            >
              এখনই কিনুন
            </button>
            <button
              type="button"
              onClick={() => handleAction(onAddToCart)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#222] transition-colors font-bengali disabled:opacity-50 disabled:cursor-not-allowed"
            >
              কার্টে যোগ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
