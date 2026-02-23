"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  image: string;
}

interface SizeVariant {
  id: string;
  label: string;
  measurement: string;
  stock: number;
  lowStockAlert: number;
}

const CATEGORIES = [
  "T-Shirts",
  "Polo Shirts",
  "Hoodies",
  "Tank Tops",
  "Long Sleeves",
];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function CreateProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Basic Info
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  // Pricing
  const [regularPrice, setRegularPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // Images
  const [mainImage, setMainImage] = useState("");
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Colors
  const [colors, setColors] = useState<ColorVariant[]>([]);

  // Sizes
  const [sizes, setSizes] = useState<SizeVariant[]>([]);

  // Features
  const [features, setFeatures] = useState<string[]>([]);

  // Status
  const [status, setStatus] = useState("active");
  const [featured, setFeatured] = useState(false);

  const discount =
    regularPrice && salePrice
      ? Math.round(
          ((parseFloat(regularPrice) - parseFloat(salePrice)) /
            parseFloat(regularPrice)) *
            100,
        )
      : 0;

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      // API returns { success, data: { url, filename, size } }
      const url = data.data?.url ?? data.url;
      if (!url || typeof url !== "string") throw new Error("Upload failed");
      return url;
    },
    [],
  );

  const handleMainImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageUploading(true);
    try {
      const url = await uploadImage(file);
      setMainImage(url);
    } catch {
      /* silently fail */
    } finally {
      setMainImageUploading(false);
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files?.length) return;
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => uploadImage(f)),
      );
      const validUrls = urls.filter((u): u is string => Boolean(u && typeof u === "string"));
      setGalleryImages((prev) => [...prev, ...validUrls]);
    } catch {
      /* silently fail */
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleColorImageUpload = async (
    colorId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setColors((prev) =>
        prev.map((c) => (c.id === colorId ? { ...c, image: url } : c)),
      );
    } catch {
      /* silently fail */
    }
  };

  const addColor = () => {
    setColors((prev) => [
      ...prev,
      { id: generateId(), name: "", hex: "#000000", image: "" },
    ]);
  };

  const updateColor = (id: string, field: keyof ColorVariant, value: string) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeColor = (id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
  };

  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        id: generateId(),
        label: "M",
        measurement: "",
        stock: 0,
        lowStockAlert: 5,
      },
    ]);
  };

  const updateSize = (
    id: string,
    field: keyof SizeVariant,
    value: string | number,
  ) => {
    setSizes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const removeSize = (id: string) => {
    setSizes((prev) => prev.filter((s) => s.id !== id));
  };

  const addFeature = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const updateFeature = (index: number, value: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const allImages = [
        ...(mainImage && mainImage.trim() ? [{ url: mainImage, alt: name }] : []),
        ...galleryImages
          .filter((url) => url && typeof url === "string" && url.trim() !== "")
          .map((url) => ({ url, alt: name })),
      ];
      if (allImages.length === 0) {
        setSubmitError("Add at least one image (main or gallery).");
        return;
      }

      const body = {
        name,
        sku,
        category,
        shortDescription: shortDescription.trim() || undefined,
        fullDescription: fullDescription.trim() || undefined,
        price: parseFloat(regularPrice) || 0,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        images: allImages,
        colors: colors.map(({ id: _, ...rest }) => rest),
        sizes: sizes.map(({ id: _, ...rest }) => rest),
        features: features.filter(Boolean),
        status,
        featured,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.message || "Failed to create product.");
        return;
      }
      router.push("/admin/products");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-100 dark:bg-[#1a1a1a] border-none rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40";
  const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-2";
  const sectionClass =
    "bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-6";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Product
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Add a new product to your store
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Cotton T-Shirt"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. TSH-001"
              className={inputClass}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief product description"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Description</label>
            <textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed product description..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Pricing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Regular Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={regularPrice}
              onChange={(e) => setRegularPrice(e.target.value)}
              placeholder="0.00"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Sale Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            {discount > 0 && (
              <div className="w-full bg-teal-500/10 rounded-xl px-4 py-3 text-center">
                <span className="text-sm font-semibold text-teal-500">
                  {discount}% OFF
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Images
        </h2>
        <div className="space-y-4">
          {/* Main Image */}
          <div>
            <label className={labelClass}>Main Image (Thumbnail)</label>
            {mainImage && mainImage.trim() !== "" ? (
              <div className="relative w-40 h-40 rounded-xl overflow-hidden group">
                <Image
                  src={mainImage}
                  alt="Main product"
                  fill
                  className="object-cover"
                  unoptimized={mainImage.startsWith("/")}
                />
                <button
                  type="button"
                  onClick={() => setMainImage("")}
                  className="absolute top-2 right-2 p-1 bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl cursor-pointer hover:border-teal-500/50 transition-colors">
                {mainImageUploading ? (
                  <Spinner size="md" className="text-teal-500" />
                ) : (
                  <>
                    <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Upload image
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Gallery */}
          <div>
            <label className={labelClass}>Gallery Images</label>
            <div className="flex flex-wrap gap-3">
              {galleryImages.map((url, i) => {
                if (!url || typeof url !== "string" || url.trim() === "") return null;
                return (
                  <div
                    key={`${i}-${url}`}
                    className="relative w-28 h-28 rounded-xl overflow-hidden group"
                  >
                    <Image
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={url.startsWith("/")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryImages((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl cursor-pointer hover:border-teal-500/50 transition-colors">
                {galleryUploading ? (
                  <Spinner size="sm" className="text-teal-500" />
                ) : (
                  <>
                    <PlusIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Add images
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Color Variants
          </h2>
          <button
            type="button"
            onClick={addColor}
            className="inline-flex items-center gap-1.5 text-sm text-teal-500 hover:text-teal-400 font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Color
          </button>
        </div>
        {colors.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No color variants added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {colors.map((color) => (
              <div
                key={color.id}
                className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-gray-50 dark:bg-[#0d0d0d] rounded-xl"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div>
                    <label className={labelClass}>Color Name</label>
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) =>
                        updateColor(color.id, "name", e.target.value)
                      }
                      placeholder="e.g. Navy Blue"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hex Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) =>
                          updateColor(color.id, "hex", e.target.value)
                        }
                        className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={color.hex}
                        onChange={(e) =>
                          updateColor(color.id, "hex", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Color Image</label>
                    {color.image && color.image.trim() !== "" ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src={color.image}
                          alt={color.name || "Color"}
                          fill
                          className="object-cover"
                          unoptimized={color.image.startsWith("/")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateColor(color.id, "image", "")
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg cursor-pointer text-xs text-gray-500 hover:text-teal-500 transition-colors">
                        <PhotoIcon className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleColorImageUpload(color.id, e)
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  className="p-2 text-red-500 hover:text-red-400 transition-colors mt-6 sm:mt-0"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sizes */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Size Variants
          </h2>
          <button
            type="button"
            onClick={addSize}
            className="inline-flex items-center gap-1.5 text-sm text-teal-500 hover:text-teal-400 font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Size
          </button>
        </div>
        {sizes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No size variants added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {sizes.map((size) => (
              <div
                key={size.id}
                className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-gray-50 dark:bg-[#0d0d0d] rounded-xl"
              >
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                  <div>
                    <label className={labelClass}>Label</label>
                    <select
                      value={size.label}
                      onChange={(e) =>
                        updateSize(size.id, "label", e.target.value)
                      }
                      className={inputClass}
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Measurement</label>
                    <input
                      type="text"
                      value={size.measurement}
                      onChange={(e) =>
                        updateSize(size.id, "measurement", e.target.value)
                      }
                      placeholder='e.g. 38" chest'
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={size.stock}
                      onChange={(e) =>
                        updateSize(
                          size.id,
                          "stock",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Low Stock Alert</label>
                    <input
                      type="number"
                      min="0"
                      value={size.lowStockAlert}
                      onChange={(e) =>
                        updateSize(
                          size.id,
                          "lowStockAlert",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSize(size.id)}
                  className="p-2 text-red-500 hover:text-red-400 transition-colors mt-6 sm:mt-0"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Features
          </h2>
          <button
            type="button"
            onClick={addFeature}
            className="inline-flex items-center gap-1.5 text-sm text-teal-500 hover:text-teal-400 font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Feature
          </button>
        </div>
        {features.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No features added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder="e.g. 100% premium cotton"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="p-2 text-red-500 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setFeatured(!featured)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  featured ? "bg-teal-600" : "bg-gray-300 dark:bg-[#2a2a2a]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    featured ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Featured Product
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Link
          href="/admin/products"
          className="px-6 py-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {submitting && <Spinner size="sm" className="text-white" />}
          {submitting ? "Creating..." : "Create Product"}
        </button>
      </div>
    </form>
  );
}
