import type { Product, ProductSize, ProductColor } from "./types";

/** Raw product from featured API (Mongoose lean) */
export interface FeaturedProductResponse {
  _id: { toString(): string };
  name: string;
  slug?: string;
  shortDescription?: string;
  pricing: {
    regularPrice: number;
    salePrice: number | null;
    discount?: number;
  };
  images: { main: string; gallery?: string[] };
  colors?: Array<{
    name: string;
    hex: string;
    image?: string | null;
  }>;
  sizes?: Array<{
    label: string;
    stock: number;
    lowStockAlert?: number;
    measurement?: string | null;
  }>;
  totalStock?: number;
  status?: "Active" | "Draft" | "Out of Stock" | "Archived";
}

export function mapFeaturedProduct(raw: FeaturedProductResponse): Product {
  const regularPrice = raw.pricing?.regularPrice ?? 0;
  const salePrice = raw.pricing?.salePrice ?? null;
  const currentPrice = salePrice ?? regularPrice;
  const discount = raw.pricing?.discount ?? (salePrice != null && regularPrice > 0
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0);
  const savings = discount > 0 ? regularPrice - currentPrice : undefined;
  const sizes: ProductSize[] = (raw.sizes ?? []).map((s) => ({
    label: s.label,
    stock: s.stock ?? 0,
    lowStockAlert: s.lowStockAlert ?? 10,
    measurement: s.measurement ?? undefined,
  }));

  const colors: ProductColor[] = (raw.colors ?? []).map((c) => ({
    name: c.name,
    hex: c.hex,
    image: c.image ?? undefined,
  }));

  return {
    id: raw._id.toString(),
    slug: raw.slug,
    name: raw.name,
    description: raw.shortDescription ?? "",
    image: raw.images?.main ?? "",
    originalPrice: regularPrice,
    currentPrice,
    discount: discount > 0 ? discount : undefined,
    badge: discount > 0 ? `-${discount}%` : "NEW",
    badgeColor: discount > 0 ? "red" : "blue",
    savings,
    sizes,
    colors,
    totalStock: raw.totalStock ?? sizes.reduce((sum, s) => sum + s.stock, 0),
    status: raw.status,
  };
}
